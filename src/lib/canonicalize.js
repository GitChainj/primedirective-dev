// Canonical form for AI Conscience documents — browser copy.
//
// This is tools/attest/canonicalize.js @ 1f83598 ("Formalise attestation
// formats: intermediate cert, hash-chained log, signed revocations, root key
// publication"), converted from CommonJS to ESM for the site bundle. The
// function bodies are unchanged and MUST stay that way: these are the exact
// bytes a signature was made over, so any drift makes this page disagree with
// tools/attest/verify.js about what was signed. Changes go upstream first, then
// come back here as a fresh copy with a new commit id.
//
// The rule: keys sorted alphabetically, one named key removed, serialised as
// JSON with no whitespace. canonicalize omits "signature" (the document's own
// detached signature); the transparency log omits "entry_hash" instead — there
// the "signature" field is data that MUST be hashed, so it is kept.

export function canonicalizeOmitting(doc, omitKey) {
  const out = {};
  for (const k of Object.keys(doc).sort()) {
    if (k === omitKey) continue;
    out[k] = doc[k];
  }
  return JSON.stringify(out);
}

export function canonicalize(doc) {
  return canonicalizeOmitting(doc, "signature");
}
