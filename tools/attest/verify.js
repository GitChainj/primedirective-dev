'use strict';
// Four-step AI Conscience attestation verifier (Piece 3 Phase A), local-file mode.
//   1. attestation signature valid against the intermediate key
//   2. intermediate certificate valid against the root key
//   3. neither intermediate nor attestation revoked
//   4. transparency log entry present
// --root-only verifies a v1 attestation directly against the root key (so the
// Foundation's own attestation passes today). Node built-in crypto only.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize } = require('./canonicalize.js');

const ROOT_DEFAULT = path.resolve(__dirname, '../seal/public_ed25519.pem');

function fingerprintOf(publicKeyPem) {
  const der = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' });
  return crypto.createHash('sha256').update(der).digest('hex').slice(0, 16);
}

function verifyDetached(doc, publicKeyPem) {
  const message = Buffer.from(canonicalize(doc), 'utf8');
  const sig = Buffer.from(doc.signature || '', 'base64');
  try {
    return crypto.verify(null, message, crypto.createPublicKey(publicKeyPem), sig);
  } catch {
    return false;
  }
}

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

// Returns { ok, steps: [{ n, name, ok, detail }] }.
function verifyAttestation(attPath, opts) {
  const att = readJSON(attPath);
  const rootPem = fs.readFileSync(opts.root || ROOT_DEFAULT, 'utf8');
  const steps = [];

  if (opts.rootOnly) {
    const ok = verifyDetached(att, rootPem);
    steps.push({ n: 1, name: 'signature valid against ROOT key (root-only / v1)', ok });
    return { ok, steps };
  }

  // Step 1 — signature valid against intermediate key
  if (!opts.intermediate) throw new Error('--intermediate <cert.json> required (or use --root-only)');
  const cert = readJSON(opts.intermediate);
  const s1 = verifyDetached(att, cert.public_key);
  steps.push({ n: 1, name: 'attestation signature valid against intermediate key', ok: s1 });

  // Step 2 — intermediate valid against root (fingerprint matches its key AND root-signed)
  const fpOk = fingerprintOf(cert.public_key) === cert.fingerprint;
  const s2 = fpOk && verifyDetached(cert, rootPem);
  steps.push({
    n: 2,
    name: 'intermediate certificate valid against root key',
    ok: s2,
    detail: fpOk ? undefined : 'cert fingerprint does not match its public key',
  });

  // Step 3 — neither intermediate nor attestation revoked
  let s3 = false;
  let d3 = 'no revocation list supplied (cannot confirm not-revoked)';
  if (opts.revocations) {
    const list = readJSON(opts.revocations).revoked || [];
    if (list.includes(att.reference)) { s3 = false; d3 = `attestation ${att.reference} is revoked`; }
    else if (list.includes(cert.fingerprint)) { s3 = false; d3 = `intermediate ${cert.fingerprint} is revoked`; }
    else { s3 = true; d3 = undefined; }
  }
  steps.push({ n: 3, name: 'neither intermediate nor attestation revoked', ok: s3, detail: d3 });

  // Step 4 — transparency log entry present
  let s4 = false;
  let d4 = 'no transparency log supplied';
  if (opts.log) {
    const lines = fs.readFileSync(opts.log, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
    s4 = lines.some((l) => {
      try { const e = JSON.parse(l); return e.reference === att.reference && e.signature === att.signature; }
      catch { return false; }
    });
    d4 = s4 ? undefined : `no log entry for ${att.reference}`;
  }
  steps.push({ n: 4, name: 'transparency log entry present', ok: s4, detail: d4 });

  return { ok: steps.every((s) => s.ok), steps };
}

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--root-only') a.rootOnly = true;
    else if (x === '--root') a.root = argv[++i];
    else if (x === '--intermediate') a.intermediate = argv[++i];
    else if (x === '--revocations') a.revocations = argv[++i];
    else if (x === '--log') a.log = argv[++i];
    else a._.push(x);
  }
  return a;
}

module.exports = { verifyAttestation, verifyDetached, fingerprintOf, canonicalize };

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (!args._[0]) {
    console.error('Usage: node tools/attest/verify.js <attestation.json> [--root-only] [--root pem] [--intermediate cert.json] [--revocations rev.json] [--log file]');
    process.exit(2);
  }
  let result;
  try {
    result = verifyAttestation(args._[0], args);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(2);
  }
  for (const s of result.steps) {
    console.log(`  [${s.ok ? 'PASS' : 'FAIL'}] step ${s.n}: ${s.name}${s.detail ? ' — ' + s.detail : ''}`);
  }
  console.log(result.ok ? 'VERIFIED' : 'FAILED');
  process.exit(result.ok ? 0 : 1);
}
