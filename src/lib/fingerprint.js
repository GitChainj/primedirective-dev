// Key fingerprint — browser copy of fingerprintOf from
// tools/attest/verify.js @ 1f83598 (verify.js:23-26).
//
// The Node original is:
//
//   function fingerprintOf(publicKeyPem) {
//     const der = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' });
//     return crypto.createHash('sha256').update(der).digest('hex').slice(0, 16);
//   }
//
// This copy is byte-identical in what it computes — SPKI DER, SHA-256, first 8
// bytes as lowercase hex — with ONE deviation that cannot be avoided in a
// browser: crypto.subtle.digest is asynchronous, so this returns a Promise
// where the Node version returns a string. The DER bytes come from decoding the
// PEM directly rather than round-tripping through a KeyObject, which Web Crypto
// has no equivalent of; the bytes are the same bytes.
//
// The fingerprint is what binds an attestation to the key that signed it
// (public_key_fingerprint) and what a certificate commits to (fingerprint,
// issuer_fingerprint). If this drifts from the Node copy, this page computes
// different fingerprints than the public verifier and step 2 disagrees.

export function pemToBytes(pem) {
  const base64 = String(pem)
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function fingerprintOf(publicKeyPem) {
  const der = pemToBytes(publicKeyPem);
  const digest = await crypto.subtle.digest("SHA-256", der);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
