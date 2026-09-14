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
  rootRevocations: F('root-revocations.json'),
  log: F('attestations.log'),
};
const stepOk = (r, n) => r.steps.find((s) => s.n === n).ok;

test('valid fixture passes all four steps', () => {
  assert.strictEqual(verifyAttestation(F('valid.json'), opts).ok, true);
});

test('bad-signature fixture fails at step 1', () => {
  const r = verifyAttestation(F('bad-signature.json'), opts);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(stepOk(r, 1), false);
});

test('out-of-window fixture fails at step 2 (signed_at outside cert window)', () => {
  const r = verifyAttestation(F('out-of-window.json'), opts);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(stepOk(r, 2), false);
});

test('cert without not_before/not_after fails at step 2', () => {
  const r = verifyAttestation(F('valid.json'), { ...opts, intermediate: F('test-intermediate-nowindow.cert.json') });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(stepOk(r, 2), false);
});

test('revoked fixture fails at step 3', () => {
  const r = verifyAttestation(F('revoked.json'), opts);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(stepOk(r, 3), false);
});

test('bad-signature revocation list fails at step 3 (list signature invalid)', () => {
  const r = verifyAttestation(F('valid.json'), { ...opts, revocations: F('revocations-badsig.json') });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(stepOk(r, 3), false);
});

test('revoked-intermediate fails at step 3 via the root-signed list', () => {
  const r = verifyAttestation(F('revoked-intermediate.json'), { ...opts, intermediate: F('test-intermediate2.cert.json') });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(stepOk(r, 3), false);
});

test('missing --root-revocations fails at step 3', () => {
  const noRoot = { ...opts };
  delete noRoot.rootRevocations;
  const r = verifyAttestation(F('valid.json'), noRoot);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(stepOk(r, 3), false);
});

test('missing-from-log fixture fails at step 4', () => {
  const r = verifyAttestation(F('missing-from-log.json'), opts);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(stepOk(r, 4), false);
});

test('broken-chain fixture fails at step 4 (log chain broken)', () => {
  const r = verifyAttestation(F('broken-chain.json'), { ...opts, log: F('attestations-broken.log') });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(stepOk(r, 4), false);
});

test('root-only verifies the live Foundation attestation', () => {
  const r = verifyAttestation(
    path.resolve(__dirname, '../../public/.well-known/ai-conscience.json'),
    { rootOnly: true }
  );
  assert.strictEqual(r.ok, true);
});
