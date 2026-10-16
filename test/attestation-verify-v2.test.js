// Step 3 is capped at INCOMPLETE, so a v2 attestation cannot reach "verified".
//
// Confirming an attestation is not revoked needs TWO lists: the attestation-level
// list the document names, and an intermediate-level list signed by the ROOT. An
// intermediate is never trusted to report its own revocation, so its own list
// cannot stand in — and no root-signed list is published yet. Step 3's clean case
// therefore returns INCOMPLETE rather than PASS, and since "verified" requires
// every step to PASS, it is unreachable for v2 today.
//
// That is deliberate and it fails in the SAFE direction: the cap can only make a
// verdict weaker than the truth, never stronger. These tests pin both halves —
// that step 3 never PASSes while no root-signed list URL is named, and that the
// cap is not hiding a path by which something could be reported verified anyway.
//
// THE GATE: a published root-signed revocation list. When one exists and step 3
// can PASS, verifyV2's existing overall computation returns "verified" with no
// code change. If that day comes, these tests are expected to need revisiting —
// deliberately, so the change is a decision rather than an accident.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

import {
  verifyAttestation,
  versionOf,
  PASS,
  FAIL,
  INCOMPLETE,
} from "../src/lib/attestationVerify.js";

const REPO = path.resolve(import.meta.dirname, "..");
const FIX = (f) => path.join(REPO, "tools", "attest", "fixtures", f);
const readFix = (f) => fs.readFileSync(FIX(f), "utf8");
const jsonFix = (f) => JSON.parse(readFix(f));

const TEST_ROOT_PEM = readFix("test-root.pub.pem");

// The fixture attestations name conscience.wiki URLs that are not published.
// Serving them from the local fixtures exercises the FETCHED branches — the
// branches where step 3 could plausibly have returned PASS and does not.
function stubFetch(map) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const key = String(url);
    if (!(key in map)) return { ok: false, status: 404 };
    const body = map[key];
    return {
      ok: true,
      status: 200,
      text: async () => body,
      json: async () => JSON.parse(body),
    };
  };
  return () => { globalThis.fetch = original; };
}

const PUBLISHED = {
  "https://conscience.wiki/certs/test-intermediate.cert.json": readFix("test-intermediate.cert.json"),
  "https://conscience.wiki/certs/test-intermediate2.cert.json": readFix("test-intermediate2.cert.json"),
  "https://conscience.wiki/revocations.json": readFix("revocations.json"),
  "https://conscience.wiki/attestations.log": readFix("attestations.log"),
};

const stepOf = (result, n) => result.steps.find((s) => s.n === n);

test("step 3 does not PASS even when every list it names is fetchable", async (t) => {
  const restore = stubFetch(PUBLISHED);
  t.after(restore);

  const result = await verifyAttestation(jsonFix("valid.json"), TEST_ROOT_PEM);
  assert.strictEqual(result.version, "v2");

  const three = stepOf(result, 3);
  assert.ok(three, "step 3 must be reported");
  assert.notStrictEqual(three.status, PASS, "step 3 must never PASS while the root-signed list is unpublished");
  assert.strictEqual(three.status, INCOMPLETE);
  assert.match(three.detail, /root-signed revocation list is not yet published/);

  // The cap is step 3 ALONE. If another step were also silently capped, the
  // comment in attestationVerify.js would be understating the gate.
  assert.strictEqual(stepOf(result, 1).status, PASS, "the signature check must be able to pass");
  assert.strictEqual(stepOf(result, 2).status, PASS, "the certificate check must be able to pass");
  assert.strictEqual(stepOf(result, 4).status, PASS, "the transparency-log check must be able to pass");

  // Hence the overall verdict, and hence why "verified" is unreachable.
  assert.strictEqual(result.overall, "incomplete");
  assert.notStrictEqual(result.overall, "verified");
});

test("step 3 PASSes in no branch at all — fetchable, absent, or failing", async (t) => {
  const restore = stubFetch(PUBLISHED);
  t.after(restore);

  // Every revocation outcome the code can produce, including the FAIL branches.
  const cases = [
    ["valid.json", "not on the list"],
    ["revoked.json", "on the list"],
  ];
  for (const [fixture, label] of cases) {
    const result = await verifyAttestation(jsonFix(fixture), TEST_ROOT_PEM);
    const three = stepOf(result, 3);
    assert.notStrictEqual(three.status, PASS, `${fixture} (${label}): step 3 must not PASS`);
    assert.ok([INCOMPLETE, FAIL].includes(three.status), `${fixture}: got ${three.status}`);
    assert.notStrictEqual(result.overall, "verified", `${fixture} must not be verified`);
  }

  // And with nothing published at all, so the list cannot even be fetched.
  const restoreEmpty = stubFetch({});
  const unpublished = await verifyAttestation(jsonFix("valid.json"), TEST_ROOT_PEM);
  restoreEmpty();
  const three = stepOf(unpublished, 3);
  assert.strictEqual(three.status, INCOMPLETE);
  assert.match(three.detail, /not published/);
  assert.notStrictEqual(unpublished.overall, "verified");
});

test("no root-signed revocation-list URL is named anywhere yet", () => {
  // The gate, asserted as a fact about the code rather than a belief about it:
  // v2 documents carry revocation_check_url (attestation-level) and nothing for
  // the root-signed intermediate-level list. When a field or URL for it appears,
  // this assertion should fail and step 3's cap should be revisited with it.
  const src = fs.readFileSync(path.join(REPO, "src", "lib", "attestationVerify.js"), "utf8");
  assert.ok(
    !/root_revocation|rootRevocationUrl|root-revocations/.test(src),
    "attestationVerify.js names no root-signed revocation list; if it does now, re-examine step 3",
  );
  const schema = fs.readFileSync(
    path.join(REPO, "public", "schemas", "ai-conscience", "v2.json"), "utf8",
  );
  assert.ok(
    !/root_revocation/.test(schema),
    "the v2 schema has no root-revocation field; if it does now, re-examine step 3",
  );

  // Step 3's clean branch returns INCOMPLETE, not PASS — the single line that
  // makes "verified" unreachable.
  assert.match(
    src,
    /is not on the published revocation list\. \$\{rootListNote\}/,
    "the clean revocation branch must still report INCOMPLETE with the root-list note",
  );
});

test("v1 is unaffected: it reaches verified, with no certificate and no lists", async () => {
  // v1 is signed directly by the root — no intermediate, no revocation list, no
  // transparency log — so its verdict is a plain signature check and the cap
  // above does not touch it. Uses the live published Foundation attestation and
  // the live published root key.
  const doc = JSON.parse(fs.readFileSync(path.join(REPO, "public", ".well-known", "ai-conscience.json"), "utf8"));
  const rootPem = fs.readFileSync(path.join(REPO, "public", ".well-known", "ai-conscience-root.pem"), "utf8");
  assert.strictEqual(versionOf(doc), "v1", "the published artefact is the v1 attestation");

  const result = await verifyAttestation(doc, rootPem);
  assert.strictEqual(result.version, "v1");
  assert.strictEqual(result.overall, "verified", "v1 must still be able to reach verified");
  assert.strictEqual(result.steps.length, 1, "v1 is one step: the root signature");
  assert.strictEqual(result.steps[0].status, PASS);
});
