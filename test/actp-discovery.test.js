// ACTP discovery by domain, and emitter parity across the two implementations.
//
// src/lib/actp.js (browser/ESM) and tools/attest/verify.js (CLI/CJS) each turn a
// verification into an ACTP verification-result/v1 document. The CJS one is a
// hand-kept mirror of the ESM one, so this test holds them together: it
// validates both against the single published schema, and asserts they produce
// the SAME document for the same input (ignoring the wall-clock checked_at).

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

import { discoverAttestation } from "../src/lib/actp.js";
import { toVerificationResult, PASS, FAIL, INCOMPLETE } from "../src/lib/attestationVerify.js";

const require = createRequire(import.meta.url);
const cli = require("../tools/attest/verify.js");

const REPO = path.resolve(import.meta.dirname, "..");
const read = (...p) => fs.readFileSync(path.join(REPO, ...p), "utf8");
const SCHEMA = JSON.parse(read("public", "schemas", "actp", "verification-result", "v1.json"));
const ROOT_PEM = read("public", ".well-known", "ai-conscience-root.pem");
const FOUNDATION_DOC = JSON.parse(read("public", ".well-known", "ai-conscience.json"));
const WELL_KNOWN = "/.well-known/ai-conscience.json";

// ── dependency-free schema validator (same subset as the emitter test) ──
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
function validate(obj, schema, where = "$") {
  const errs = [];
  const typeOf = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
  if (schema.const !== undefined && obj !== schema.const) errs.push(`${where}: expected const ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(obj)) errs.push(`${where}: ${JSON.stringify(obj)} not in enum`);
  if (schema.type) {
    const t = typeOf(obj);
    const ok = schema.type === "integer" ? t === "number" && Number.isInteger(obj) : t === schema.type;
    if (!ok) errs.push(`${where}: expected type ${schema.type}, got ${t}`);
  }
  if (schema.format === "date-time" && typeof obj === "string" && !DATE_TIME.test(obj)) errs.push(`${where}: not a date-time`);
  if (schema.type === "object" && obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const r of schema.required || []) if (!(r in obj)) errs.push(`${where}: missing required "${r}"`);
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(obj)) if (!(schema.properties && k in schema.properties)) errs.push(`${where}: unexpected property "${k}"`);
    }
    for (const [k, sub] of Object.entries(schema.properties || {})) {
      if (k in obj) errs.push(...validate(obj[k], sub, `${where}.${k}`));
    }
  }
  if (schema.type === "array" && Array.isArray(obj) && schema.items) {
    obj.forEach((item, i) => errs.push(...validate(item, schema.items, `${where}[${i}]`)));
  }
  return errs;
}
const assertValid = (obj) => {
  const errs = validate(obj, SCHEMA);
  assert.deepStrictEqual(errs, [], `schema violations:\n${errs.join("\n")}`);
};

// A fetchImpl serving a fixed url -> fixture map. A missing url is a 404.
function fetcher(map) {
  return async (url) => {
    const entry = map[url];
    if (entry === undefined) return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
    if (entry.throws) throw new Error("network");
    const status = entry.status || 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => (typeof entry.body === "string" ? JSON.parse(entry.body) : entry.body),
      text: async () => (typeof entry.body === "string" ? entry.body : JSON.stringify(entry.body)),
    };
  };
}
const stripTime = (r) => { const c = { ...r }; delete c.checked_at; return c; };

// ── (2) emitter parity: ESM toVerificationResult === CJS toActpResult ──
test("the two emitters agree on every internal shape (checked_at aside)", () => {
  const names = {
    1: "Attestation signature valid against the intermediate key",
    2: "Intermediate certificate valid against the published root",
    3: "Neither the attestation nor its intermediate is revoked",
    4: "Recorded in the transparency log, chain intact",
  };
  const S = (statuses) => Object.entries(statuses).map(([n, status]) => ({ n: Number(n), name: names[n], status }));
  const cases = [
    { version: "v2", overall: "verified", steps: S({ 1: PASS, 2: PASS, 3: PASS, 4: PASS }) },
    { version: "v2", overall: "incomplete", steps: S({ 1: PASS, 2: PASS, 3: INCOMPLETE, 4: INCOMPLETE }) },
    { version: "v2", overall: "failed", steps: S({ 1: FAIL }) },
    { version: "v1", overall: "verified", steps: [{ n: 1, name: "Signature valid against the Foundation root key", status: PASS }] },
    { overall: "not_found", steps: [] },
  ];
  for (const internal of cases) {
    const opts = { subject: "example.com", reference: "UPD-2026-0001", adopter: "Someone" };
    const esm = toVerificationResult(internal, opts);
    const cjs = cli.toActpResult(internal, opts);
    assertValid(esm);
    assertValid(cjs);
    assert.deepStrictEqual(stripTime(cjs), stripTime(esm), `mismatch for overall=${internal.overall}`);
  }
});

// ── discoverAttestation (ESM) over injected fixtures ──
test("a missing attestation is not_found, never an error", async () => {
  const r = await discoverAttestation("example.com", { fetchImpl: fetcher({}), rootPem: ROOT_PEM });
  assertValid(r);
  assert.strictEqual(r.overall, "not_found");
  assert.strictEqual(r.subject, "example.com");
});

test("an unreachable host is incomplete, never failed", async () => {
  const url = `https://example.com${WELL_KNOWN}`;
  const r = await discoverAttestation("example.com", { fetchImpl: fetcher({ [url]: { throws: true } }), rootPem: ROOT_PEM });
  assertValid(r);
  assert.strictEqual(r.overall, "incomplete");
});

test("an unknown schema is incomplete, not verified", async () => {
  const url = `https://example.com${WELL_KNOWN}`;
  const r = await discoverAttestation("example.com", {
    fetchImpl: fetcher({ [url]: { body: { schema: "https://example.com/not-ours" } } }),
    rootPem: ROOT_PEM,
  });
  assertValid(r);
  assert.strictEqual(r.overall, "incomplete");
});

test("a root key that fails the pin is reported INCOMPLETE, not verified", async () => {
  const url = `https://example.com${WELL_KNOWN}`;
  const wrongRoot = crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" });
  const r = await discoverAttestation("example.com", {
    fetchImpl: fetcher({ [url]: { body: FOUNDATION_DOC } }),
    rootPem: wrongRoot,
  });
  assertValid(r);
  assert.strictEqual(r.overall, "incomplete");
  assert.ok(
    r.steps.some((s) => s.name === "Root key matches pinned fingerprint" && s.status === "INCOMPLETE"),
    "the pin failure must surface as an INCOMPLETE step, never a PASS",
  );
});

// ── the Foundation's own v1 attestation verifies, and both paths agree ──
test("a real v1 attestation verifies, and ESM and CLI produce the same document", async () => {
  const url = `https://example.com${WELL_KNOWN}`;
  const map = { [url]: { body: FOUNDATION_DOC } };
  const esm = await discoverAttestation("example.com", { fetchImpl: fetcher(map), rootPem: ROOT_PEM });
  const cjs = await cli.discoverByDomain("example.com", { fetchImpl: fetcher(map), rootPem: ROOT_PEM });

  assertValid(esm);
  assertValid(cjs);
  assert.strictEqual(esm.overall, "verified", "the Foundation's own v1 attestation must verify");
  assert.deepStrictEqual(stripTime(cjs), stripTime(esm), "ESM and CLI must emit the same ACTP document");
});
