// api/_lib/rateLimitDurable.js — a durable per-source rate limit, for the one
// endpoint whose writes are permanent.
//
// ── Why this exists ──
// api/_lib/rateLimit.js is in-memory: the counter lives in a single serverless
// instance, so it resets on cold start and each concurrent instance counts
// separately. That is adequate for /api/verify-challenge, which writes nothing.
// /api/adopt writes a PERMANENT public ledger row — a garbage row is forever —
// so its limit should hold across instances. Decision D1 (2026-10-13): durable
// store for /api/adopt only; /verify-challenge stays in-memory.
//
// ── No new dependency ──
// Vercel KV and Upstash both expose a Redis-compatible REST API reachable with
// plain fetch, so this needs no package. @vercel/kv would add a dependency to do
// what two fetches already do.
//
// ── Modes, and how it reports them ──
// Mode is decided once, at module load, from the environment:
//
//   durable    KV_REST_API_URL + KV_REST_API_TOKEN are set (Vercel KV), or
//              UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash)
//   in-memory  neither pair is set — falls back to createRateLimiter()
//
// It activates automatically: provisioning the store in the Vercel dashboard
// injects the env vars, and the next cold start picks durable mode up with no
// code change. The mode is logged once at init and named in every degradation
// message, so which mode is live is never a guess.
//
// ── Failure policy: fail OPEN to the in-memory limiter ──
// If the KV round-trip errors or times out, this falls back to the in-memory
// counter for that request and logs it. The alternative — refusing the request —
// would mean a KV outage blocks all adoption, turning a rate limit into a single
// point of failure for the covenant's front door. An attacker who can induce KV
// failures gets the weaker limit, which is the limit we ship with today anyway.
//
// ── Window semantics ──
// A fixed window, not a sliding one: INCR a key that carries the window number,
// and EXPIRE it. Two requests either side of a boundary can briefly allow up to
// 2*max, which for max=20 on a once-in-a-lifetime action is irrelevant. The
// in-memory limiter is sliding; the difference is deliberate and not worth the
// extra round-trips a sliding durable window costs.

import { createRateLimiter } from "./rateLimit.js";

function readEnv() {
  const e = process.env;
  if (e.KV_REST_API_URL && e.KV_REST_API_TOKEN) {
    return { url: e.KV_REST_API_URL, token: e.KV_REST_API_TOKEN, provider: "vercel-kv" };
  }
  if (e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN) {
    return { url: e.UPSTASH_REDIS_REST_URL, token: e.UPSTASH_REDIS_REST_TOKEN, provider: "upstash" };
  }
  return null;
}

// Exported for tests: the mode decision is pure, given an env.
export function modeFor(env) {
  return env ? "durable" : "in-memory";
}

export const MODE_NOTE = {
  durable:
    "Durable rate limiting is ACTIVE: the counter is shared across serverless instances.",
  "in-memory":
    "Durable rate limiting is NOT configured — falling back to the in-memory limiter. " +
    "The counter resets on cold start and each concurrent instance counts separately. " +
    "Set KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV) or UPSTASH_REDIS_REST_URL + " +
    "UPSTASH_REDIS_REST_TOKEN (Upstash) to activate it; no code change is needed.",
};

// One pipelined round-trip: INCR the window key, then set its TTL only if the
// key has no TTL yet (NX), so the window does not slide forward on every hit.
async function incrementWindow({ url, token }, key, ttlSeconds, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(ttlSeconds), "NX"],
      ]),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`KV responded ${res.status}`);
    const out = await res.json();
    // Upstash pipeline → [{result: <n>}, {result: 0|1}]
    const count = Array.isArray(out) && out[0] ? Number(out[0].result) : NaN;
    if (!Number.isFinite(count)) throw new Error("KV returned no usable counter");
    return count;
  } finally {
    clearTimeout(timer);
  }
}

export function createDurableRateLimiter({
  max,
  windowMs,
  prefix = "rl",
  timeoutMs = 1000,
  env = readEnv(),
  // Injectable for tests; defaults to the real transport.
  increment = incrementWindow,
  log = console,
}) {
  const fallback = createRateLimiter({ max, windowMs });
  const mode = modeFor(env);
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  log.log(`[rate-limit:${prefix}] mode=${mode}. ${MODE_NOTE[mode]}`);

  return {
    max,
    windowMs,
    mode,

    // Async, unlike the in-memory limiter: a durable check is a network call.
    // Resolves { limited, retryAfterSeconds, mode } — mode is the mode this
    // particular decision was made in, which is not always the startup mode
    // (a KV failure degrades one request to "in-memory").
    async check(key) {
      if (mode === "in-memory") {
        return {
          limited: fallback.limited(key),
          retryAfterSeconds: fallback.retryAfterSeconds(key),
          mode: "in-memory",
        };
      }

      const window = Math.floor(Date.now() / windowMs);
      try {
        const count = await increment(env, `${prefix}:${key}:${window}`, ttlSeconds, timeoutMs);
        const windowEndsMs = (window + 1) * windowMs - Date.now();
        return {
          limited: count > max,
          retryAfterSeconds: Math.max(1, Math.ceil(windowEndsMs / 1000)),
          mode: "durable",
        };
      } catch (err) {
        // Fail open to the weaker limiter, and say so plainly.
        log.error(
          `[rate-limit:${prefix}] durable check FAILED (${err && err.message}) — ` +
            "degrading this request to the in-memory limiter. " +
            "Requests are still limited, but only per-instance.",
        );
        return {
          limited: fallback.limited(key),
          retryAfterSeconds: fallback.retryAfterSeconds(key),
          mode: "in-memory-degraded",
        };
      }
    },
  };
}
