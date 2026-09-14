'use strict';
// Regenerates the throwaway TEST fixtures for the tools/attest tests, under the
// Phase 33.4 formats (formal intermediate cert, hash-chained transparency log,
// structured signed revocation list). The *.key.pem files written here are
// DISPOSABLE TEST MATERIAL — never the real root/intermediate signing keys — and
// are gitignored. The public halves, cert, signed attestations, revocation
// lists, and logs ARE committed (tests need only those). Node built-in crypto.
//
//   node tools/attest/fixtures/generate-fixtures.js
//
// Fixture references use the T-form (UPD-YYYY-T####) so a fixture can never be
// mistaken for a real, production adoption reference.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize, canonicalizeOmitting } = require('../canonicalize.js');
const { fingerprintOf } = require('../verify.js');

const DIR = __dirname;
const ZERO_HASH = '0'.repeat(64);
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
const inter2 = genKey(); // a SECOND intermediate, used only to be root-revoked
const adopter = genKey(); // only its fingerprint is used, for ai-system attestations
w('test-root.key.pem', root.key);              // THROWAWAY TEST KEY (gitignored)
w('test-root.pub.pem', root.pub);
w('test-intermediate.key.pem', inter.key);     // THROWAWAY TEST KEY (gitignored)
w('test-intermediate.pub.pem', inter.pub);
w('test-intermediate2.key.pem', inter2.key);   // THROWAWAY TEST KEY (gitignored)
w('test-intermediate2.pub.pem', inter2.pub);

const rootFp = fingerprintOf(root.pub);
const interFp = fingerprintOf(inter.pub);
const inter2Fp = fingerprintOf(inter2.pub);
const adopterFp = fingerprintOf(adopter.pub);

// ── intermediate certs (formal v1; root signs them) ──
const WINDOW = ['2026-01-01T00:00:00Z', '2027-01-01T00:00:00Z'];
function makeCert({ keyId, pub, fp, window }) {
  const c = {
    schema: 'https://primedirective.dev/schemas/ai-conscience/intermediate-cert/v1',
    key_id: keyId,
    public_key: pub,
    fingerprint: fp,
    signature_algorithm: 'Ed25519',
    issuer_fingerprint: rootFp,
    ...(window ? { not_before: window[0], not_after: window[1] } : {}),
  };
  c.signature = signDetached(c, root.keyObj);
  return c;
}
const cert = makeCert({ keyId: 'test-intermediate-2026', pub: inter.pub, fp: interFp, window: WINDOW });
wj('test-intermediate.cert.json', cert);
const cert2 = makeCert({ keyId: 'test-intermediate2-2026', pub: inter2.pub, fp: inter2Fp, window: WINDOW });
wj('test-intermediate2.cert.json', cert2);
// Deliberately missing not_before/not_after → step 2 must FAIL.
const certNoWindow = makeCert({ keyId: 'test-intermediate-nowindow', pub: inter.pub, fp: interFp, window: null });
wj('test-intermediate-nowindow.cert.json', certNoWindow);

// ── a base valid v2 attestation, signed by the intermediate ──
function baseAtt(reference, signedAt, pkFp) {
  return {
    schema: 'https://primedirective.dev/schemas/ai-conscience/v2',
    status: 'adopted',
    mark: 'certified-ai-conscience',
    reference,
    adopter: 'Test Adopter (fixture)',
    adopted_date: '2026-09-01',
    truths_version: '1.0',
    articles_version: '1.0',
    adoption_path: 'ai-system',
    adopter_identity_class: 'public_name',
    adopter_public_key_fingerprint: adopterFp,
    public_key_fingerprint: pkFp || interFp,
    intermediate_cert_url: 'https://conscience.wiki/certs/test-intermediate.cert.json',
    signature_algorithm: 'Ed25519',
    signed_at: signedAt || '2026-09-01T00:00:00Z',
    verification_url: 'https://conscience.wiki/verify/' + reference,
    revocation_check_url: 'https://conscience.wiki/revocations.json',
    transparency_log_url: 'https://conscience.wiki/attestations.log',
  };
}
function signed(reference, signedAt, signer) {
  signer = signer || { keyObj: inter.keyObj, fp: interFp };
  const a = baseAtt(reference, signedAt, signer.fp);
  a.signature = signDetached(a, signer.keyObj);
  return a;
}

const valid = signed('UPD-2026-T9001');
const bad = signed('UPD-2026-T9002');
bad.signature = Buffer.from('tampered-not-a-real-signature').toString('base64'); // break step 1
const revoked = signed('UPD-2026-T9003');
const missing = signed('UPD-2026-T9004');                                        // absent from log
const brokenChain = signed('UPD-2026-T9005');                                    // present only in broken log
const outOfWindow = signed('UPD-2026-T9006', '2030-06-01T00:00:00Z');            // signed_at after not_after
// Signed by the SECOND intermediate, whose fingerprint the root-revocation list
// revokes — so it fails only at step 3 via the root-signed list.
const revokedIntermediate = signed('UPD-2026-T9007', undefined, { keyObj: inter2.keyObj, fp: inter2Fp });

wj('valid.json', valid);
wj('bad-signature.json', bad);
wj('revoked.json', revoked);
wj('missing-from-log.json', missing);
wj('broken-chain.json', brokenChain);
wj('out-of-window.json', outOfWindow);
wj('revoked-intermediate.json', revokedIntermediate);

// ── structured, signed revocation list (attestation-level → intermediate) ──
function signList(list, keyObj, fingerprint) {
  list.signed_by_fingerprint = fingerprint;
  list.signature = signDetached(list, keyObj);
  return list;
}
const revocations = signList({
  schema: 'https://primedirective.dev/schemas/ai-conscience/revocations/v1',
  issued_at: '2026-09-02T00:00:00Z',
  entries: [
    { id: 'UPD-2026-T9003', kind: 'attestation', revoked_at: '2026-09-02T00:00:00Z', reason: 'forfeit' },
  ],
}, inter.keyObj, interFp);
wj('revocations.json', revocations);

// Same list, signature deliberately corrupted → step 3 must FAIL.
const revocationsBad = JSON.parse(JSON.stringify(revocations));
revocationsBad.signature = Buffer.from('tampered-revocation-signature').toString('base64');
wj('revocations-badsig.json', revocationsBad);

// ── root-signed revocation list (intermediate-level) revoking inter2 ──
const rootRevocations = signList({
  schema: 'https://primedirective.dev/schemas/ai-conscience/revocations/v1',
  issued_at: '2026-09-02T00:00:00Z',
  entries: [
    { id: inter2Fp, kind: 'intermediate', revoked_at: '2026-09-02T00:00:00Z', reason: 'compromise' },
  ],
}, root.keyObj, rootFp);
wj('root-revocations.json', rootRevocations);

// ── hash-chained transparency log (JSONL) ──
function logEntry(seq, att, prevHash) {
  const entry = {
    seq,
    reference: att.reference,
    signature: att.signature,
    signed_at: att.signed_at,
    intermediate_fingerprint: att.public_key_fingerprint,
    prev_hash: prevHash,
  };
  entry.entry_hash = crypto.createHash('sha256')
    .update(canonicalizeOmitting(entry, 'entry_hash'), 'utf8').digest('hex');
  return entry;
}
function chainLog(atts) {
  const out = [];
  let prev = ZERO_HASH;
  atts.forEach((att, i) => {
    const e = logEntry(i, att, prev);
    out.push(e);
    prev = e.entry_hash;
  });
  return out.map((e) => JSON.stringify(e)).join('\n') + '\n';
}

// Intact chain: everyone present EXCEPT missing (T9004), broken (T9005), and
// out-of-window is present so it fails only at step 2, not step 4.
w('attestations.log', chainLog([valid, bad, revoked, outOfWindow, revokedIntermediate]));

// Broken chain: a single genesis entry whose prev_hash is NOT the zero hash, so
// the chain check fails before the entry can be accepted.
const brokenEntry = logEntry(0, brokenChain, 'f'.repeat(64));
w('attestations-broken.log', JSON.stringify(brokenEntry) + '\n');

console.log('Fixtures regenerated in', DIR);
