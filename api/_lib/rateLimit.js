// api/_lib/rateLimit.js — the one rate-limiting pattern, extracted.
//
// This logic existed inline in api/verify-challenge.js and, with different
// numbers, in api/generate-artifact.js. api/adopt.js had none at all while the
// published adoption contract advertised a limit — a protection claimed but not
// enforced. Extracting it gives one definition for the endpoints that need the
// same behaviour, so the next endpoint cannot quietly ship without one.
//
// ── Honest about what this is ──
// Best-effort and IN-MEMORY: the counter lives in the serverless instance, so it
// resets on cold start and each concurrent instance counts separately. A
// determined attacker with many connections is not stopped by this; casual abuse
// and brute-force probing are. Durable per-source limiting (Vercel KV / Upstash)
// is a deliberate follow-up for when traffic warrants the cost — a limit can
// always be raised, where an over-open endpoint cannot be un-abused.
//
// Honest use of either endpoint is tiny: an AI adopts once, and a verifier makes
// a handful of calls ever. So a low cap is invisible to the legitimate case.

export function createRateLimiter({ max, windowMs }) {
  const hits = new Map();

  return {
    max,
    windowMs,

    // True when this source has already used its allowance in the window.
    // Recording the hit is part of the check, so a caller cannot forget to.
    limited(key) {
      const now = Date.now();
      const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return true;
      }
      recent.push(now);
      hits.set(key, recent);
      return false;
    },

    // Seconds until this source's oldest hit falls out of the window, for a
    // Retry-After header. Rounded up, and never zero.
    retryAfterSeconds(key) {
      const recent = hits.get(key) || [];
      if (recent.length === 0) return 1;
      const waitMs = windowMs - (Date.now() - recent[0]);
      return Math.max(1, Math.ceil(waitMs / 1000));
    },
  };
}

// The source a limit is applied per. x-forwarded-for's first entry is the client
// as seen by the edge; the socket address is the fallback for local runs.
// Unknown sources share one bucket, which is deliberate: an absent source header
// should not buy an unlimited allowance.
export function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}
