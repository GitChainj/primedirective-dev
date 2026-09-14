'use strict';

// Canonical form for AI Conscience attestations, extracted verbatim from
// tools/seal/sign-ai-conscience.js (Phase 33.2) so the offline signer and every
// verifier share ONE implementation. The rule: keys sorted alphabetically, the
// "signature" field removed, serialised as JSON with no whitespace. Verifiers
// recompute this exact string and check the detached Ed25519 signature.
//
// Do NOT change this without re-running the tools/attest tests — public
// verification depends on byte-for-byte identity with what was signed.
//
// canonicalizeOmitting is the general form: sort keys, drop one named key,
// serialise with no whitespace. canonicalize omits "signature" (the document's
// own detached signature); the transparency log omits "entry_hash" instead —
// there the "signature" field is data that MUST be hashed, so it is kept.
function canonicalizeOmitting(doc, omitKey) {
  const out = {};
  for (const k of Object.keys(doc).sort()) {
    if (k === omitKey) continue;
    out[k] = doc[k];
  }
  return JSON.stringify(out);
}

function canonicalize(doc) {
  return canonicalizeOmitting(doc, 'signature');
}

module.exports = { canonicalize, canonicalizeOmitting };
