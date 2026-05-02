'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SignJWT } = require('jose');
const { v4: uuidv4 } = require('uuid');

const PRIVATE_KEY_PATH = '/Volumes/UPD Keys/private_ed25519.pem';
const LEDGER_PATH      = '/Volumes/UPD Keys/seal_ledger.jsonl';

const VALID_ENTITY_TYPES  = ['human', 'ai', 'platform', 'organisation'];
const VALID_ARTICLES      = [1, 2, 3, 4, 5, 6, 7];
const VALID_CATEGORIES    = ['test', 'canonical'];

function validate(data) {
  const errors = [];

  if (!data.sub || typeof data.sub !== 'string' || !data.sub.trim()) {
    errors.push('sub: required, must be a non-empty string');
  }
  if (!data.entity_type || !VALID_ENTITY_TYPES.includes(data.entity_type)) {
    errors.push(`entity_type: required, must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
  }
  if (!Array.isArray(data.articles_attested) || data.articles_attested.length === 0) {
    errors.push('articles_attested: required, must be a non-empty array of article numbers');
  } else {
    const invalid = data.articles_attested.filter(a => !VALID_ARTICLES.includes(Number(a)));
    if (invalid.length) {
      errors.push(`articles_attested: invalid values [${invalid.join(', ')}] — valid range is 1–7`);
    }
  }
  if (!data.adoption_date || typeof data.adoption_date !== 'string') {
    errors.push('adoption_date: required, must be an ISO date string (e.g. "2026-04-23")');
  } else if (isNaN(Date.parse(data.adoption_date))) {
    errors.push('adoption_date: not a valid ISO date string');
  }
  if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`category: required, must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  return errors;
}

async function main() {
  const recipientFile = process.argv[2];
  if (!recipientFile) {
    console.error('Usage: node issue-seal.js <recipient.json>');
    process.exit(1);
  }

  // Parse recipient file
  let input;
  try {
    input = JSON.parse(fs.readFileSync(path.resolve(recipientFile), 'utf8'));
  } catch (err) {
    console.error('ERROR reading recipient file:', err.message);
    process.exit(1);
  }

  // Validate
  const errors = validate(input);
  if (errors.length) {
    console.error('ERROR: Invalid recipient data:');
    errors.forEach(e => console.error('  •', e));
    process.exit(1);
  }

  // Check encrypted volume is available
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('ERROR: Private key not found at', PRIVATE_KEY_PATH);
    console.error('Ensure the encrypted volume is mounted before issuing Seals.');
    process.exit(1);
  }

  // Load private key
  const privateKey = crypto.createPrivateKey(
    fs.readFileSync(PRIVATE_KEY_PATH, 'utf8')
  );

  // Build claims
  const now = Math.floor(Date.now() / 1000);
  const jti = uuidv4();

  const claims = {
    sub:               input.sub.trim(),
    entity_type:       input.entity_type,
    category:          input.category,
    articles_attested: input.articles_attested.map(Number),
    adoption_date:     input.adoption_date,
  };
  if (input.steward_role) claims.steward_role = input.steward_role;

  // Sign
  const jwt = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuer('https://primedirective.dev')
    .setIssuedAt(now)
    .setJti(jti)
    .sign(privateKey);

  // Output
  console.log('\n─────────────────────────────────────────────────');
  console.log('SIGNED SEAL JWT:');
  console.log('─────────────────────────────────────────────────');
  console.log(jwt);
  console.log('─────────────────────────────────────────────────\n');

  // Append to ledger
  const record = {
    timestamp:       new Date().toISOString(),
    category:        input.category,
    jti,
    jwt,
    payload:         { iss: 'https://primedirective.dev', iat: now, jti, ...claims },
    recipient_input: input,
  };
  fs.appendFileSync(LEDGER_PATH, JSON.stringify(record) + '\n');
  console.log('Ledger record appended to:', LEDGER_PATH);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
