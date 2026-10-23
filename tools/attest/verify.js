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
//
// --domain <host> discovers the attestation at https://<host>/.well-known/
// ai-conscience.json, fetches the artifacts it names, verifies it against the
// pinned Foundation root, and prints an ACTP verification-result/v1 JSON
// document — the same shape src/lib/attestationVerify.js emits in the browser.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize, canonicalizeOmitting } = require('./canonicalize.js');

const ROOT_DEFAULT = path.resolve(__dirname, '../seal/public_ed25519.pem');
const ZERO_HASH = '0'.repeat(64);

// The published Foundation root key fingerprint — /.well-known/ai-conscience-root.json.
const ROOT_FINGERPRINT = 'e06538b29c5044e3';
const ROOT_PEM_ABSOLUTE = 'https://primedirective.dev/.well-known/ai-conscience-root.pem';
const WELL_KNOWN = '/.well-known/ai-conscience.json';

const SCHEMA_V1 = 'https://primedirective.dev/schemas/ai-conscience/v1';
const SCHEMA_V2 = 'https://primedirective.dev/schemas/ai-conscience/v2';
function versionOf(doc) {
  const s = String((doc && (doc.schema || doc.$schema)) || '');
  if (s === SCHEMA_V1) return 'v1';
  if (s === SCHEMA_V2) return 'v2';
  return null;
}

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

// ── ACTP discovery by domain ──
//
// A faithful CommonJS mirror of src/lib/attestationVerify.js verifyV1/verifyV2
// and toVerificationResult(). The ESM library cannot be require()d from this CJS
// tool, so the logic is duplicated and kept honest by test/actp-discovery.test.js,
// which runs BOTH over the same fixtures and asserts identical ACTP output.
// Step 3 matches the library exactly: only the attestation-level list the
// document names is fetched; the root-signed list is not published this phase,
// so the clean case is INCOMPLETE, never PASS.

function hostnameOf(input) {
  let s = String(input || '').trim();
  s = s.replace(/^[a-z]+:\/\//i, '');
  s = s.split('/')[0];
  s = s.split('@').pop();
  s = s.split(':')[0];
  return s.toLowerCase();
}
async function fetchJsonMaybe(f, url) {
  try { const res = await f(url); if (!res.ok) return null; return await res.json(); } catch { return null; }
}
async function fetchTextMaybe(f, url) {
  try { const res = await f(url); if (!res.ok) return null; return await res.text(); } catch { return null; }
}
async function rootPemForDomain(opts, f) {
  if (opts.rootPem) return opts.rootPem;
  if (opts.root) return fs.readFileSync(opts.root, 'utf8');
  const res = await f(ROOT_PEM_ABSOLUTE, { cache: 'no-store' });
  if (!res.ok) throw new Error(`root key HTTP ${res.status}`);
  return res.text();
}
function overallOf(steps) {
  if (steps.some((s) => s.status === 'fail')) return 'failed';
  if (steps.some((s) => s.status === 'incomplete')) return 'incomplete';
  return 'verified';
}

function verifyDomainV1(doc, rootPem) {
  const ok = verifyDetached(doc, rootPem);
  return [{ n: 1, name: 'Signature valid against the Foundation root key', status: ok ? 'pass' : 'fail',
    detail: ok ? undefined : 'The signature does not match the published root key.' }];
}

async function verifyDomainV2(doc, rootPem, f) {
  const steps = [];
  const rootFingerprint = fingerprintOf(rootPem);
  const cert = doc.intermediate_cert_url ? await fetchJsonMaybe(f, doc.intermediate_cert_url) : null;

  if (!cert) {
    steps.push({ n: 1, name: 'Attestation signature valid against the intermediate key', status: 'incomplete',
      detail: 'The intermediate certificate this attestation names is not published, so there is no key to check the signature against.' });
    steps.push({ n: 2, name: 'Intermediate certificate valid against the published root', status: 'incomplete',
      detail: 'Requires the intermediate certificate.' });
  } else {
    const sigOk = verifyDetached(doc, cert.public_key);
    steps.push({ n: 1, name: 'Attestation signature valid against the intermediate key', status: sigOk ? 'pass' : 'fail',
      detail: sigOk ? undefined : 'The signature does not match the key in the intermediate certificate.' });

    const fingerprintOk = fingerprintOf(cert.public_key) === cert.fingerprint;
    const issuerOk = cert.issuer_fingerprint === rootFingerprint;
    const rootSigOk = verifyDetached(cert, rootPem);
    let windowOk = false;
    let windowDetail;
    if (!cert.not_before || !cert.not_after) {
      windowDetail = 'The certificate is missing its validity window.';
    } else {
      const signedAt = Date.parse(doc.signed_at);
      const notBefore = Date.parse(cert.not_before);
      const notAfter = Date.parse(cert.not_after);
      windowOk = Number.isFinite(signedAt) && Number.isFinite(notBefore) && Number.isFinite(notAfter)
        && signedAt >= notBefore && signedAt <= notAfter;
      if (!windowOk) windowDetail = `Signed at ${doc.signed_at}, outside the certificate window ${cert.not_before} to ${cert.not_after}.`;
    }
    const certOk = fingerprintOk && issuerOk && rootSigOk && windowOk;
    const certDetail = !fingerprintOk ? "The certificate's fingerprint does not match its own public key."
      : !issuerOk ? `The certificate names issuer ${cert.issuer_fingerprint}, which is not the published root ${rootFingerprint}.`
      : !rootSigOk ? "The certificate's signature does not verify against the published root key."
      : windowDetail;
    steps.push({ n: 2, name: 'Intermediate certificate valid against the published root', status: certOk ? 'pass' : 'fail', detail: certDetail });
  }

  // Step 3 — only the attestation-level list the document names; the root-signed
  // list is unpublished this phase, so the clean case is INCOMPLETE.
  const rootListNote = 'The root-signed revocation list is not yet published.';
  const list = doc.revocation_check_url ? await fetchJsonMaybe(f, doc.revocation_check_url) : null;
  if (!list) {
    steps.push({ n: 3, name: 'Neither the attestation nor its intermediate is revoked', status: 'incomplete',
      detail: `The revocation list this attestation names is not published. ${rootListNote}` });
  } else {
    const signer = cert && list.signed_by_fingerprint === cert.fingerprint ? cert.public_key
      : list.signed_by_fingerprint === rootFingerprint ? rootPem : null;
    if (!signer) {
      steps.push({ n: 3, name: 'Neither the attestation nor its intermediate is revoked', status: 'fail',
        detail: `The revocation list is signed by ${list.signed_by_fingerprint}, which is neither the root nor the issuing intermediate.` });
    } else if (!verifyDetached(list, signer)) {
      steps.push({ n: 3, name: 'Neither the attestation nor its intermediate is revoked', status: 'fail',
        detail: "The revocation list's own signature does not verify." });
    } else if ((Array.isArray(list.entries) ? list.entries : []).some((e) => e.kind === 'attestation' && e.id === doc.reference)) {
      steps.push({ n: 3, name: 'Neither the attestation nor its intermediate is revoked', status: 'fail',
        detail: `${doc.reference} appears on the revocation list.` });
    } else {
      steps.push({ n: 3, name: 'Neither the attestation nor its intermediate is revoked', status: 'incomplete',
        detail: `${doc.reference} is not on the published revocation list. ${rootListNote}` });
    }
  }

  // Step 4 — transparency log entry present, chain intact.
  const logText = doc.transparency_log_url ? await fetchTextMaybe(f, doc.transparency_log_url) : null;
  if (logText === null) {
    steps.push({ n: 4, name: 'Recorded in the transparency log, chain intact', status: 'incomplete',
      detail: 'The transparency log this attestation names is not published.' });
  } else {
    let status = 'fail';
    let detail = `No entry for ${doc.reference} in the log.`;
    let previous = ZERO_HASH;
    for (const line of logText.split('\n').map((l) => l.trim()).filter(Boolean)) {
      let entry;
      try { entry = JSON.parse(line); } catch { detail = 'The transparency log contains a line that is not valid JSON.'; break; }
      const recomputed = crypto.createHash('sha256').update(canonicalizeOmitting(entry, 'entry_hash'), 'utf8').digest('hex');
      if (entry.prev_hash !== previous || entry.entry_hash !== recomputed) {
        detail = `The log's hash chain is broken at entry ${entry.seq}.`; break;
      }
      previous = entry.entry_hash;
      if (entry.reference === doc.reference && entry.signature === doc.signature) { status = 'pass'; detail = undefined; break; }
    }
    steps.push({ n: 4, name: 'Recorded in the transparency log, chain intact', status, detail });
  }

  return steps;
}

// CJS mirror of src/lib/attestationVerify.js toVerificationResult().
const ACTP_STATUS = { pass: 'PASS', fail: 'FAIL', incomplete: 'INCOMPLETE' };
function joinNames(names) {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
function toActpResult(internal, opts = {}) {
  const i = internal || {};
  const overall = i.overall || 'incomplete';
  const steps = (i.steps || []).map((s) => {
    const out = { n: s.n, name: s.name, status: ACTP_STATUS[s.status] || 'INCOMPLETE' };
    if (s.detail) out.detail = s.detail;
    return out;
  });
  if (!steps.some((s) => s.n === 5)) {
    steps.push({ n: 5, name: 'Live key challenge', status: 'SKIPPED', detail: 'Not run — supply a signed challenge response to exercise the fifth check.' });
  }
  const stepPassed = (n) => steps.some((s) => s.n === n && s.status === 'PASS');
  const incompleteNames = steps.filter((s) => s.status === 'INCOMPLETE').map((s) => s.name);
  const proves = [];
  if (overall !== 'failed' && overall !== 'not_found') {
    if (stepPassed(1)) proves.push('the document is unaltered since it was signed by the key it names');
    if (stepPassed(2) || (i.version === 'v1' && stepPassed(1))) {
      proves.push("that key is the Foundation's — the Foundation vouched for this adoption on the stated date");
    }
  }
  const does_not_prove = [];
  if (overall === 'not_found') {
    does_not_prove.push('that the subject has not adopted the covenant — only that no attestation was published at this address');
  }
  if (incompleteNames.length) {
    does_not_prove.push(`checks ${joinNames(incompleteNames)} could not complete and are reported as not checked, not as passed`);
  }
  if (!stepPassed(5)) {
    does_not_prove.push('that whoever presents this attestation controls the key on record — the live-key check was not run');
  }
  does_not_prove.push("the adopter's conduct — this is a verified commitment and a public record, nothing more");
  const out = {
    actp: '1.0',
    subject: opts.subject || 'unknown',
    overall,
    steps,
    proves,
    does_not_prove,
    checked_at: opts.checkedAt || new Date().toISOString(),
    verifier: opts.verifier || 'actp-js/1.0',
  };
  for (const k of ['reference', 'schema', 'mark', 'adopter', 'adopted_date', 'key_custody', 'comprehension']) {
    if (opts[k] !== undefined && opts[k] !== null) out[k] = opts[k];
  }
  return out;
}

async function discoverByDomain(domain, opts = {}) {
  const subject = hostnameOf(domain);
  const f = opts.fetchImpl || fetch;
  const url = `https://${subject}${WELL_KNOWN}`;
  const incomplete = (name, detail) =>
    toActpResult({ overall: 'incomplete', steps: [{ n: 1, name, status: 'incomplete', detail }] }, { subject, checkedAt: opts.checkedAt });

  let doc;
  try {
    const res = await f(url);
    if (res.status === 404) return toActpResult({ overall: 'not_found', steps: [] }, { subject, checkedAt: opts.checkedAt });
    if (!res.ok) return incomplete('Fetch attestation', `could not fetch ${url} (HTTP ${res.status})`);
    try { doc = await res.json(); } catch { return incomplete('Parse attestation', 'the response was not valid JSON'); }
  } catch {
    return incomplete('Fetch attestation', `could not fetch ${url} — network or DNS error`);
  }

  const version = versionOf(doc);
  if (!version) return incomplete('Recognise attestation schema', 'the document does not declare a known ai-conscience v1 or v2 schema');

  let rootPem;
  try { rootPem = await rootPemForDomain(opts, f); }
  catch (e) { return incomplete('Fetch Foundation root key', `could not fetch the Foundation root key — ${e.message}`); }
  if (fingerprintOf(rootPem) !== ROOT_FINGERPRINT) {
    return incomplete('Root key matches pinned fingerprint',
      `the fetched root key fingerprint ${fingerprintOf(rootPem)} does not match the pinned Foundation root ${ROOT_FINGERPRINT}; verification was not run against an untrusted root`);
  }

  const steps = version === 'v1' ? verifyDomainV1(doc, rootPem) : await verifyDomainV2(doc, rootPem, f);
  return toActpResult({ version, overall: overallOf(steps), steps }, {
    subject, checkedAt: opts.checkedAt,
    reference: doc.reference, adopter: doc.adopter, adopted_date: doc.adopted_date,
    schema: doc.schema, key_custody: doc.key_custody, comprehension: doc.comprehension,
  });
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
    else if (x === '--domain') a.domain = argv[++i];
    else a._.push(x);
  }
  return a;
}

module.exports = { verifyAttestation, verifyDetached, fingerprintOf, canonicalize, toActpResult, discoverByDomain, ROOT_FINGERPRINT };

if (require.main === module) {
  (async () => {
    const args = parseArgs(process.argv.slice(2));

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

    // --domain: discover, verify, and print the ACTP verification-result JSON.
    if (args.domain) {
      const result = await discoverByDomain(args.domain, args);
      console.log(JSON.stringify(result, null, 2));
      const code = result.overall === 'verified' ? 0
        : result.overall === 'failed' ? 1
        : result.overall === 'incomplete' ? 3
        : 4; // not_found
      process.exit(code);
    }

    if (!args._[0]) {
      console.error('Usage: node tools/attest/verify.js <attestation.json> [--root-only] [--root pem | --root-url url] [--intermediate cert.json] [--revocations rev.json] [--root-revocations rootrev.json] [--log file]');
      console.error('   or: node tools/attest/verify.js --domain <host> [--root pem | --root-url url]');
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
  })();
}
