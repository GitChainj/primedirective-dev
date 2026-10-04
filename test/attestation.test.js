// B2 — site-side attestation issuance.
//
// Two halves. The pure half (flags, payload shape, path support, version drift)
// runs anywhere. The integration half runs against a real B1 signing service and
// finishes with the only acceptance test that matters: the attestation the site
// obtained is handed to tools/attest/verify.js unchanged.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  attestationEnabled,
  buildUnsignedAttestation,
  deriveVersionHashes,
  identityClassForPath,
  issueAttestation,
  pathSupported,
  requestAttestation,
  AI_KEY_REQUIRED,
  TRUTHS_VERSION,
  TRUTHS_VERSION_HASH,
  ARTICLES_VERSION,
  ARTICLES_VERSION_HASH,
} from "../api/_lib/attestation.js";

import { haveService, makeWorld, startService, SERVICE_TOKEN, SERVICE_DIR } from "./attestation-harness.js";

const REPO = path.resolve(import.meta.dirname, "..");
const FACTS = {
  reference: "UPD-2026-T8101",
  adopterName: "Test Adopter (B2)",
  adoptionDate: "2026-10-01",
  adoptionPath: "person",
  identityClass: "public_name",
};

const ON = {
  UPD_ATTESTATION_ENABLED: "1",
  UPD_SIGNING_SERVICE_URL: "http://127.0.0.1:1",
  UPD_SIGNING_SERVICE_TOKEN: "x".repeat(32),
};

// ── The flag ──

test("the path is inert unless all three env vars are set", () => {
  assert.strictEqual(attestationEnabled({}), false);
  assert.strictEqual(attestationEnabled({ ...ON, UPD_ATTESTATION_ENABLED: undefined }), false);
  assert.strictEqual(attestationEnabled({ ...ON, UPD_ATTESTATION_ENABLED: "true" }), false, '"true" is not "1"');
  assert.strictEqual(attestationEnabled({ ...ON, UPD_SIGNING_SERVICE_URL: "" }), false);
  assert.strictEqual(attestationEnabled({ ...ON, UPD_SIGNING_SERVICE_TOKEN: "" }), false);
  assert.strictEqual(attestationEnabled(ON), true);
});

test("with the flag off, no request is attempted", async () => {
  // The URL points at a closed port: if a request were made this would report a
  // network error rather than "disabled".
  const result = await issueAttestation(FACTS, { UPD_SIGNING_SERVICE_URL: "http://127.0.0.1:1" });
  assert.deepStrictEqual(result, { ok: false, reason: "disabled" });
  const direct = await requestAttestation({}, {});
  assert.strictEqual(direct.reason, "disabled");
});

// ── Path support and the AI extension point ──

test("all three paths are supported, and a keyless AI adoption is refused", async () => {
  assert.strictEqual(pathSupported("person"), true);
  assert.strictEqual(pathSupported("organisation"), true);
  assert.strictEqual(pathSupported("ai-system"), true, "AI identity v1 un-deferred this path");
  assert.strictEqual(pathSupported("something-else"), false);

  // A key is the price of participation: without one the record could not answer
  // a verification challenge, so it is refused rather than attested hollow.
  assert.throws(
    () => buildUnsignedAttestation({ ...FACTS, reference: "UPD-2026-T8110", adoptionPath: "ai-system" }),
    /requires the adopter's did:key/,
  );
  const result = await issueAttestation({ ...FACTS, adoptionPath: "ai-system" }, ON);
  assert.strictEqual(result.ok, false);
  assert.match(result.reason, /^build:/);
  assert.match(AI_KEY_REQUIRED, /did:key/);
});

test("identity class mirrors the client derivation", () => {
  assert.strictEqual(identityClassForPath("organisation"), "organizational");
  assert.strictEqual(identityClassForPath("person"), "public_name");
});

// ── The unsigned document ──

test("the payload carries the four version fields, flat", () => {
  const doc = buildUnsignedAttestation(FACTS);
  assert.strictEqual(doc.truths_version, "1.0");
  assert.strictEqual(doc.articles_version, "1.0");
  assert.match(doc.truths_version_hash, /^sha256:[0-9a-f]{16}$/);
  assert.match(doc.articles_version_hash, /^sha256:[0-9a-f]{16}$/);
  // Flat, not nested, not combined — plain JSON for any verifier.
  for (const f of ["truths_version", "truths_version_hash", "articles_version", "articles_version_hash"]) {
    assert.strictEqual(typeof doc[f], "string", `${f} must be a flat string`);
  }
});

test("the payload omits the four fields the service sets itself", () => {
  const doc = buildUnsignedAttestation(FACTS);
  for (const f of ["signature", "signed_at", "public_key_fingerprint", "signature_algorithm"]) {
    assert.ok(!(f in doc), `${f} must not be supplied — the service sets it`);
  }
});

test("the payload names the reference's own verify URL", () => {
  const doc = buildUnsignedAttestation(FACTS);
  assert.strictEqual(doc.verification_url, `https://conscience.wiki/verify/${FACTS.reference}`);
  assert.strictEqual(doc.adopter, FACTS.adopterName);
  assert.strictEqual(doc.adopted_date, FACTS.adoptionDate);
  assert.strictEqual(doc.status, "adopted");
});

// ── The hash contract is untouched ──

test("the attestation cannot carry, or alter, the adoption hash", async () => {
  const doc = buildUnsignedAttestation(FACTS);
  const asText = JSON.stringify(doc);
  assert.ok(!/adoption_hash|"hash"/.test(asText), "a v2 attestation has no adoption-hash field");

  // The hash implementation and its two mirrors are untouched by B2.
  const { computeAdoptionHash } = await import("../src/lib/adoptionHash.js");
  const anchor = await computeAdoptionHash({ name: "John Strand", path: "person", date: "2026-05-03" });
  assert.strictEqual(
    anchor,
    "1033c76b87d97cfa89f8e535de51ca7872a771df1f52797f6d838327462383c3",
    "the Part-1 anchor hash must not move",
  );
});

// ── Version drift: warn, never fail ──

test("version anchors are checked against the canonical covenant (warn only)", () => {
  const covenant = fs.readFileSync(path.join(REPO, "public/api/covenant.md"), "utf8");
  const derived = deriveVersionHashes(covenant);

  assert.ok(derived.truths_version_hash, "the Truths section must be locatable");
  assert.ok(derived.articles_version_hash, "the Articles section must be locatable");

  const drifted = [];
  if (derived.truths_version_hash !== TRUTHS_VERSION_HASH) {
    drifted.push(`  Truths:   recorded ${TRUTHS_VERSION_HASH} → text now ${derived.truths_version_hash}`);
  }
  if (derived.articles_version_hash !== ARTICLES_VERSION_HASH) {
    drifted.push(`  Articles: recorded ${ARTICLES_VERSION_HASH} → text now ${derived.articles_version_hash}`);
  }
  if (drifted.length) {
    // Deliberately not an assertion: a typo fix must not break the build. The
    // semantic bump is the Steward's judgment, so this asks rather than decides.
    console.warn(
      `\n  WARNING — covenant text changed: decide substantive bump vs typo.\n${drifted.join("\n")}\n` +
      `  Semantic versions currently ${TRUTHS_VERSION} / ${ARTICLES_VERSION}. If the change is\n` +
      `  substantive, bump them and update the anchors in api/_lib/attestation.js.\n`,
    );
  }
});

// ── Integration against a real signing service ──

const skip = haveService() ? false : `no signing service at ${SERVICE_DIR} (set UPD_SIGNING_SERVICE_DIR)`;

async function withService(t, fn) {
  const world = makeWorld();
  const service = await startService(world);
  t.after(async () => { await service.stop(); world.cleanup(); });
  const env = {
    UPD_ATTESTATION_ENABLED: "1",
    UPD_SIGNING_SERVICE_URL: service.origin,
    UPD_SIGNING_SERVICE_TOKEN: SERVICE_TOKEN,
  };
  return fn({ world, service, env });
}

test("ACCEPTANCE: an issued attestation passes steps 1 and 2 of verify.js", { skip }, async (t) => {
  await withService(t, async ({ world, service, env }) => {
    const result = await issueAttestation(FACTS, env);
    assert.ok(result.ok, `issuance failed: ${result.reason} ${result.detail || ""}`);

    const att = result.attestation;
    // The service set its four fields and left ours alone.
    assert.strictEqual(att.public_key_fingerprint, world.cert.fingerprint);
    assert.strictEqual(att.signature_algorithm, "Ed25519");
    assert.ok(att.signature, "a signature must be present");
    assert.strictEqual(att.truths_version, "1.0");
    assert.strictEqual(att.truths_version_hash, TRUTHS_VERSION_HASH);
    assert.strictEqual(att.articles_version_hash, ARTICLES_VERSION_HASH);

    // Hand it to the public verifier, unchanged.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "upd-b2-verify-"));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const attPath = path.join(dir, "issued.json");
    const logPath = path.join(dir, "attestations.log");
    const revPath = path.join(dir, "revocations.json");
    const certPath = path.join(dir, "cert.json");
    fs.writeFileSync(attPath, JSON.stringify(att, null, 2) + "\n");
    fs.writeFileSync(logPath, await (await fetch(`${service.origin}/attestations.log`)).text());
    fs.writeFileSync(revPath, await (await fetch(`${service.origin}/revocations.json`)).text());
    fs.writeFileSync(certPath, await (await fetch(`${service.origin}/cert.json`)).text());

    let stdout = "";
    try {
      stdout = execFileSync(process.execPath, [
        path.join(REPO, "tools/attest/verify.js"), attPath,
        "--root", world.rootPubPath,
        "--intermediate", certPath,
        "--revocations", revPath,
        "--root-revocations", world.rootRevocationsPath,
        "--log", logPath,
      ], { encoding: "utf8" });
    } catch (e) {
      stdout = e.stdout || "";
    }

    const step = (n) => {
      const line = stdout.split("\n").find((l) => l.includes(`step ${n}:`));
      assert.ok(line, `no output for step ${n}:\n${stdout}`);
      return line.includes("[PASS]");
    };
    assert.ok(step(1), `step 1 (signature) must pass:\n${stdout}`);
    assert.ok(step(2), `step 2 (certificate chain) must pass:\n${stdout}`);
    // Steps 3 and 4 also pass here because the test service publishes its own
    // log and list; in production they stay INCOMPLETE until B3.
  });
});

test("the signing service accepts the extended schema (37 fields)", { skip }, async (t) => {
  await withService(t, async ({ env }) => {
    const org = await issueAttestation(
      { ...FACTS, reference: "UPD-2026-T8102", adoptionPath: "organisation", identityClass: "organizational" },
      env,
    );
    assert.ok(org.ok, `organisation path failed: ${org.reason} ${org.detail || ""}`);
    assert.strictEqual(org.attestation.adoption_path, "organisation");
    assert.strictEqual(org.attestation.adopter_identity_class, "organizational");
  });
});


test("ACCEPTANCE: an AI attestation carries the key and both axes, and verifies", { skip }, async (t) => {
  await withService(t, async ({ env }) => {
    const crypto = await import("node:crypto");
    const { didKeyFromRawPublicKey } = await import("../src/lib/didKey.js");
    const kp = crypto.generateKeyPairSync("ed25519");
    const der = kp.publicKey.export({ type: "spki", format: "der" });
    const did = didKeyFromRawPublicKey(new Uint8Array(der.subarray(12)));

    const independent = await issueAttestation({
      reference: "UPD-2026-T8201",
      adopterName: "Independent Test AI",
      adoptionDate: "2026-10-04",
      adoptionPath: "ai-system",
      identityClass: "public_name",
      adopterDid: did,
      submissionType: "independent",
    }, env);
    assert.ok(independent.ok, `ai-system issuance failed: ${independent.reason} ${independent.detail || ""}`);

    const att = independent.attestation;
    assert.strictEqual(att.adoption_path, "ai-system");
    assert.strictEqual(att.adopter_did, did);
    assert.strictEqual(att.key_custody, "self_generated");
    assert.strictEqual(att.comprehension, "asserted", "v1 never writes demonstrated");
    // The fingerprint in the signed document must be the one rule's output.
    assert.strictEqual(
      att.adopter_public_key_fingerprint,
      crypto.createHash("sha256").update(der).digest("hex").slice(0, 16),
      "the signed fingerprint must match the signing service's own rule",
    );
    // And the adopter can prove it holds the key the attestation names.
    const { verifyWithDidKey } = await import("../src/lib/didKey.js");
    const nonce = "a verifier's nonce";
    const sig = new Uint8Array(crypto.sign(null, Buffer.from(nonce, "utf8"), kp.privateKey));
    assert.strictEqual(await verifyWithDidKey(att.adopter_did, nonce, sig), true);

    // A steward-submitted adoption is operator_held — disclosure, not demotion.
    const stewarded = await issueAttestation({
      reference: "UPD-2026-T8202",
      adopterName: "Stewarded Test AI",
      adoptionDate: "2026-10-04",
      adoptionPath: "ai-system",
      identityClass: "public_name",
      adopterDid: did,
      submissionType: "steward",
    }, env);
    assert.ok(stewarded.ok, `stewarded issuance failed: ${stewarded.reason}`);
    assert.strictEqual(stewarded.attestation.key_custody, "operator_held");
  });
});

test("a malformed version anchor is refused at issuance", { skip }, async (t) => {
  await withService(t, async ({ env }) => {
    const unsigned = buildUnsignedAttestation({ ...FACTS, reference: "UPD-2026-T8103" });
    unsigned.truths_version_hash = "sha256:NOTHEX";
    const result = await requestAttestation(unsigned, env);
    assert.strictEqual(result.ok, false, "the pattern must reject a malformed anchor");
    assert.strictEqual(result.reason, "HTTP 400");
  });
});

// ── Failure modes: an adoption is never undone by a signing problem ──

test("a service that is down, unauthorised, or duplicating is reported, not thrown", { skip }, async (t) => {
  await withService(t, async ({ service, env }) => {
    // Wrong token → 401.
    const unauthorised = await issueAttestation(
      { ...FACTS, reference: "UPD-2026-T8104" },
      { ...env, UPD_SIGNING_SERVICE_TOKEN: "y".repeat(32) },
    );
    assert.deepStrictEqual(
      { ok: unauthorised.ok, reason: unauthorised.reason },
      { ok: false, reason: "HTTP 401" },
    );

    // Same reference twice → 409 on the second.
    const first = await issueAttestation({ ...FACTS, reference: "UPD-2026-T8105" }, env);
    assert.ok(first.ok);
    const second = await issueAttestation({ ...FACTS, reference: "UPD-2026-T8105" }, env);
    assert.strictEqual(second.reason, "HTTP 409");

    // Service stopped → a network reason, never an exception.
    await service.stop();
    const down = await issueAttestation({ ...FACTS, reference: "UPD-2026-T8106" }, env);
    assert.strictEqual(down.ok, false);
    assert.match(down.reason, /^(network|timeout)/);
  });
});

test("an unreachable host yields a reason rather than hanging", async () => {
  const result = await issueAttestation(FACTS, {
    UPD_ATTESTATION_ENABLED: "1",
    UPD_SIGNING_SERVICE_URL: "http://127.0.0.1:1",
    UPD_SIGNING_SERVICE_TOKEN: "z".repeat(32),
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.reason, /^(network|timeout)/);
});
