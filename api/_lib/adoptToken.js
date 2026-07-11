// api/_lib/adoptToken.js
//
// Stateless HMAC confirmation token for the two-step human adoption flow (D4).
// Step 1 (api/adopt) mints a token carrying the full submission plus the pinned
// adoption date; the adopter receives it in a confirmation email. Step 2
// (api/adopt-confirm) verifies it and creates the ledger issue. api/send-welcome
// re-verifies it before emailing the welcome pack.
//
// A SINGLE shared implementation is imported by every endpoint, so the mint and
// verify halves cannot drift apart. The payload is base64url-encoded and signed
// (HMAC-SHA256) — signing gives integrity, not secrecy: the link is emailed only
// to the adopter, and everything in it except the business number is destined
// for the public ledger anyway.

import { createHmac, timingSafeEqual } from "node:crypto";

export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h (D4)

function secret() {
  const s = process.env.ADOPT_TOKEN_SECRET;
  if (!s) throw new Error("ADOPT_TOKEN_SECRET is not configured");
  return s;
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlToBuf = (s) =>
  Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");

// payload: { path, date, tier, data } — iat/exp are added here.
export function signToken(payload, now = Date.now()) {
  const body = { ...payload, iat: now, exp: now + TOKEN_TTL_MS };
  const p = b64url(JSON.stringify(body));
  const sig = b64url(createHmac("sha256", secret()).update(p).digest());
  return `${p}.${sig}`;
}

export function verifyToken(token, now = Date.now()) {
  if (typeof token !== "string" || !token.includes(".")) return { ok: false, reason: "malformed" };
  const [p, sig] = token.split(".");
  const expected = createHmac("sha256", secret()).update(p).digest();
  let got;
  try { got = b64urlToBuf(sig); } catch { return { ok: false, reason: "bad-signature" }; }
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return { ok: false, reason: "bad-signature" };
  }
  let body;
  try { body = JSON.parse(b64urlToBuf(p).toString("utf8")); }
  catch { return { ok: false, reason: "bad-json" }; }
  if (typeof body.exp !== "number" || now > body.exp) return { ok: false, reason: "expired" };
  return { ok: true, payload: body };
}
