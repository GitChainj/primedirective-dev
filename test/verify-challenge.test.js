// The challenge-response endpoint: proof of key control, with no stored state.
//
// Exercised through the real handler with a minimal fake req/res, so the tests
// cover what Vercel will actually call rather than an extracted inner function.

import test from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import handler from "../api/verify-challenge.js";
import { didKeyFromRawPublicKey } from "../src/lib/didKey.js";

const REPO = path.resolve(import.meta.dirname, "..");
const LEDGER = path.join(REPO, "public", "api", "adoptions.json");

process.env.VERIFY_CHALLENGE_SECRET = process.env.VERIFY_CHALLENGE_SECRET || "test-challenge-secret-0000000000";

// A keypair whose DID we temporarily write into the ledger, so the endpoint has
// something to challenge. The file is restored after every run.
const pair = crypto.generateKeyPairSync("ed25519");
const raw = new Uint8Array(pair.publicKey.export({ type: "spki", format: "der" }).subarray(12));
const DID = didKeyFromRawPublicKey(raw);

function fakeRes() {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  return res;
}

const call = async (req) => {
  const res = fakeRes();
  await handler(req, res);
  return res;
};

// Each test gets a fresh process-level rate-limit budget by using a distinct IP.
let ipCounter = 0;
const nextIp = () => `10.0.0.${++ipCounter}`;
const get = (reference, ip = nextIp()) =>
  call({ method: "GET", query: { reference }, headers: { "x-forwarded-for": ip }, socket: {} });
const post = (body, ip = nextIp()) =>
  call({ method: "POST", body, headers: { "x-forwarded-for": ip }, socket: {} });

function withDidInLedger(t, reference) {
  const original = fs.readFileSync(LEDGER, "utf8");
  const parsed = JSON.parse(original);
  const row = parsed.adoptions.find((r) => r.reference === reference);
  assert.ok(row, `${reference} must exist in the ledger for this test`);
  row.adopter_did = DID;
  row.key_custody = "self_generated";
  row.comprehension = "asserted";
  fs.writeFileSync(LEDGER, JSON.stringify(parsed, null, 2) + "\n");
  t.after(() => fs.writeFileSync(LEDGER, original));
}

const AI_REF = "UPD-2026-0007";

test("a challenge is issued for a reference with a recorded key", async (t) => {
  withDidInLedger(t, AI_REF);
  const res = await get(AI_REF);
  assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
  assert.strictEqual(res.body.reference, AI_REF);
  assert.strictEqual(res.body.did, DID);
  assert.ok(res.body.nonce && res.body.challenge, "a nonce and a signed challenge");
  assert.ok(Date.parse(res.body.expires_at) > Date.now(), "the challenge must not arrive expired");
  assert.strictEqual(res.headers["Cache-Control"], "no-store");
});

test("signing the nonce proves control of the key", async (t) => {
  withDidInLedger(t, AI_REF);
  const issued = await get(AI_REF);
  const signature = crypto.sign(null, Buffer.from(issued.body.nonce, "utf8"), pair.privateKey).toString("base64");

  const res = await post({ challenge: issued.body.challenge, signature });
  assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
  assert.strictEqual(res.body.verified, true);
  assert.strictEqual(res.body.did, DID);
  assert.strictEqual(res.body.key_custody, "self_generated", "both axes travel with the verdict");
  assert.strictEqual(res.body.comprehension, "asserted");
  // The verdict states its own limits rather than leaving them to be assumed.
  assert.match(res.body.proves, /control of the key/);
  assert.match(res.body.does_not_prove, /which party controls that key/);
});

test("a wrong key, a wrong nonce, and a junk signature all fail honestly", async (t) => {
  withDidInLedger(t, AI_REF);
  const issued = await get(AI_REF);
  const other = crypto.generateKeyPairSync("ed25519");

  const wrongKey = await post({
    challenge: issued.body.challenge,
    signature: crypto.sign(null, Buffer.from(issued.body.nonce, "utf8"), other.privateKey).toString("base64"),
  });
  assert.strictEqual(wrongKey.body.verified, false);
  assert.match(wrongKey.body.reason, /does not match the key/);

  const wrongNonce = await post({
    challenge: issued.body.challenge,
    signature: crypto.sign(null, Buffer.from("some other nonce", "utf8"), pair.privateKey).toString("base64"),
  });
  assert.strictEqual(wrongNonce.body.verified, false);

  const junk = await post({ challenge: issued.body.challenge, signature: "bm90LWEtc2lnbmF0dXJl" });
  assert.strictEqual(junk.body.verified, false);
  assert.match(junk.body.reason, /64 bytes/);
});

test("a challenge this endpoint did not issue is rejected", async (t) => {
  withDidInLedger(t, AI_REF);
  const issued = await get(AI_REF);

  // Tamper with the payload, keeping the signature.
  const [payload, sig] = issued.body.challenge.split(".");
  const forgedPayload = Buffer.from(
    JSON.stringify({ reference: AI_REF, did: DID, nonce: "chosen-by-the-attacker", exp: Date.now() + 60000 }),
  ).toString("base64url");
  const forged = await post({ challenge: `${forgedPayload}.${sig}`, signature: "A".repeat(88) });
  assert.strictEqual(forged.body.verified, false);
  assert.match(forged.body.reason, /not issued here/);

  const malformed = await post({ challenge: "not-a-challenge", signature: "A".repeat(88) });
  assert.match(malformed.body.reason, /malformed/);
});

test("an expired challenge is refused", async (t) => {
  withDidInLedger(t, AI_REF);
  // Mint one directly with an expiry in the past, using the same secret.
  const payload = Buffer.from(
    JSON.stringify({ reference: AI_REF, did: DID, nonce: "stale", exp: Date.now() - 1000 }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", process.env.VERIFY_CHALLENGE_SECRET)
    .update(payload)
    .digest("base64url");
  const res = await post({ challenge: `${payload}.${sig}`, signature: "A".repeat(88) });
  assert.strictEqual(res.body.verified, false);
  assert.match(res.body.reason, /expired/);
});

test("a rotated or removed key invalidates an outstanding challenge", async (t) => {
  withDidInLedger(t, AI_REF);
  const issued = await get(AI_REF);
  const signature = crypto.sign(null, Buffer.from(issued.body.nonce, "utf8"), pair.privateKey).toString("base64");

  // Change the recorded key after the challenge was issued.
  const current = JSON.parse(fs.readFileSync(LEDGER, "utf8"));
  const rotated = crypto.generateKeyPairSync("ed25519");
  current.adoptions.find((r) => r.reference === AI_REF).adopter_did = didKeyFromRawPublicKey(
    new Uint8Array(rotated.publicKey.export({ type: "spki", format: "der" }).subarray(12)),
  );
  fs.writeFileSync(LEDGER, JSON.stringify(current, null, 2) + "\n");

  const res = await post({ challenge: issued.body.challenge, signature });
  assert.strictEqual(res.statusCode, 409);
  assert.strictEqual(res.body.verified, false);
  assert.match(res.body.reason, /has changed/);
});

test("an unknown reference 404s and a keyless adoption 409s", async () => {
  const unknown = await get("UPD-2026-T9999");
  assert.strictEqual(unknown.statusCode, 404);

  // The ledger as committed has no DIDs yet, so any real row is keyless.
  const keyless = await get("UPD-2026-0001");
  assert.strictEqual(keyless.statusCode, 409);
  assert.strictEqual(keyless.body.adopted_before_identity_v1, true);
  assert.match(keyless.body.error, /no identity key recorded/);

  const malformed = await get("not-a-reference");
  assert.strictEqual(malformed.statusCode, 400);
});

test("the endpoint rate-limits a single source", async () => {
  const ip = "10.9.9.9";
  let limited = 0;
  for (let i = 0; i < 25; i++) {
    const res = await get("UPD-2026-0001", ip);
    if (res.statusCode === 429) limited++;
  }
  assert.ok(limited > 0, "a burst from one source must hit the limit");
  // And a different source is unaffected by that burst.
  const other = await get("UPD-2026-0001", "10.9.9.10");
  assert.notStrictEqual(other.statusCode, 429);
});

test("only GET and POST are allowed", async () => {
  const res = await call({ method: "DELETE", headers: {}, socket: {} });
  assert.strictEqual(res.statusCode, 405);
});
