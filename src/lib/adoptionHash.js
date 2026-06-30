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
// Including this in every adoption hash proves which version of the Truths
// was adopted. If the Conscience text is ever revised, this constant changes
// and a new version anchor is recorded — past adoptions remain verifiable
// against the version they were made under.
export const CONSCIENCE_SHA256 =
  "b2b16b00498530ef4a5b5af39d7a2d3316416447e298a0b5cfb506b36023abb7";

// The version prefix binds the hash format to a covenant version, so a future
// format change cannot collide with existing adoption hashes.
const ADOPTION_PREFIX = "UPD-COVENANT-v1";

// Normalise the name for hash stability: trim surrounding whitespace and
// lowercase, so "John Strand", " john strand " and "JOHN STRAND" all verify
// to the same hash. The display name is stored separately in the ledger.
function normaliseName(name) {
  return String(name == null ? "" : name).trim().toLowerCase();
}

// Build the deterministic string that gets hashed:
//   UPD-COVENANT-v1|{name}|{path}|{date}|{conscience_sha256}
export function buildAdoptionString({ name, path, date }) {
  return [
    ADOPTION_PREFIX,
    normaliseName(name),
    String(path == null ? "" : path).trim(),
    String(date == null ? "" : date).trim(),
    CONSCIENCE_SHA256,
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
export async function computeAdoptionHash({ name, path, date }) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available in this environment.");
  }
  const input = buildAdoptionString({ name, path, date });
  const bytes = new TextEncoder().encode(input);
  const digest = await subtle.digest("SHA-256", bytes);
  return bufferToHex(digest);
}
