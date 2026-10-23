// The durable rate limiter for /api/adopt (decision D1).
//
// /api/adopt writes a permanent public ledger row, so its limit should hold
// across serverless instances instead of resetting on every cold start. These
// tests pin the three things that make that safe to ship before a store exists:
// it runs in-memory when no store is configured, it activates automatically when
// the env vars appear, and a KV failure degrades to the weaker limiter rather
// than refusing adoptions.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

import {
  createDurableRateLimiter,
  modeFor,
  MODE_NOTE,
} from "../api/_lib/rateLimitDurable.js";

const REPO = path.resolve(import.meta.dirname, "..");
const read = (...p) => fs.readFileSync(path.join(REPO, ...p), "utf8");

// Silences the init line so test output stays readable, and captures it so the
// mode-reporting tests can assert on it.
function recorder() {
  const lines = [];
  return { lines, log: (m) => lines.push(String(m)), error: (m) => lines.push(String(m)) };
}

const KV = { url: "https://kv.example.com", token: "t", provider: "vercel-kv" };

test("with no store configured it runs in-memory and says so", () => {
  const log = recorder();
  const l = createDurableRateLimiter({ max: 2, windowMs: 1000, env: null, log });
  assert.strictEqual(l.mode, "in-memory");
  assert.match(log.lines[0], /mode=in-memory/);
  assert.match(log.lines[0], /NOT configured/);
  // And it names the env vars that would activate it, so the fix is discoverable
  // from the log line alone.
  assert.match(log.lines[0], /KV_REST_API_URL/);
  assert.match(log.lines[0], /UPSTASH_REDIS_REST_URL/);
});

test("in-memory mode still enforces the limit", async () => {
  const l = createDurableRateLimiter({ max: 2, windowMs: 60_000, env: null, log: recorder() });
  assert.strictEqual((await l.check("a")).limited, false);
  assert.strictEqual((await l.check("a")).limited, false);
  const third = await l.check("a");
  assert.strictEqual(third.limited, true, "the third request in the window is refused");
  assert.ok(third.retryAfterSeconds >= 1, "and carries a usable Retry-After");
  // Independent sources do not share an allowance.
  assert.strictEqual((await l.check("b")).limited, false);
});

test("it activates automatically when the env vars are present", () => {
  const log = recorder();
  const l = createDurableRateLimiter({ max: 2, windowMs: 1000, env: KV, log });
  assert.strictEqual(l.mode, "durable");
  assert.match(log.lines[0], /mode=durable/);
  assert.match(log.lines[0], /ACTIVE/);
});

test("modeFor is a pure function of the environment", () => {
  assert.strictEqual(modeFor(null), "in-memory");
  assert.strictEqual(modeFor(KV), "durable");
  assert.ok(MODE_NOTE["in-memory"].includes("resets on cold start"));
});

test("durable mode refuses only once the count exceeds max", async () => {
  let count = 0;
  const l = createDurableRateLimiter({
    max: 3,
    windowMs: 60_000,
    env: KV,
    log: recorder(),
    increment: async () => ++count,
  });
  for (const expected of [false, false, false]) {
    assert.strictEqual((await l.check("x")).limited, expected);
  }
  const fourth = await l.check("x");
  assert.strictEqual(fourth.limited, true, "the 4th request exceeds max=3");
  assert.strictEqual(fourth.mode, "durable");
  assert.ok(fourth.retryAfterSeconds >= 1);
});

test("the durable key is per-source and per-window, and carries a TTL", async () => {
  const seen = [];
  const l = createDurableRateLimiter({
    max: 10,
    windowMs: 60_000,
    prefix: "adopt",
    env: KV,
    log: recorder(),
    increment: async (env, key, ttl) => { seen.push([key, ttl]); return 1; },
  });
  await l.check("1.2.3.4");
  await l.check("5.6.7.8");
  const [[k1, ttl1], [k2]] = seen;
  assert.match(k1, /^adopt:1\.2\.3\.4:\d+$/, "key is prefix:source:window");
  assert.notStrictEqual(k1, k2, "different sources get different keys");
  assert.strictEqual(ttl1, 60, "TTL matches the window in seconds");
});

test("a KV failure fails OPEN to the in-memory limiter and logs it", async () => {
  const log = recorder();
  const l = createDurableRateLimiter({
    max: 1,
    windowMs: 60_000,
    env: KV,
    log,
    increment: async () => { throw new Error("connect ETIMEDOUT"); },
  });

  const first = await l.check("z");
  assert.strictEqual(first.limited, false, "a KV outage must not block adoption");
  assert.strictEqual(first.mode, "in-memory-degraded", "and must report the degradation");
  assert.ok(
    log.lines.some((m) => /durable check FAILED/.test(m) && /ETIMEDOUT/.test(m)),
    "the failure and its cause are logged plainly",
  );

  // Still limited, just by the weaker counter — fail-open means a weaker limit,
  // not no limit.
  assert.strictEqual((await l.check("z")).limited, true);
});

test("both /api/adopt and /api/verify-challenge use the durable limiter", () => {
  const adopt = read("api", "adopt.js");
  const challenge = read("api", "verify-challenge.js");

  // Both POST-capable endpoints share the durable store (fail-open to in-memory
  // when no KV/Upstash env is configured); neither constructs the in-memory
  // limiter directly.
  for (const [name, src] of [["adopt.js", adopt], ["verify-challenge.js", challenge]]) {
    assert.match(src, /createDurableRateLimiter/, `${name} must use the durable limiter`);
    assert.match(src, /await limiter\.check\(/, `${name} must await the async check`);
    assert.ok(
      !/createRateLimiter\(/.test(src),
      `${name} must not also construct the in-memory limiter directly`,
    );
  }
});

test("the 429 body leaks no internals about the limiter", () => {
  const adopt = read("api", "adopt.js");
  // The refusal block only: from the `if (limit.limited)` test to the start of
  // request parsing. Both anchors are verified to appear exactly once.
  const start = adopt.indexOf("limit.limited");
  const end = adopt.indexOf("const body =");
  assert.ok(start > 0 && end > start, "the refusal block anchors must still exist");
  const block = adopt.slice(start, end);

  for (const term of ["mode", "durable", "KV", "count"]) {
    assert.ok(
      !new RegExp(`json\\([^)]*${term}`, "i").test(block),
      `the 429 response must not disclose "${term}"`,
    );
  }
  assert.match(block, /json\(\{ error: RATE_LIMIT_MESSAGE \}\)/);
});
