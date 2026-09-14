'use strict';
// OFFLINE tool — signs an AI Conscience revocation list with a private key held
// on the Steward's encrypted volume. The key path comes from the ENVIRONMENT
// (UPD_SIGNING_KEY), never from the repo, and this tool never runs in CI.
//
// Attestation-level revocation lists are signed by the intermediate key;
// intermediate-level lists by the root key. The list's signed_by_fingerprint is
// set from whichever key is used, so a verifier knows which key to check.
//
//   UPD_SIGNING_KEY="/Volumes/UPD Keys/private_ed25519.pem" \
//     node tools/attest/sign-revocations.js <unsigned-list.json> [out.json]
//
// The signature is a detached Ed25519 signature over the canonical form of the
// list (keys sorted, "signature" removed, no whitespace). Node built-in crypto.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize } = require('./canonicalize.js');

const ROOT_JSON = path.resolve(__dirname, '../../public/.well-known/ai-conscience-root.json');

function main() {
  const inPath = process.argv[2];
  const outPath = process.argv[3] || inPath;
  const keyPath = process.env.UPD_SIGNING_KEY;

  if (!inPath) {
    console.error('Usage: UPD_SIGNING_KEY=<pem> node tools/attest/sign-revocations.js <list.json> [out.json]');
    process.exit(2);
  }
  if (!keyPath) {
    console.error('ERROR: set UPD_SIGNING_KEY to the private key path (encrypted volume). It is never read from the repo.');
    process.exit(2);
  }
  if (!fs.existsSync(keyPath)) {
    console.error('ERROR: private key not found at', keyPath);
    console.error('Mount the encrypted key volume before signing.');
    process.exit(1);
  }

  const list = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const privateKey = crypto.createPrivateKey(fs.readFileSync(keyPath, 'utf8'));
  const der = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'der' });
  const fingerprint = crypto.createHash('sha256').update(der).digest('hex').slice(0, 16);

  // Intermediate-level revocations may be signed ONLY by the root key. Refuse to
  // sign a list containing any kind:"intermediate" entry unless the signing key's
  // fingerprint equals the published root fingerprint.
  const hasIntermediateEntry = (Array.isArray(list.entries) ? list.entries : [])
    .some((e) => e && e.kind === 'intermediate');
  if (hasIntermediateEntry) {
    let rootFingerprint = null;
    try { rootFingerprint = JSON.parse(fs.readFileSync(ROOT_JSON, 'utf8')).fingerprint; }
    catch (e) { console.error('ERROR: cannot read published root fingerprint from', ROOT_JSON, '-', e.message); process.exit(1); }
    if (fingerprint !== rootFingerprint) {
      console.error(`ERROR: this list contains intermediate-level revocations, which only the root key may sign.`);
      console.error(`       signing key fingerprint ${fingerprint} does not match the published root ${rootFingerprint}.`);
      process.exit(1);
    }
  }

  // signed_by_fingerprint is part of the canonical form; the detached signature
  // is added afterwards (canonicalize removes "signature" before hashing).
  list.signed_by_fingerprint = fingerprint;
  const signature = crypto.sign(null, Buffer.from(canonicalize(list), 'utf8'), privateKey).toString('base64');
  list.signature = signature;

  fs.writeFileSync(outPath, JSON.stringify(list, null, 2) + '\n');
  console.log('Signed', outPath);
  console.log('  signed_by_fingerprint:', fingerprint);
  console.log('  signature (base64)   :', signature);
}

main();
