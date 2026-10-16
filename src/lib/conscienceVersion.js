// src/lib/conscienceVersion.js — the Conscience version anchor, in one place.
//
// ── Why this module exists ──
// The anchor and its validator were defined TWICE: once in src/lib/adoptionHash.js
// for the browser, once in api/_lib/adoptionCore.js for the serverless functions.
// Two copies of a hash constant that must agree byte-for-byte, kept in step by
// hand, is the same hazard as the duplicated gradient primitives — and it was
// about to get worse, because revising the covenant text means editing the
// constant, and editing one of two copies would silently fork the hash contract.
//
// So there is one definition and ONE import path. Nothing re-exports these
// symbols: a consumer imports them from here or not at all.
//
// Keep it a leaf and keep it PURE. No crypto, no I/O, no imports — which is also
// what lets it cross the src/ ↔ api/ boundary safely. api/_lib/attestation.js
// already imports ../../src/lib/didKey.js in production, so the direction is
// proven; this file adds no new kind of dependency.

// ── The anchor ──
//
// SHA-256 of the canonical Conscience text (public/api/fragment.txt, v2.0):
//
//   shasum -a 256 public/api/fragment.txt
//
// This is the anchor for adoptions minted RIGHT NOW. It is the value to record
// on a new adoption; it is NOT the value to verify an old one with.
//
// WHEN THE COVENANT TEXT IS REVISED, this constant changes — and because it now
// lives in exactly one place, that is a one-line edit rather than two edits that
// must not be allowed to disagree. Existing ledger rows keep their own recorded
// conscience_version and go on verifying against it.
export const CONSCIENCE_SHA256 =
  "eea33868c8401b03bd7768717110555aca375bdff507f3badf14d92932a380ad";

// ── The validator ──
//
// Every adoption hash commits to the Conscience version it was made under, and
// each ledger row records that version. To verify a row you must hash it against
// ITS OWN recorded anchor, not against whatever the constant says today. Until
// 2026-10-15 the hash builders read the constant directly, so the first revision
// of the covenant text would have broken verification of every past adoption.
//
// Hence: the anchor is a REQUIRED argument and absence THROWS. It deliberately
// does not default to CONSCIENCE_SHA256 — a default would silently reinstate
// that bug for any caller that forgot, and when this was fixed four of the five
// call sites had forgotten.
//
// The shape is checked, not merely presence: a truncated value such as
// "b2b16b0049…" pasted out of a UI would otherwise hash cleanly and prove
// nothing.
export const SHA256_HEX = /^[0-9a-f]{64}$/;

export const CONSCIENCE_VERSION_REQUIRED =
  "conscienceVersion is required: pass the record's own conscience_version to " +
  "verify an existing adoption, or CONSCIENCE_SHA256 to mint a new one. It must " +
  "be a 64-character lowercase hex SHA-256.";

export function requireConscienceVersion(v) {
  if (typeof v !== "string" || !SHA256_HEX.test(v)) {
    throw new Error(CONSCIENCE_VERSION_REQUIRED);
  }
  return v;
}
