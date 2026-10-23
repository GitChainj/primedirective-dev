// src/lib/actp.js — ACTP discovery: find and verify an AI Conscience
// attestation by domain, and return an ACTP verification-result/v1 object.
//
// Works in the browser and in Node. Never throws for an expected condition: a
// missing attestation is "not_found", an unreachable host is "incomplete".
// Verification runs against the FOUNDATION root key, whose fingerprint is
// pinned here: a fetched root whose fingerprint does not match the pin is not
// trusted, and verification is reported INCOMPLETE rather than run against it.

import { versionOf, verifyAttestation, toVerificationResult, INCOMPLETE, PASS, FAIL } from "./attestationVerify.js";
import { fingerprintOf } from "./fingerprint.js";
import { verifyWithDidKey } from "./didKey.js";

// The published Foundation root key fingerprint — the value in
// /.well-known/ai-conscience-root.json. SPKI DER -> SHA-256 -> first 16 hex.
export const ROOT_FINGERPRINT = "e06538b29c5044e3";

const ROOT_PEM_ABSOLUTE = "https://primedirective.dev/.well-known/ai-conscience-root.pem";
const WELL_KNOWN = "/.well-known/ai-conscience.json";

// A host, not a URL: strip scheme, path, userinfo and port, lowercase. https is
// forced by us — an attestation discovered over http proves nothing.
function hostnameOf(input) {
  let s = String(input || "").trim();
  s = s.replace(/^[a-z]+:\/\//i, "");
  s = s.split("/")[0];
  s = s.split("@").pop();
  s = s.split(":")[0];
  return s.toLowerCase();
}

const incomplete = (subject, name, detail) =>
  toVerificationResult({ overall: "incomplete", steps: [{ n: 1, name, status: INCOMPLETE, detail }] }, { subject });

async function loadRootPem(opts, f) {
  if (opts.rootPem) return opts.rootPem;
  // The Foundation root is ours, so no-store is honest here; the adopter's
  // attestation (below) keeps whatever Cache-Control the adopter served.
  const res = await f(ROOT_PEM_ABSOLUTE, { cache: "no-store" });
  if (!res.ok) throw new Error(`root key HTTP ${res.status}`);
  return res.text();
}

export async function discoverAttestation(domain, opts = {}) {
  const subject = hostnameOf(domain);
  const f = opts.fetchImpl || fetch;
  const url = `https://${subject}${WELL_KNOWN}`;

  // 1. Fetch the attestation, honouring the adopter's Cache-Control. A 404 is
  //    "not published here", not an error.
  let doc;
  try {
    const res = await f(url);
    if (res.status === 404) {
      return toVerificationResult({ overall: "not_found", steps: [] }, { subject });
    }
    if (!res.ok) {
      return incomplete(subject, "Fetch attestation", `could not fetch ${url} (HTTP ${res.status})`);
    }
    try {
      doc = await res.json();
    } catch {
      return incomplete(subject, "Parse attestation", "the response was not valid JSON");
    }
  } catch {
    return incomplete(subject, "Fetch attestation", `could not fetch ${url} — network or CORS error`);
  }

  // 2. It must declare a schema we know how to check.
  if (!versionOf(doc)) {
    return incomplete(subject, "Recognise attestation schema",
      "the document does not declare a known ai-conscience v1 or v2 schema");
  }

  // 3. Obtain the Foundation root and PIN it. A root whose fingerprint does not
  //    match the published constant is not trusted.
  let rootPem;
  try {
    rootPem = await loadRootPem(opts, f);
  } catch (e) {
    return incomplete(subject, "Fetch Foundation root key",
      `could not fetch the Foundation root key — ${e.message}`);
  }
  const fp = await fingerprintOf(rootPem);
  if (fp !== ROOT_FINGERPRINT) {
    return incomplete(subject, "Root key matches pinned fingerprint",
      `the fetched root key fingerprint ${fp} does not match the pinned Foundation root ${ROOT_FINGERPRINT}; verification was not run against an untrusted root`);
  }

  // 4. Verify against the pinned root, and emit the ACTP result.
  const internal = await verifyAttestation(doc, rootPem);
  return toVerificationResult(internal, {
    subject,
    reference: doc.reference,
    adopter: doc.adopter,
    adopted_date: doc.adopted_date,
    schema: doc.schema,
    key_custody: doc.key_custody,
    comprehension: doc.comprehension,
  });
}

// ── Decentralised live-key challenge (the fifth check) ──
//
// Any verifier can prove, now, that the party in front of it still controls the
// key on the record — no Foundation involvement, no network, no stored state.
// The verifier mints a fresh challenge, the adopter signs the nonce, and the
// verifier checks the signature against the did:key on the attestation. Replay
// is prevented by binding: the response must echo the exact challenge issued.

function bytesToBase64(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return typeof btoa === "function" ? btoa(bin) : Buffer.from(bytes).toString("base64");
}
function base64ToBytes(b64) {
  if (typeof atob === "function") {
    const bin = atob(String(b64 || ""));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(String(b64 || ""), "base64"));
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// A verifier mints a fresh challenge. No network, no stored state.
export function createChallenge() {
  const nonce = new Uint8Array(32);
  crypto.getRandomValues(nonce);
  return { actp: "1.0", type: "challenge", nonce: bytesToBase64(nonce), issued_at: new Date().toISOString() };
}

// Adopter side: sign the challenge's nonce with the private key, in the same
// key format generateIdentityKey() hands back (raw PKCS#8 bytes).
export async function signChallenge(challenge, privateKeyPkcs8) {
  const key = await crypto.subtle.importKey("pkcs8", privateKeyPkcs8, { name: "Ed25519" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, new TextEncoder().encode(challenge.nonce)));
  return { actp: "1.0", type: "challenge-response", nonce: challenge.nonce, issued_at: challenge.issued_at, signature: bytesToBase64(sig) };
}

// Verifier side: check the response against the challenge it issued. Returns the
// fifth step (internal status pass/fail), ready to append to a verifyAttestation
// result before toVerificationResult(). No network.
export async function verifyChallengeResponse(attestation, response, challenge) {
  const step = (status, detail) => ({ n: 5, name: "Live key challenge", status, detail });
  if (!attestation || !attestation.adopter_did) return step(FAIL, "The attestation records no adopter_did to challenge.");
  if (!response || !response.signature || !response.nonce) return step(FAIL, "The response is missing a nonce or signature.");
  if (!challenge || response.nonce !== challenge.nonce) return step(FAIL, "The response does not answer the challenge that was issued.");
  const age = Date.now() - Date.parse(challenge.issued_at);
  if (!Number.isFinite(age) || age < 0 || age > CHALLENGE_TTL_MS) return step(FAIL, "The challenge has expired; it is valid for five minutes.");
  const ok = await verifyWithDidKey(attestation.adopter_did, challenge.nonce, base64ToBytes(response.signature));
  return step(ok ? PASS : FAIL, ok ? undefined : "The signature does not match the key recorded on the attestation.");
}
