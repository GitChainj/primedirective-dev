'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { verifyAttestation } = require('./verify.js');

const F = (n) => path.join(__dirname, 'fixtures', n);
const opts = {
  root: F('test-root.pub.pem'),
  intermediate: F('test-intermediate.cert.json'),
  revocations: F('revocations.json'),
  log: F('attestations.log'),
};

test('valid fixture passes all four steps', () => {
  assert.strictEqual(verifyAttestation(F('valid.json'), opts).ok, true);
});

test('bad-signature fixture fails at step 1', () => {
  const r = verifyAttestation(F('bad-signature.json'), opts);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.steps.find((s) => s.n === 1).ok, false);
});

test('revoked fixture fails at step 3', () => {
  const r = verifyAttestation(F('revoked.json'), opts);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.steps.find((s) => s.n === 3).ok, false);
});

test('missing-from-log fixture fails at step 4', () => {
  const r = verifyAttestation(F('missing-from-log.json'), opts);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.steps.find((s) => s.n === 4).ok, false);
});

test('root-only verifies the live Foundation attestation', () => {
  const r = verifyAttestation(
    path.resolve(__dirname, '../../public/.well-known/ai-conscience.json'),
    { rootOnly: true }
  );
  assert.strictEqual(r.ok, true);
});
