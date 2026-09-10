'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize } = require('./canonicalize.js');

test('canonicalize: sorted top-level keys, signature stripped, no whitespace', () => {
  const doc = { b: 2, signature: 'X', a: 1, c: { z: 1, a: 2 } };
  assert.strictEqual(canonicalize(doc), '{"a":1,"b":2,"c":{"z":1,"a":2}}');
});

test('live Foundation attestation still verifies against public_ed25519.pem', () => {
  const attPath = path.resolve(__dirname, '../../public/.well-known/ai-conscience.json');
  const pubPath = path.resolve(__dirname, '../seal/public_ed25519.pem');
  const doc = JSON.parse(fs.readFileSync(attPath, 'utf8'));
  const msg = Buffer.from(canonicalize(doc), 'utf8');
  const sig = Buffer.from(doc.signature, 'base64');
  const key = crypto.createPublicKey(fs.readFileSync(pubPath, 'utf8'));
  assert.strictEqual(crypto.verify(null, msg, key, sig), true);
});
