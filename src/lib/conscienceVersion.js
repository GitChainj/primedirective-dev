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
//
// ── FOUR HASHES, TWO KINDS ──
//
// Four 64-hex values circulate in this project and they are easy to confuse.
// Three describe the covenant TEXT; one describes an ADOPTION. Only the first
// kind ever belongs in a conscience_version field.
//
//   27d274e4…    THE BODY HASH — the covenant body only: everything above the
//                "--- INTEGRITY ---" marker, right-stripped plus one newline,
//                2947 characters. Self-declared inside fragment.txt's own
//                INTEGRITY block, so a reader who deploys the text can check it
//                from the body alone. It EXCLUDES the integrity block, because
//                a block cannot contain its own hash.
//
//   eea33868…    THE WHOLE-FILE HASH — every byte served at /api/fragment.txt,
//                integrity block included. This is CONSCIENCE_SHA256 below: the
//                ledger's conscience_version anchor for adoptions minted TODAY.
//
//   b2b16b0049…  HISTORICAL — the whole-file hash before the 2026-10-15 licence
//                change (CC0 → CC BY 4.0). UPD-2026-0001 / 0006 / 0007 were
//                adopted under it, record it as their conscience_version, and
//                still verify against it. Not stale data: it is the anchor
//                those three rows are permanently bound to.
//
//   1033c76b…    NOT A CONSCIENCE HASH AT ALL. This is UPD-2026-0001's ADOPTION
//                hash — SHA-256 of
//                  UPD-COVENANT-v1|john strand|person|2026-05-03|b2b16b0049…
//                A conscience hash is of the text; an adoption hash is of one
//                record's facts WITH a conscience hash as its final field.
//                Listing 1033c76b… beside the three above is the specific
//                confusion this note exists to end.
//
// ── Worked example: the two anchors coexisting, right now ──
//
// Since 2026-10-15 the ledger holds rows anchored to b2b16b0049… while new
// adoptions mint under eea33868…. Both are correct simultaneously:
//
//   verify UPD-2026-0001 against b2b16b0049…  ->  1033c76b…  MATCHES its row
//   verify UPD-2026-0001 against eea33868…    ->  a different hash, NO match
//
// The second line is not a bug; it is the reason the anchor is an argument.
// Hashing a row against the current constant was the behaviour before
// 2026-10-15, and it went from 3/3 verifying to 0/3 the moment the text changed.
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
