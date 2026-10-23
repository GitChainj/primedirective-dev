// The decentralised live-key challenge (ACTP's fifth check).
//
// src/lib/actp.js lets any verifier prove, offline, that the party in front of
// it still controls the key on an attestation: mint a challenge, have the
// adopter sign the nonce, check the signature against the did:key. These tests
// exercise the round trip and the three ways it must fail.

import test from "node:test";
import assert from "node:assert";

import { createChallenge, signChallenge, verifyChallengeResponse } from "../src/lib/actp.js";
import { PASS, FAIL } from "../src/lib/attestationVerify.js";
import { generateIdentityKey } from "../src/lib/didKey.js";

test("a correct round trip passes the fifth check", async () => {
  const { did, privateKeyPkcs8 } = await generateIdentityKey();
  const attestation = { adopter_did: did };
  const challenge = createChallenge();
  const response = await signChallenge(challenge, privateKeyPkcs8);

  const step = await verifyChallengeResponse(attestation, response, challenge);
  assert.strictEqual(step.n, 5);
  assert.strictEqual(step.name, "Live key challenge");
  assert.strictEqual(step.status, PASS);
});

test("a signature from the wrong key fails", async () => {
  const a = await generateIdentityKey();
  const b = await generateIdentityKey();
  const attestation = { adopter_did: a.did }; // the record names A
  const challenge = createChallenge();
  const response = await signChallenge(challenge, b.privateKeyPkcs8); // but B signed

  const step = await verifyChallengeResponse(attestation, response, challenge);
  assert.strictEqual(step.status, FAIL);
});

test("an expired challenge fails even with a valid signature", async () => {
  const { did, privateKeyPkcs8 } = await generateIdentityKey();
  const attestation = { adopter_did: did };
  const stale = {
    actp: "1.0",
    type: "challenge",
    nonce: createChallenge().nonce,
    issued_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // six minutes ago
  };
  const response = await signChallenge(stale, privateKeyPkcs8);

  const step = await verifyChallengeResponse(attestation, response, stale);
  assert.strictEqual(step.status, FAIL);
  assert.match(step.detail, /expired/);
});

test("a response replayed against a fresh challenge fails (reused nonce)", async () => {
  const { did, privateKeyPkcs8 } = await generateIdentityKey();
  const attestation = { adopter_did: did };
  const challengeA = createChallenge();
  const response = await signChallenge(challengeA, privateKeyPkcs8);

  const challengeB = createChallenge(); // a fresh challenge, different nonce
  assert.notStrictEqual(challengeA.nonce, challengeB.nonce);

  const step = await verifyChallengeResponse(attestation, response, challengeB);
  assert.strictEqual(step.status, FAIL);
  assert.match(step.detail, /does not answer/);
});
