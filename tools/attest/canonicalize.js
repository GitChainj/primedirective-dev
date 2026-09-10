'use strict';

// Canonical form for AI Conscience attestations, extracted verbatim from
// tools/seal/sign-ai-conscience.js (Phase 33.2) so the offline signer and every
// verifier share ONE implementation. The rule: keys sorted alphabetically, the
// "signature" field removed, serialised as JSON with no whitespace. Verifiers
// recompute this exact string and check the detached Ed25519 signature.
//
// Do NOT change this without re-running the tools/attest tests — public
// verification depends on byte-for-byte identity with what was signed.
function canonicalize(doc) {
  const out = {};
  for (const k of Object.keys(doc).sort()) {
    if (k === 'signature') continue;
    out[k] = doc[k];
  }
  return JSON.stringify(out);
}

module.exports = { canonicalize };
