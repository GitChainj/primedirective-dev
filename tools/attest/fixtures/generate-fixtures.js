'use strict';
// Regenerates the throwaway TEST fixtures for the tools/attest tests.
// The *.key.pem files written here are DISPOSABLE TEST MATERIAL — never the real
// root/intermediate signing keys — and are gitignored. The public halves, the
// intermediate certificate, the signed attestations, the revocation list, and
// the transparency log ARE committed (tests need only those). Node built-in
// crypto only.
//
//   node tools/attest/fixtures/generate-fixtures.js
//
// Fixture references use the T-form (UPD-YYYY-T####) so a fixture can never be
// mistaken for a real, production adoption reference.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize } = require('../canonicalize.js');
const { fingerprintOf } = require('../verify.js');

const DIR = __dirname;
const w = (name, data) => fs.writeFileSync(path.join(DIR, name), data);
const wj = (name, obj) => w(name, JSON.stringify(obj, null, 2) + '\n');

function genKey() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return {
    pub: publicKey.export({ type: 'spki', format: 'pem' }),
    key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    keyObj: privateKey,
  };
}
function signDetached(doc, keyObj) {
  return crypto.sign(null, Buffer.from(canonicalize(doc), 'utf8'), keyObj).toString('base64');
}

// ── keys (private halves gitignored) ──
const root = genKey();
const inter = genKey();
w('test-root.key.pem', root.key);              // THROWAWAY TEST KEY (gitignored)
w('test-root.pub.pem', root.pub);
w('test-intermediate.key.pem', inter.key);     // THROWAWAY TEST KEY (gitignored)
w('test-intermediate.pub.pem', inter.pub);

// ── intermediate cert (root signs it). Provisional format — see README. ──
const cert = { public_key: inter.pub, fingerprint: fingerprintOf(inter.pub) };
cert.signature = signDetached(cert, root.keyObj);
wj('test-intermediate.cert.json', cert);

// ── a base valid v2 attestation, signed by the intermediate ──
function baseAtt(reference) {
  return {
    schema: 'https://primedirective.dev/schemas/ai-conscience/v2',
    status: 'adopted',
    mark: 'certified-ai-conscience',
    reference,
    adopter: 'Test Adopter (fixture)',
    adopted_date: '2026-09-01',
    truths_version: '1.0',
    articles_version: '1.0',
    adopter_identity_class: 'public_name',
    public_key_fingerprint: cert.fingerprint,
    intermediate_cert_url: 'https://conscience.wiki/certs/test-intermediate.cert.json',
    signed_at: '2026-09-01T00:00:00Z',
    verification_url: 'https://conscience.wiki/verify/' + reference,
    revocation_check_url: 'https://conscience.wiki/revocations.json',
    transparency_log_url: 'https://conscience.wiki/attestations.log',
  };
}
function signed(reference) {
  const a = baseAtt(reference);
  a.signature = signDetached(a, inter.keyObj);
  return a;
}

const valid = signed('UPD-2026-T9001');
const bad = signed('UPD-2026-T9002');
bad.signature = Buffer.from('tampered-not-a-real-signature').toString('base64'); // break step 1
const revoked = signed('UPD-2026-T9003');
const missing = signed('UPD-2026-T9004');

wj('valid.json', valid);
wj('bad-signature.json', bad);
wj('revoked.json', revoked);
wj('missing-from-log.json', missing);

// ── revocation list: only the revoked fixture ──
wj('revocations.json', { revoked: ['UPD-2026-T9003'] });

// ── transparency log: everyone EXCEPT missing-from-log ──
const log = [valid, bad, revoked]
  .map((a) => JSON.stringify({ reference: a.reference, signature: a.signature, signed_at: a.signed_at }))
  .join('\n') + '\n';
w('attestations.log', log);

console.log('Fixtures regenerated in', DIR);
