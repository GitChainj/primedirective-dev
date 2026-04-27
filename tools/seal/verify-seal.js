'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { jwtVerify } = require('jose');

const PUBLIC_KEY_PATH = path.join(__dirname, 'public_ed25519.pem');

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error('Usage: node verify-seal.js <jwt>');
    process.exit(1);
  }

  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    console.error('ERROR: Public key not found at', PUBLIC_KEY_PATH);
    process.exit(1);
  }

  const publicKey = crypto.createPublicKey(
    fs.readFileSync(PUBLIC_KEY_PATH, 'utf8')
  );

  let payload, protectedHeader;
  try {
    ({ payload, protectedHeader } = await jwtVerify(token, publicKey, {
      issuer:    'https://primedirective.dev',
      algorithms: ['EdDSA'],
    }));
  } catch (err) {
    console.log('\n✗ INVALID SEAL');
    console.log('Reason:', err.message);
    process.exit(1);
  }

  const issuedAt    = payload.iat ? new Date(payload.iat * 1000).toISOString() : 'unknown';
  const articles    = Array.isArray(payload.articles_attested)
    ? payload.articles_attested.join(', ')
    : payload.articles_attested;

  console.log('\n✓ VALID SEAL');
  console.log('─────────────────────────────────────────────────');
  console.log('  Issuer:            ', payload.iss);
  console.log('  Subject:           ', payload.sub);
  console.log('  Entity Type:       ', payload.entity_type);
  if (payload.steward_role) {
  console.log('  Steward Role:      ', payload.steward_role);
  }
  console.log('  Articles Attested: ', articles);
  console.log('  Adoption Date:     ', payload.adoption_date);
  console.log('  Issued At:         ', issuedAt);
  console.log('  JWT ID:            ', payload.jti);
  console.log('  Algorithm:         ', protectedHeader.alg);
  console.log('─────────────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('✗ INVALID SEAL');
  console.error('Reason:', err.message);
  process.exit(1);
});
