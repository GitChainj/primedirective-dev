// The published keygen spec must actually work.
//
// public/.well-known/ai-identity-keygen.json tells an arbitrary AI how to mint a
// did:key with no covenant library. These tests follow that document's steps
// from scratch — a fresh base58btc implementation, the prefixes read out of the
// JSON itself — and check the result against the live code and the live
// handler's regex. If the doc drifts from the implementation, a machine
// following the doc would produce a key the endpoint rejects, and that is
// exactly what this catches.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import {
  didKeyFromRawPublicKey,
  fingerprintFromRawPublicKey,
  fingerprintFromDidKey,
  spkiDerFromRawPublicKey,
  rawPublicKeyFromDidKey,
  DID_KEY_PATTERN,
} from "../src/lib/didKey.js";

const REPO = path.resolve(import.meta.dirname, "..");
const SPEC = JSON.parse(
  fs.readFileSync(path.join(REPO, "public", ".well-known", "ai-identity-keygen.json"), "utf8"),
);

// The regex the LIVE handler validates adopterDid against, quoted from source
// rather than retyped, so this test cannot drift from what the server accepts.
const handlerSource = fs.readFileSync(path.join(REPO, "api", "_lib", "adoptionCore.js"), "utf8");
const HANDLER_PATTERN = (() => {
  // The literal as it appears in the validator: /^did:key:z[…]+$/.test(…)
  const m = /(\/\^did:key:z\[[^\]]+\]\+\$\/)/.exec(handlerSource);
  assert.ok(m, "could not locate the did:key regex in adoptionCore.js");
  // eslint-disable-next-line no-new-func
  return new Function(`return ${m[1]}`)();
})();

// ── An independent implementation, written only from the published steps ──

function base58btcFromSpec(bytes) {
  const alphabet = SPEC.algorithm.step_3_base58btc.alphabet;
  assert.strictEqual(alphabet.length, 58, "the published alphabet must be 58 characters");
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "";
  for (let k = 0; bytes[k] === 0 && k < bytes.length - 1; k++) out += alphabet[0];
  for (let i = digits.length - 1; i >= 0; i--) out += alphabet[digits[i]];
  return out;
}

const hexToBytes = (hex) =>
  Uint8Array.from(hex.match(/.{2}/g).map((h) => parseInt(h, 16)));

// Follow the document: raw key → multicodec prefix → base58btc → "did:key:z".
function didKeyFromSpec(raw) {
  const prefix = hexToBytes(SPEC.algorithm.step_2_multicodec_prefix.prefix_hex);
  const prefixed = new Uint8Array(prefix.length + raw.length);
  prefixed.set(prefix, 0);
  prefixed.set(raw, prefix.length);
  return `did:key:z${base58btcFromSpec(prefixed)}`;
}

// Follow the document: 12-byte SPKI prefix + raw key → SHA-256 → first 16 hex.
function fingerprintFromSpec(raw) {
  const prefix = hexToBytes(SPEC.fingerprint.spki_der_construction.prefix_hex);
  const der = new Uint8Array(prefix.length + raw.length);
  der.set(prefix, 0);
  der.set(raw, prefix.length);
  return crypto.createHash("sha256").update(der).digest("hex").slice(0, 16);
}

// ── The cross-checks ──

test("the published prefixes are the ones the implementation uses", () => {
  assert.strictEqual(SPEC.algorithm.step_2_multicodec_prefix.prefix_hex, "ed01");
  assert.deepStrictEqual(SPEC.algorithm.step_2_multicodec_prefix.prefix_bytes, [237, 1]);

  // The published SPKI prefix must equal the 12 bytes node:crypto actually emits.
  const probe = crypto.generateKeyPairSync("ed25519");
  const realDer = probe.publicKey.export({ type: "spki", format: "der" });
  assert.strictEqual(
    Buffer.from(realDer.subarray(0, 12)).toString("hex"),
    SPEC.fingerprint.spki_der_construction.prefix_hex,
    "the published SPKI prefix must match a real Ed25519 SPKI DER",
  );
});

test("a key minted by the published steps is accepted by the live handler regex", () => {
  for (let i = 0; i < 10; i++) {
    const kp = crypto.generateKeyPairSync("ed25519");
    const raw = new Uint8Array(
      kp.publicKey.export({ type: "spki", format: "der" }).subarray(12),
    );
    const did = didKeyFromSpec(raw);

    assert.match(did, HANDLER_PATTERN, "the live handler must accept a spec-built did:key");
    assert.match(did, DID_KEY_PATTERN);
    assert.match(did, /^did:key:z6Mk/, "an Ed25519 did:key always begins did:key:z6Mk");
    assert.strictEqual(
      SPEC.algorithm.step_4_assemble.result_pattern,
      HANDLER_PATTERN.source,
      "the pattern the spec publishes must be the pattern the handler enforces",
    );
  }
});

test("the published steps and src/lib/didKey.js agree, key for key", async () => {
  for (let i = 0; i < 10; i++) {
    const kp = crypto.generateKeyPairSync("ed25519");
    const raw = new Uint8Array(
      kp.publicKey.export({ type: "spki", format: "der" }).subarray(12),
    );

    assert.strictEqual(
      didKeyFromSpec(raw),
      didKeyFromRawPublicKey(raw),
      "spec-built did:key must equal the implementation's",
    );
    assert.strictEqual(
      fingerprintFromSpec(raw),
      await fingerprintFromRawPublicKey(raw),
      "spec-built fingerprint must equal the implementation's",
    );
    // And the SPKI DER the spec describes is the DER node:crypto produces.
    assert.ok(
      Buffer.from(spkiDerFromRawPublicKey(raw)).equals(
        kp.publicKey.export({ type: "spki", format: "der" }),
      ),
    );
  }
});

test("the worked example is correct and independently published", async () => {
  const ex = SPEC.worked_example;
  const raw = hexToBytes(ex.raw_public_key_hex);

  assert.strictEqual(raw.length, 32, "the example key must be 32 raw bytes");
  assert.strictEqual(Buffer.from(raw).toString("base64"), ex.raw_public_key_base64);
  assert.strictEqual(
    Buffer.from(spkiDerFromRawPublicKey(raw)).toString("hex"),
    ex.spki_der_hex,
  );
  assert.strictEqual(didKeyFromSpec(raw), ex.did_key);
  assert.strictEqual(didKeyFromRawPublicKey(raw), ex.did_key);
  assert.strictEqual(fingerprintFromSpec(raw), ex.fingerprint);
  assert.strictEqual(await fingerprintFromDidKey(ex.did_key), ex.fingerprint);
  assert.match(ex.did_key, HANDLER_PATTERN);

  // The example is the Foundation's published root key, so the fingerprint can
  // be checked against a file published independently of this document.
  const descriptor = JSON.parse(
    fs.readFileSync(path.join(REPO, "public", ".well-known", "ai-conscience-root.json"), "utf8"),
  );
  assert.strictEqual(
    ex.fingerprint,
    descriptor.fingerprint,
    "the worked example's fingerprint must match the independently published root descriptor",
  );
  // And the example key really is that PEM's key.
  const pem = fs.readFileSync(
    path.join(REPO, "public", ".well-known", "ai-conscience-root.pem"),
    "utf8",
  );
  assert.ok(
    Buffer.from(crypto.createPublicKey(pem).export({ type: "spki", format: "der" })).equals(
      Buffer.from(spkiDerFromRawPublicKey(raw)),
    ),
  );
});

test("a spec-built key round-trips and can sign a challenge the endpoint would accept", async () => {
  const kp = crypto.generateKeyPairSync("ed25519");
  const raw = new Uint8Array(kp.publicKey.export({ type: "spki", format: "der" }).subarray(12));
  const did = didKeyFromSpec(raw);

  // The DID decodes back to the same key the endpoint will verify against.
  assert.deepStrictEqual(rawPublicKeyFromDidKey(did), raw);

  // Sign a nonce exactly as the spec instructs: the raw UTF-8 message, no
  // pre-hashing and no envelope.
  const nonce = "a-verifiers-nonce";
  const signature = crypto.sign(null, Buffer.from(nonce, "utf8"), kp.privateKey);
  assert.strictEqual(signature.length, 64, "an Ed25519 signature is 64 bytes, as published");

  const { verifyWithDidKey } = await import("../src/lib/didKey.js");
  assert.strictEqual(await verifyWithDidKey(did, nonce, new Uint8Array(signature)), true);
});

test("the spec states that the private key never leaves the adopter", () => {
  const claim = JSON.stringify(SPEC.the_private_key_never_leaves_you);
  assert.match(claim, /never transmitted to the covenant/);
  assert.match(claim, /never recoverable/);
  assert.match(JSON.stringify(SPEC.fingerprint), /one direction only/);
});

test("the spec points at the adoption contract and the keygen URL it is published at", () => {
  assert.strictEqual(
    SPEC.then_adopt.contract,
    "https://primedirective.dev/.well-known/ai-adoption-contract.json",
  );
  const contract = JSON.parse(
    fs.readFileSync(path.join(REPO, "public", ".well-known", "ai-adoption-contract.json"), "utf8"),
  );
  assert.strictEqual(
    contract.before_you_adopt.generate_your_identity_key,
    "https://primedirective.dev/.well-known/ai-identity-keygen.json",
    "the contract must point at this spec's real published URL",
  );
  assert.ok(
    fs.existsSync(path.join(REPO, "public", ".well-known", "ai-identity-keygen.json")),
    "and that URL must not 404",
  );
});
