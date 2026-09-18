// Four-step AI Conscience attestation check, in the browser.
//
// This mirrors tools/attest/verify.js @ 1f83598 step for step, using the same
// canonicalization (src/lib/canonicalize.js) and the same fingerprint rule
// (src/lib/fingerprint.js), so a document that verifies here verifies there:
//
//   1. attestation signature valid against the intermediate key
//   2. intermediate certificate valid against the published root — fingerprint
//      match, issuer_fingerprint == root, root signature, and the attestation's
//      signed_at inside the certificate window
//   3. neither intermediate nor attestation revoked
//   4. transparency log entry present and the hash chain intact to that entry
//
// Two differences from the command-line verifier, both deliberate:
//
//   * The root key is FETCHED from the published /.well-known/ai-conscience-root.pem,
//     never embedded in the bundle. One published source of truth.
//   * A check whose inputs are not published yet reports INCOMPLETE, not FAIL.
//     The transparency log and the revocation lists arrive in Phase B; until
//     then "cannot be checked" and "failed" are different statements and the
//     page must not conflate them. A list that IS fetched and fails its
//     signature, or a log that is fetched and is missing the entry or broken,
//     is a real FAIL.
//
// Signature verification is native WebCrypto Ed25519 (Chrome 137+, Safari 17+,
// Firefox 129+). Probed green on Chrome 151 and Safari 26.5 before this was
// written. Browsers without it get a plain message, not a silent pass.

import { canonicalize, canonicalizeOmitting } from "./canonicalize.js";
import { fingerprintOf, pemToBytes } from "./fingerprint.js";

export const PASS = "pass";
export const FAIL = "fail";
export const INCOMPLETE = "incomplete";

export const ROOT_PEM_URL = "/.well-known/ai-conscience-root.pem";

const ZERO_HASH = "0".repeat(64);
const SCHEMA_V1 = "https://primedirective.dev/schemas/ai-conscience/v1";
const SCHEMA_V2 = "https://primedirective.dev/schemas/ai-conscience/v2";

// Which attestation format this document claims to be, from its own schema
// field. Anything else is not an attestation we know how to check.
export function versionOf(doc) {
  const schema = String((doc && (doc.schema || doc.$schema)) || "");
  if (schema === SCHEMA_V1) return "v1";
  if (schema === SCHEMA_V2) return "v2";
  return null;
}

export async function fetchRootPem() {
  const res = await fetch(ROOT_PEM_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const pem = await res.text();
  if (!pem.includes("BEGIN PUBLIC KEY")) throw new Error("not a public key PEM");
  return pem;
}

function base64ToBytes(base64) {
  const binary = atob(String(base64 || ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importVerifyKey(publicKeyPem) {
  return crypto.subtle.importKey("spki", pemToBytes(publicKeyPem), { name: "Ed25519" }, false, ["verify"]);
}

// Detached Ed25519 over the canonical form — the same message bytes the signer
// produced and the command-line verifier recomputes.
export async function verifyDetached(doc, publicKeyPem) {
  try {
    const key = await importVerifyKey(publicKeyPem);
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      base64ToBytes(doc.signature),
      new TextEncoder().encode(canonicalize(doc)),
    );
  } catch {
    return false;
  }
}

// True when Ed25519 is actually usable here, so the page can say so plainly
// instead of reporting a verification failure it cannot distinguish from one.
export async function ed25519Available() {
  try {
    await crypto.subtle.importKey(
      "spki",
      pemToBytes("-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA7XUwWtn4WdSdaGZVQjzJmoZxX6JOWEhENz6uENTrhvA=\n-----END PUBLIC KEY-----"),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return true;
  } catch {
    return false;
  }
}

// A fetch that treats every failure — network, CORS, 404, wrong shape — as
// "not published", because from the page's side they are indistinguishable and
// none of them is evidence that the document is bad.
async function fetchPublished(url, parse) {
  if (!url) return { ok: false };
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false };
    return { ok: true, value: await parse(res) };
  } catch {
    return { ok: false };
  }
}

const fetchJson = (url) => fetchPublished(url, (res) => res.json());
const fetchText = (url) => fetchPublished(url, (res) => res.text());

function step(n, name, status, detail) {
  return { n, name, status, detail };
}

// v1 is signed directly by the root: there is no certificate, no revocation
// list and no log entry for this format, so there is exactly one check.
async function verifyV1(doc, rootPem) {
  const ok = await verifyDetached(doc, rootPem);
  return {
    version: "v1",
    overall: ok ? "verified" : "failed",
    steps: [
      step(1, "Signature valid against the Foundation root key", ok ? PASS : FAIL,
        ok ? undefined : "The signature does not match the published root key."),
    ],
  };
}

async function verifyV2(doc, rootPem) {
  const steps = [];
  const rootFingerprint = await fingerprintOf(rootPem);

  const certResult = await fetchJson(doc.intermediate_cert_url);
  const cert = certResult.ok ? certResult.value : null;

  // Step 1 — the attestation's signature, against the key in the certificate.
  if (!cert) {
    steps.push(step(1, "Attestation signature valid against the intermediate key", INCOMPLETE,
      "The intermediate certificate this attestation names is not published, so there is no key to check the signature against."));
    steps.push(step(2, "Intermediate certificate valid against the published root", INCOMPLETE,
      "Requires the intermediate certificate."));
  } else {
    const sigOk = await verifyDetached(doc, cert.public_key);
    steps.push(step(1, "Attestation signature valid against the intermediate key", sigOk ? PASS : FAIL,
      sigOk ? undefined : "The signature does not match the key in the intermediate certificate."));

    // Step 2 — the certificate itself, against the published root.
    const certKeyFingerprint = await fingerprintOf(cert.public_key);
    const fingerprintOk = certKeyFingerprint === cert.fingerprint;
    const issuerOk = cert.issuer_fingerprint === rootFingerprint;
    const rootSigOk = await verifyDetached(cert, rootPem);
    let windowOk = false;
    let windowDetail;
    if (!cert.not_before || !cert.not_after) {
      windowDetail = "The certificate is missing its validity window.";
    } else {
      const signedAt = Date.parse(doc.signed_at);
      const notBefore = Date.parse(cert.not_before);
      const notAfter = Date.parse(cert.not_after);
      windowOk = Number.isFinite(signedAt) && Number.isFinite(notBefore) && Number.isFinite(notAfter)
        && signedAt >= notBefore && signedAt <= notAfter;
      if (!windowOk) {
        windowDetail = `Signed at ${doc.signed_at}, outside the certificate window ${cert.not_before} to ${cert.not_after}.`;
      }
    }
    const certOk = fingerprintOk && issuerOk && rootSigOk && windowOk;
    const certDetail = !fingerprintOk ? "The certificate's fingerprint does not match its own public key."
      : !issuerOk ? `The certificate names issuer ${cert.issuer_fingerprint}, which is not the published root ${rootFingerprint}.`
      : !rootSigOk ? "The certificate's signature does not verify against the published root key."
      : windowDetail;
    steps.push(step(2, "Intermediate certificate valid against the published root", certOk ? PASS : FAIL, certDetail));
  }

  // Step 3 — revocation. Two lists are needed: the attestation-level list the
  // document points at, and a root-signed intermediate-level list. The second
  // is not published yet and no URL is named for it this phase, so this step
  // can never be more than INCOMPLETE until Phase B — an intermediate is never
  // trusted to report its own revocation, so its own list cannot stand in.
  const listResult = await fetchJson(doc.revocation_check_url);
  const rootListNote = "The root-signed revocation list is not yet published.";
  if (!listResult.ok) {
    steps.push(step(3, "Neither the attestation nor its intermediate is revoked", INCOMPLETE,
      `The revocation list this attestation names is not published. ${rootListNote}`));
  } else {
    const list = listResult.value;
    const signer = cert && list.signed_by_fingerprint === cert.fingerprint ? cert.public_key
      : list.signed_by_fingerprint === rootFingerprint ? rootPem
      : null;
    if (!signer) {
      steps.push(step(3, "Neither the attestation nor its intermediate is revoked", FAIL,
        `The revocation list is signed by ${list.signed_by_fingerprint}, which is neither the root nor the issuing intermediate.`));
    } else if (!(await verifyDetached(list, signer))) {
      steps.push(step(3, "Neither the attestation nor its intermediate is revoked", FAIL,
        "The revocation list's own signature does not verify."));
    } else if ((Array.isArray(list.entries) ? list.entries : [])
      .some((e) => e.kind === "attestation" && e.id === doc.reference)) {
      steps.push(step(3, "Neither the attestation nor its intermediate is revoked", FAIL,
        `${doc.reference} appears on the revocation list.`));
    } else {
      steps.push(step(3, "Neither the attestation nor its intermediate is revoked", INCOMPLETE,
        `${doc.reference} is not on the published revocation list. ${rootListNote}`));
    }
  }

  // Step 4 — presence in the transparency log, with the chain intact from
  // genesis to the matching entry. Presence alone is not enough.
  const logResult = await fetchText(doc.transparency_log_url);
  if (!logResult.ok) {
    steps.push(step(4, "Recorded in the transparency log, chain intact", INCOMPLETE,
      "The transparency log this attestation names is not published."));
  } else {
    let status = FAIL;
    let detail = `No entry for ${doc.reference} in the log.`;
    let previous = ZERO_HASH;
    const lines = logResult.value.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        detail = "The transparency log contains a line that is not valid JSON.";
        break;
      }
      const recomputed = await sha256Hex(canonicalizeOmitting(entry, "entry_hash"));
      if (entry.prev_hash !== previous || entry.entry_hash !== recomputed) {
        detail = `The log's hash chain is broken at entry ${entry.seq}.`;
        break;
      }
      previous = entry.entry_hash;
      if (entry.reference === doc.reference && entry.signature === doc.signature) {
        status = PASS;
        detail = undefined;
        break;
      }
    }
    steps.push(step(4, "Recorded in the transparency log, chain intact", status, detail));
  }

  const overall = steps.some((s) => s.status === FAIL) ? "failed"
    : steps.some((s) => s.status === INCOMPLETE) ? "incomplete"
    : "verified";

  return { version: "v2", overall, steps, certPublished: Boolean(cert) };
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Runs the checks that apply to this document's format. Returns
// { version, overall, steps } where overall is verified | incomplete | failed.
export async function verifyAttestation(doc, rootPem) {
  const version = versionOf(doc);
  if (version === "v1") return verifyV1(doc, rootPem);
  if (version === "v2") return verifyV2(doc, rootPem);
  return null;
}
