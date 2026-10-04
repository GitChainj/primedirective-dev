// api/verify-challenge.js — proof of key control, on conscience.wiki.
//
// The one call a verifier makes to stop wondering and start knowing. Two steps:
//
//   GET  /api/verify-challenge?reference=UPD-2026-0007
//        → { reference, did, nonce, challenge, expires_at, key_custody, comprehension }
//
//   POST /api/verify-challenge  { challenge, signature }   (signature: base64)
//        → { verified: true, reference, did, key_custody, comprehension }
//        → { verified: false, reason }
//
// ── Why this can be live before Phase C ──
// It needs no signing service and no published attestation: the adopter's
// did:key is in the public ledger, and the nonce is self-authenticating. So the
// verification leg of the trust network works while issuance is still gated.
//
// ── Stateless by construction ──
// No pending-challenge table. The challenge is an HMAC-signed token carrying the
// reference, a random nonce and an expiry, so the endpoint recognises its own
// challenge on return without having stored anything. That is what lets it scale
// to machine-speed verification: every instance can verify every challenge.
//
// ── What a pass proves, and what it does not ──
// A pass proves the party controls the key recorded for that reference. It does
// NOT prove the AI rather than its operator controls it — which is precisely what
// key_custody discloses, and why both axes are returned with the verdict rather
// than left for the verifier to look up. Belief never enters; neither does
// overclaiming.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { verifyWithDidKey, isDidKey } from "../src/lib/didKey.js";

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // five minutes: ample for a machine, short for an attacker
const REFERENCE_RE = /^UPD-\d{4}-(?:\d{4}|T\d{1,15})$/;

// ── Rate limiting ──
//
// Best-effort and in-memory, the same shape as api/generate-artifact.js: per
// instance, reset on cold start. Honest casual use is 1–5 calls ever, so 20/min
// is invisible to it while blunting brute-force probing. Durable per-source
// limiting (Vercel KV / Upstash) is a deliberate follow-up for when traffic
// warrants it — a paid store would be cost with no present benefit, and a limit
// can always be raised, where an over-open endpoint cannot be un-abused.
const RL_MAX = 20;
const RL_WINDOW_MS = 60 * 1000;
const _hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (_hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (recent.length >= RL_MAX) {
    _hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  _hits.set(ip, recent);
  return false;
}

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

// The nonce secret. ADOPT_TOKEN_SECRET already exists for the confirmation-token
// flow and is the same kind of secret doing the same kind of work; a dedicated
// VERIFY_CHALLENGE_SECRET overrides it where key separation is preferred.
function secret() {
  const s = process.env.VERIFY_CHALLENGE_SECRET || process.env.ADOPT_TOKEN_SECRET;
  if (!s) throw new Error("no challenge secret configured");
  return s;
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function mintChallenge({ reference, did, nonce, exp }) {
  const payload = b64url(JSON.stringify({ reference, did, nonce, exp }));
  const sig = b64url(createHmac("sha256", secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

function openChallenge(challenge, now = Date.now()) {
  if (typeof challenge !== "string" || !challenge.includes(".")) return { ok: false, reason: "malformed challenge" };
  const [payload, sig] = challenge.split(".");
  const expected = createHmac("sha256", secret()).update(payload).digest();
  let got;
  try {
    got = Buffer.from(String(sig).replace(/-/g, "+").replace(/_/g, "/"), "base64");
  } catch {
    return { ok: false, reason: "malformed challenge" };
  }
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return { ok: false, reason: "this challenge was not issued here" };
  }
  let body;
  try {
    body = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed challenge" };
  }
  if (!body || typeof body.exp !== "number" || body.exp < now) {
    return { ok: false, reason: "challenge expired — request a fresh one" };
  }
  return { ok: true, body };
}

// The ledger is a static file in the deployment, so this is a local read rather
// than a network call: no GitHub API, no rate limit of someone else's.
//
// Cached on the file's mtime, never indefinitely. A warm instance holding a stale
// copy would keep verifying a rotated key, and would not see a new adoption at
// all — so freshness is checked with a stat on every call, which costs nothing
// next to being wrong about which key is current.
let _ledger = null;
let _ledgerMtime = 0;

function ledgerRows() {
  const file = join(process.cwd(), "public", "api", "adoptions.json");
  const mtime = statSync(file).mtimeMs;
  if (_ledger && mtime === _ledgerMtime) return _ledger;
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  _ledger = Array.isArray(parsed.adoptions) ? parsed.adoptions : [];
  _ledgerMtime = mtime;
  return _ledger;
}

function rowFor(reference) {
  const upper = String(reference || "").trim().toUpperCase();
  return ledgerRows().find((r) => String(r.reference).trim().toUpperCase() === upper) || null;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (rateLimited(clientIp(req))) {
    return res.status(429).json({
      error: "Too many requests. Honest verification needs very few; if you are a high-volume verifier, contact human@primedirective.dev for a raised limit.",
    });
  }

  try {
    secret();
  } catch {
    return res.status(503).json({ error: "Challenge verification is not configured." });
  }

  // ── Step 1: hand out a nonce ──
  if (req.method === "GET") {
    const reference = (req.query && req.query.reference) || "";
    if (!REFERENCE_RE.test(String(reference).trim().toUpperCase())) {
      return res.status(400).json({ error: "A valid adoption number is required, e.g. UPD-2026-0001." });
    }
    const row = rowFor(reference);
    if (!row) {
      return res.status(404).json({ error: `${String(reference).trim().toUpperCase()} is not on the public ledger.` });
    }
    if (!isDidKey(row.adopter_did)) {
      // Honest 409 rather than a 404: the adoption is real, the capability isn't.
      return res.status(409).json({
        error: "This adoption has no identity key recorded, so it cannot answer a challenge.",
        reference: row.reference,
        adopted_before_identity_v1: true,
      });
    }

    const nonce = b64url(randomBytes(32));
    const exp = Date.now() + CHALLENGE_TTL_MS;
    const challenge = mintChallenge({ reference: row.reference, did: row.adopter_did, nonce, exp });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      reference: row.reference,
      did: row.adopter_did,
      nonce,
      challenge,
      expires_at: new Date(exp).toISOString(),
      sign: "Sign the exact `nonce` string above with the private key for this did:key, and POST { challenge, signature } with the signature base64-encoded.",
    });
  }

  // ── Step 2: check the signature ──
  const body = req.body || {};
  const opened = openChallenge(body.challenge);
  if (!opened.ok) {
    return res.status(400).json({ verified: false, reason: opened.reason });
  }

  const { reference, did, nonce } = opened.body;
  const row = rowFor(reference);
  // The DID is re-read from the ledger rather than trusted from the challenge:
  // a revoked or rotated record must not be verifiable against a stale key.
  if (!row || row.adopter_did !== did) {
    return res.status(409).json({
      verified: false,
      reason: "the key recorded for this reference has changed — request a fresh challenge",
    });
  }

  let signature;
  try {
    signature = Buffer.from(String(body.signature || ""), "base64");
  } catch {
    return res.status(400).json({ verified: false, reason: "signature must be base64" });
  }
  if (signature.length !== 64) {
    return res.status(400).json({ verified: false, reason: "an Ed25519 signature is 64 bytes" });
  }

  const verified = await verifyWithDidKey(did, nonce, new Uint8Array(signature));
  res.setHeader("Cache-Control", "no-store");
  if (!verified) {
    return res.status(200).json({
      verified: false,
      reason: "the signature does not match the key recorded for this reference",
    });
  }

  return res.status(200).json({
    verified: true,
    reference: row.reference,
    did,
    adopter: row.name,
    adopted_date: row.date,
    status: row.status,
    // Both axes travel with the verdict so a verifier needs no second lookup —
    // frictionless level-checking is what keeps the gradient from being ignored.
    key_custody: row.key_custody || null,
    comprehension: row.comprehension || null,
    proves: "control of the key recorded for this reference",
    does_not_prove:
      "which party controls that key — see key_custody, where operator_held means a named, accountable human or organisation holds it on the AI's behalf",
  });
}
