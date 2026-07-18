'use strict';

// Signs public/.well-known/ai-conscience.json with the Foundation's offline
// Ed25519 key, replacing the "__PLACEHOLDER_SIGN_MANUALLY__" signature.
//
// Run this ONLY on the machine with the encrypted key volume mounted:
//   node tools/seal/sign-ai-conscience.js
//
// The signature is a detached Ed25519 signature over the CANONICAL form of the
// document: keys sorted alphabetically, the "signature" field removed, and
// serialised as JSON with no whitespace. Verifiers recompute that exact string
// and check it against tools/seal/public_ed25519.pem.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PRIVATE_KEY_PATH = '/Volumes/UPD Keys/private_ed25519.pem';
const FILE = path.resolve(__dirname, '../../public/.well-known/ai-conscience.json');

// Canonical form: sorted keys, no "signature", no whitespace.
function canonical(doc) {
  const out = {};
  for (const k of Object.keys(doc).sort()) {
    if (k === 'signature') continue;
    out[k] = doc[k];
  }
  return JSON.stringify(out);
}

function main() {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('ERROR: private key not found at', PRIVATE_KEY_PATH);
    console.error('Mount the encrypted key volume before signing.');
    process.exit(1);
  }

  const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const message = Buffer.from(canonical(doc), 'utf8');
  const privateKey = crypto.createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH, 'utf8'));
  const signature = crypto.sign(null, message, privateKey).toString('base64'); // Ed25519

  doc.signature = signature;
  fs.writeFileSync(FILE, JSON.stringify(doc, null, 2) + '\n');

  console.log('Signed', FILE);
  console.log('  canonical message :', message.toString('utf8'));
  console.log('  signature (base64):', signature);
  console.log('\nCommit the updated file. Anyone can verify with tools/seal/public_ed25519.pem.');
}

main();
