'use strict';
// Four-step AI Conscience attestation verifier (Piece 3 Phase A), local-file mode.
//   1. attestation signature valid against the intermediate key
//   2. intermediate certificate valid against the root key (fingerprint match,
//      issuer_fingerprint == root, root signature, and the attestation's
//      signed_at within the certificate's [not_before, not_after] window)
//   3. neither intermediate nor attestation revoked — the revocation list itself
//      must be signed by the root or the issuing intermediate, and that
//      signature must verify (an unsigned or bad-signature list FAILS)
//   4. transparency log entry present AND the hash chain from genesis to the
//      matching entry is intact
// --root-only verifies a v1 attestation directly against the root key (so the
// Foundation's own attestation passes today). Node built-in crypto only.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize, canonicalizeOmitting } = require('./canonicalize.js');

const ROOT_DEFAULT = path.resolve(__dirname, '../seal/public_ed25519.pem');
const ZERO_HASH = '0'.repeat(64);

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

function loadRootPem(opts) {
  if (opts.rootPem) return opts.rootPem;
  return fs.readFileSync(opts.root || ROOT_DEFAULT, 'utf8');
}

// Returns { ok, steps: [{ n, name, ok, detail }] }.
function verifyAttestation(attPath, opts) {
  const att = readJSON(attPath);
  const rootPem = loadRootPem(opts);
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

  // Step 2 — intermediate valid against root: fingerprint matches its key,
  // issuer_fingerprint matches the root, root signature verifies, and the
  // attestation's signed_at falls within the certificate window.
  const rootFp = fingerprintOf(rootPem);
  const fpOk = fingerprintOf(cert.public_key) === cert.fingerprint;
  const issuerOk = cert.issuer_fingerprint === rootFp;
  const rootSigOk = verifyDetached(cert, rootPem);
  let windowOk, windowDetail;
  if (!cert.not_before || !cert.not_after) {
    // The schema requires both; an absent window is never treated as valid.
    windowOk = false;
    windowDetail = 'certificate is missing not_before/not_after (both are required)';
  } else {
    const t = Date.parse(att.signed_at);
    const nb = Date.parse(cert.not_before);
    const na = Date.parse(cert.not_after);
    windowOk = Number.isFinite(t) && Number.isFinite(nb) && Number.isFinite(na) && t >= nb && t <= na;
    if (!windowOk) windowDetail = `attestation signed_at ${att.signed_at} is outside the certificate window [${cert.not_before}, ${cert.not_after}]`;
  }
  const s2 = fpOk && issuerOk && rootSigOk && windowOk;
  const s2detail = !fpOk ? 'cert fingerprint does not match its public key'
    : !issuerOk ? `issuer_fingerprint ${cert.issuer_fingerprint} does not match the root ${rootFp}`
    : !rootSigOk ? 'certificate signature invalid against the root key'
    : windowDetail;
  steps.push({ n: 2, name: 'intermediate certificate valid against root key', ok: s2, detail: s2detail });

  // Step 3 — neither intermediate nor attestation revoked. Two lists are
  // consulted, and each must be signed and verify before it is trusted:
  //   --revocations       attestation-level; signed by the issuing intermediate
  //                       or the root. Reports attestation revocations only.
  //   --root-revocations  intermediate-level; signed by the ROOT only. An
  //                       intermediate-signed list is NEVER trusted to report
  //                       its own revocation, so intermediate revocation is read
  //                       exclusively from the root-signed list.
  // Both must be present; either absent → FAIL.
  let s3 = false;
  let d3;
  if (!opts.revocations) {
    d3 = 'no --revocations supplied (cannot confirm the attestation is not revoked)';
  } else if (!opts.rootRevocations) {
    d3 = 'no --root-revocations supplied (cannot confirm the intermediate is not revoked)';
  } else {
    const attList = readJSON(opts.revocations);
    const rootList = readJSON(opts.rootRevocations);
    let attSigner = null;
    if (attList.signed_by_fingerprint === rootFp) attSigner = rootPem;
    else if (attList.signed_by_fingerprint === cert.fingerprint) attSigner = cert.public_key;

    if (!attSigner) {
      d3 = `attestation revocation list signer ${attList.signed_by_fingerprint} is neither the root nor the issuing intermediate`;
    } else if (!verifyDetached(attList, attSigner)) {
      d3 = 'attestation revocation list signature invalid';
    } else if (rootList.signed_by_fingerprint !== rootFp) {
      d3 = `root revocation list is not signed by the root (${rootList.signed_by_fingerprint})`;
    } else if (!verifyDetached(rootList, rootPem)) {
      d3 = 'root revocation list signature invalid';
    } else {
      const attRevoked = (Array.isArray(attList.entries) ? attList.entries : [])
        .some((e) => e.kind === 'attestation' && e.id === att.reference);
      const interRevoked = (Array.isArray(rootList.entries) ? rootList.entries : [])
        .some((e) => e.kind === 'intermediate' && e.id === cert.fingerprint);
      if (attRevoked) d3 = `attestation ${att.reference} is revoked`;
      else if (interRevoked) d3 = `intermediate ${cert.fingerprint} is revoked`;
      else { s3 = true; d3 = undefined; }
    }
  }
  steps.push({ n: 3, name: 'neither intermediate nor attestation revoked', ok: s3, detail: d3 });

  // Step 4 — transparency log entry present AND the hash chain from genesis to
  // the matching entry is intact.
  let s4 = false;
  let d4 = 'no transparency log supplied';
  if (opts.log) {
    const lines = fs.readFileSync(opts.log, 'utf8')
      .split('\n').map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
    let prev = ZERO_HASH;
    d4 = `no log entry for ${att.reference}`;
    for (const e of lines) {
      const recomputed = crypto.createHash('sha256')
        .update(canonicalizeOmitting(e, 'entry_hash'), 'utf8').digest('hex');
      if (e.prev_hash !== prev || e.entry_hash !== recomputed) {
        s4 = false;
        d4 = `transparency log chain broken at seq ${e.seq}`;
        break;
      }
      prev = e.entry_hash;
      if (e.reference === att.reference && e.signature === att.signature) {
        s4 = true;
        d4 = undefined;
        break;
      }
    }
  }
  steps.push({ n: 4, name: 'transparency log entry present (chain intact)', ok: s4, detail: d4 });

  return { ok: steps.every((s) => s.ok), steps };
}

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--root-only') a.rootOnly = true;
    else if (x === '--root') a.root = argv[++i];
    else if (x === '--root-url') a.rootUrl = argv[++i];
    else if (x === '--intermediate') a.intermediate = argv[++i];
    else if (x === '--revocations') a.revocations = argv[++i];
    else if (x === '--root-revocations') a.rootRevocations = argv[++i];
    else if (x === '--log') a.log = argv[++i];
    else a._.push(x);
  }
  return a;
}

module.exports = { verifyAttestation, verifyDetached, fingerprintOf, canonicalize };

if (require.main === module) {
  (async () => {
    const args = parseArgs(process.argv.slice(2));
    if (!args._[0]) {
      console.error('Usage: node tools/attest/verify.js <attestation.json> [--root-only] [--root pem | --root-url url] [--intermediate cert.json] [--revocations rev.json] [--root-revocations rootrev.json] [--log file]');
      process.exit(2);
    }
    // --root-url fetches the root key fresh (no cache) as an alternative to --root.
    if (args.rootUrl) {
      try {
        const res = await fetch(args.rootUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        args.rootPem = await res.text();
      } catch (e) {
        console.error('ERROR: could not fetch --root-url:', e.message);
        process.exit(2);
      }
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
  })();
}
