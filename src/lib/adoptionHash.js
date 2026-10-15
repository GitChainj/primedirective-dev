// src/lib/adoptionHash.js
//
// Pure module for the Universal Primary Directive adoption hash.
//
// Every adoption gets a deterministic SHA-256 "adoption hash" built from its
// public facts plus the hash of the Conscience text it was adopted against.
// Because it is deterministic and uses no secret key, anyone can recompute it
// from the public ledger and confirm a record has not been altered. This is
// public hash verification, not signing.
//
// Works in the browser and in Node (Web Crypto API: globalThis.crypto.subtle).

// ── The Conscience version anchor ──
//
// SHA-256 of the canonical Conscience text (public/api/fragment.txt, v2.0).
// Derived with:
//
//   shasum -a 256 public/api/fragment.txt
//
// This constant is the anchor for adoptions made RIGHT NOW. It is the value to
// record on a new adoption; it is NOT the value to verify an old one with.
//
// ── Why the anchor is an argument and not a default ──
//
// Every adoption hash commits to the Conscience version it was made under, and
// each ledger row records that version in its `conscience_version` field. To
// verify a row you must hash it against ITS OWN recorded anchor — not against
// whatever this constant happens to say today. Until 2026-10-15 these functions
// read the constant directly, so the first revision of the covenant text would
// have broken verification of every past adoption: the promise that "past
// adoptions remain verifiable against the version they were made under" was
// made in this file and not kept by it.
//
// So conscienceVersion is REQUIRED and absence THROWS. It deliberately does not
// default to CONSCIENCE_SHA256: a default would silently reinstate the bug for
// any caller that forgot to pass it, and when this was fixed four of the five
// call sites had forgotten. A loud failure is the point.
export const CONSCIENCE_SHA256 =
  "b2b16b00498530ef4a5b5af39d7a2d3316416447e298a0b5cfb506b36023abb7";

// The version prefix binds the hash format to a covenant version, so a future
// format change cannot collide with existing adoption hashes.
const ADOPTION_PREFIX = "UPD-COVENANT-v1";

// A 64-char lowercase hex SHA-256. Checking the shape (not just presence) also
// catches a truncated display value — "b2b16b0049…" pasted from a UI would
// otherwise hash cleanly and verify nothing.
const SHA256_HEX = /^[0-9a-f]{64}$/;

export const CONSCIENCE_VERSION_REQUIRED =
  "conscienceVersion is required: pass the record's own conscience_version to " +
  "verify an existing adoption, or CONSCIENCE_SHA256 to mint a new one. It must " +
  "be a 64-character lowercase hex SHA-256.";

function requireConscienceVersion(v) {
  if (typeof v !== "string" || !SHA256_HEX.test(v)) {
    throw new Error(CONSCIENCE_VERSION_REQUIRED);
  }
  return v;
}

// Normalise the name for hash stability: trim surrounding whitespace and
// lowercase, so "John Strand", " john strand " and "JOHN STRAND" all verify
// to the same hash. The display name is stored separately in the ledger.
function normaliseName(name) {
  return String(name == null ? "" : name).trim().toLowerCase();
}

// Build the deterministic string that gets hashed:
//   UPD-COVENANT-v1|{name}|{path}|{date}|{conscience_sha256}
//
// conscienceVersion is required — see the note on the constant above.
export function buildAdoptionString({ name, path, date, conscienceVersion }) {
  return [
    ADOPTION_PREFIX,
    normaliseName(name),
    String(path == null ? "" : path).trim(),
    String(date == null ? "" : date).trim(),
    requireConscienceVersion(conscienceVersion),
  ].join("|");
}

// Convert an ArrayBuffer of hash bytes to a lowercase hex string.
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Compute the SHA-256 hex of the adoption string via the Web Crypto API.
// Returns a Promise resolving to the 64-char lowercase hex adoption hash.
export async function computeAdoptionHash({ name, path, date, conscienceVersion }) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available in this environment.");
  }
  const input = buildAdoptionString({ name, path, date, conscienceVersion });
  const bytes = new TextEncoder().encode(input);
  const digest = await subtle.digest("SHA-256", bytes);
  return bufferToHex(digest);
}
