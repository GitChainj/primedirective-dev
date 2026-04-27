'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRIVATE_KEY_PATH = '/Volumes/UPD Keys/private_ed25519.pem';
const PUBLIC_KEY_PATH = path.join(__dirname, 'public_ed25519.pem');

// Safety check: refuse to overwrite an existing private key
if (fs.existsSync(PRIVATE_KEY_PATH)) {
  console.error('ERROR: Private key already exists at', PRIVATE_KEY_PATH);
  console.error('Refusing to overwrite. If you genuinely need to regenerate, remove the existing key manually first.');
  process.exit(1);
}

// Verify the encrypted volume is mounted
if (!fs.existsSync('/Volumes/UPD Keys')) {
  console.error('ERROR: /Volumes/UPD Keys is not mounted. Please mount the encrypted volume before running this script.');
  process.exit(1);
}

console.log('Generating Ed25519 keypair...');

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
});

// Write private key to encrypted volume with 0600 permissions
fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
console.log('Private key written to:', PRIVATE_KEY_PATH);
console.log('Permissions set to 0600 (owner read/write only)');

// Write public key to repo
fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
console.log('Public key written to:', PUBLIC_KEY_PATH);

// Compute SHA-256 fingerprint of the public key (DER bytes)
const pubKeyObj = crypto.createPublicKey(publicKey);
const derBytes = pubKeyObj.export({ type: 'spki', format: 'der' });
const fingerprint = crypto.createHash('sha256').update(derBytes).digest('hex').slice(0, 16);

console.log('\n─────────────────────────────────────────');
console.log('KEY FINGERPRINT (SHA-256, first 16 hex chars):');
console.log(' ', fingerprint);
console.log('─────────────────────────────────────────');
console.log('Record this fingerprint as your reference for verifying key authenticity.');
