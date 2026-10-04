// The fingerprint rule is load-bearing: adopter_public_key_fingerprint must come
// out identical in every implementation, or an AI attestation verifies in one
// place and fails in another. These tests treat drift here with the same gravity
// as drift in the adoption hash.

import test from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";

import {
  didKeyFromRawPublicKey,
  rawPublicKeyFromDidKey,
  spkiDerFromRawPublicKey,
  spkiPemFromRawPublicKey,
  fingerprintFromDidKey,
  fingerprintFromRawPublicKey,
  verifyWithDidKey,
  isDidKey,
  DID_KEY_PATTERN,
} from "../src/lib/didKey.js";
import { fingerprintOf } from "../src/lib/fingerprint.js";
import { fingerprintFromDid } from "../api/_lib/attestation.js";

// A fixed key, so this test pins actual values rather than only self-consistency.
// Generated once and recorded here; if any implementation drifts, these fail.
const KNOWN_RAW_HEX =
  "d75305ad9f859d49d68665542 3cc99a86715fa24e584844373eae10d4eb86f0".replace(/\s/g, "");
const KNOWN_PEM =
  "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA7XUwWtn4WdSdaGZVQjzJmoZxX6JOWEhENz6uENTrhvA=\n-----END PUBLIC KEY-----\n";

// The Foundation's published root key is a convenient known Ed25519 key with a
// published fingerprint — e06538b29c5044e3 — so it anchors the rule to a value
// that exists outside this repo's own tests.
const KNOWN_FINGERPRINT = "e06538b29c5044e3";

function rawFromPem(pem) {
  return new Uint8Array(
    crypto.createPublicKey(pem).export({ type: "spki", format: "der" }).subarray(12),
  );
}

test("every implementation agrees on the fingerprint of a known key", async () => {
  const raw = rawFromPem(KNOWN_PEM);
  const did = didKeyFromRawPublicKey(raw);

  const viaDid = await fingerprintFromDidKey(did);
  const viaRaw = await fingerprintFromRawPublicKey(raw);
  const viaPem = await fingerprintOf(KNOWN_PEM);
  const viaAttestationModule = fingerprintFromDid(did);
  const viaSigningServiceRule = crypto
    .createHash("sha256")
    .update(crypto.createPublicKey(KNOWN_PEM).export({ type: "spki", format: "der" }))
    .digest("hex")
    .slice(0, 16);

  assert.strictEqual(viaDid, KNOWN_FINGERPRINT, "the did:key route must match the published value");
  assert.strictEqual(viaRaw, KNOWN_FINGERPRINT);
  assert.strictEqual(viaPem, KNOWN_FINGERPRINT);
  assert.strictEqual(viaAttestationModule, KNOWN_FINGERPRINT);
  assert.strictEqual(viaSigningServiceRule, KNOWN_FINGERPRINT);
});

test("fingerprints agree across implementations for freshly generated keys", async () => {
  for (let i = 0; i < 5; i++) {
    const pem = crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" });
    const raw = rawFromPem(pem);
    const did = didKeyFromRawPublicKey(raw);
    const values = new Set([
      await fingerprintFromDidKey(did),
      await fingerprintOf(pem),
      fingerprintFromDid(did),
      crypto.createHash("sha256")
        .update(crypto.createPublicKey(pem).export({ type: "spki", format: "der" }))
        .digest("hex").slice(0, 16),
    ]);
    assert.strictEqual(values.size, 1, `implementations disagreed: ${[...values].join(" vs ")}`);
  }
});

test("did:key round-trips and matches the schema pattern", () => {
  for (let i = 0; i < 5; i++) {
    const pem = crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" });
    const raw = rawFromPem(pem);
    const did = didKeyFromRawPublicKey(raw);
    assert.match(did, DID_KEY_PATTERN, "must satisfy the v2 schema pattern");
    assert.match(did, /^did:key:z6Mk/, "Ed25519 did:keys begin z6Mk");
    assert.deepStrictEqual(rawPublicKeyFromDidKey(did), raw, "round-trip must be lossless");
    assert.ok(isDidKey(did));
  }
});

test("the SPKI DER we build is the DER node:crypto builds", () => {
  const pem = crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" });
  const raw = rawFromPem(pem);
  const ours = Buffer.from(spkiDerFromRawPublicKey(raw));
  const theirs = crypto.createPublicKey(pem).export({ type: "spki", format: "der" });
  assert.ok(ours.equals(theirs), "a given Ed25519 key has exactly one SPKI DER encoding");
  // And the PEM we rebuild must load back into node:crypto.
  assert.ok(crypto.createPublicKey(spkiPemFromRawPublicKey(raw)), "rebuilt PEM must be loadable");
});

test("malformed and unsupported identifiers are refused", () => {
  for (const bad of [
    "",
    "did:web:example.com",
    "did:key:6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH", // no multibase z
    "did:key:zNOT0VALID0BASE58", // 0 is not in the base58 alphabet
    "did:key:z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc", // X25519, not Ed25519
  ]) {
    assert.strictEqual(isDidKey(bad), false, `${bad || "(empty)"} must not pass`);
  }
  assert.throws(() => didKeyFromRawPublicKey(new Uint8Array(31)), /32 bytes/);
});

test("a signature verifies against its did:key, and only against its own", async () => {
  const a = crypto.generateKeyPairSync("ed25519");
  const b = crypto.generateKeyPairSync("ed25519");
  const didA = didKeyFromRawPublicKey(rawFromPem(a.publicKey.export({ type: "spki", format: "pem" })));
  const didB = didKeyFromRawPublicKey(rawFromPem(b.publicKey.export({ type: "spki", format: "pem" })));

  const message = "a nonce the verifier chose";
  const signature = new Uint8Array(crypto.sign(null, Buffer.from(message, "utf8"), a.privateKey));

  assert.strictEqual(await verifyWithDidKey(didA, message, signature), true);
  assert.strictEqual(await verifyWithDidKey(didB, message, signature), false, "another key must not verify");
  assert.strictEqual(await verifyWithDidKey(didA, "a different nonce", signature), false);
  assert.strictEqual(await verifyWithDidKey("did:web:example.com", message, signature), false,
    "a malformed DID is a failed verification, not a throw");
});
