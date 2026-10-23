// The ACTP verification-result emitter must match its published schema.
//
// src/lib/attestationVerify.js toVerificationResult() maps an internal
// verifyAttestation() result to public/schemas/actp/verification-result/v1.json.
// If the emitter drifts from the schema, a consumer validating the output would
// reject a result the verifier calls valid. These tests validate the emitter's
// output against the schema itself, for a verified, an incomplete and a failed
// internal result.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

import { toVerificationResult, PASS, FAIL, INCOMPLETE } from "../src/lib/attestationVerify.js";

const REPO = path.resolve(import.meta.dirname, "..");
const SCHEMA = JSON.parse(
  fs.readFileSync(
    path.join(REPO, "public", "schemas", "actp", "verification-result", "v1.json"),
    "utf8",
  ),
);

// A small, dependency-free validator — enough for this schema's draft-2020-12
// subset (const / enum / type / format:date-time / items / required /
// additionalProperties:false). No ajv: the project adds no dependency for a
// test, and the schema is driven FROM the file, not retyped here.
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function validate(obj, schema, where = "$") {
  const errs = [];
  const typeOf = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);

  if (schema.const !== undefined && obj !== schema.const) {
    errs.push(`${where}: expected const ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.includes(obj)) {
    errs.push(`${where}: ${JSON.stringify(obj)} not in enum ${JSON.stringify(schema.enum)}`);
  }
  if (schema.type) {
    const t = typeOf(obj);
    const ok = schema.type === "integer" ? t === "number" && Number.isInteger(obj) : t === schema.type;
    if (!ok) errs.push(`${where}: expected type ${schema.type}, got ${t}`);
  }
  if (schema.format === "date-time" && typeof obj === "string" && !DATE_TIME.test(obj)) {
    errs.push(`${where}: "${obj}" is not a date-time`);
  }
  if (schema.type === "object" && obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const r of schema.required || []) {
      if (!(r in obj)) errs.push(`${where}: missing required "${r}"`);
    }
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(obj)) {
        if (!(schema.properties && k in schema.properties)) errs.push(`${where}: unexpected property "${k}"`);
      }
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

const V2_STEP_NAMES = {
  1: "Attestation signature valid against the intermediate key",
  2: "Intermediate certificate valid against the published root",
  3: "Neither the attestation nor its intermediate is revoked",
  4: "Recorded in the transparency log, chain intact",
};
const steps = (statuses) =>
  Object.entries(statuses).map(([n, status]) => ({ n: Number(n), name: V2_STEP_NAMES[n], status }));

test("a verified result maps to a schema-valid verification-result", () => {
  const r = toVerificationResult(
    { version: "v2", overall: "verified", steps: steps({ 1: PASS, 2: PASS, 3: PASS, 4: PASS }) },
    { subject: "example.com" },
  );
  assertValid(r);
  assert.strictEqual(r.actp, "1.0");
  assert.strictEqual(r.overall, "verified");
  assert.strictEqual(r.verifier, "actp-js/1.0");

  // The fifth check is reported SKIPPED, never silently dropped.
  const live = r.steps.find((s) => s.n === 5);
  assert.ok(live && live.status === "SKIPPED");

  assert.ok(r.proves.length >= 1, "a verified document proves something");
  assert.ok(
    r.does_not_prove.some((s) => s.includes("live-key check was not run")),
    "a document-only pass must not claim live key control",
  );
  assert.ok(r.does_not_prove.some((s) => s.includes("conduct")), "conduct caveat is always present");
});

test("an incomplete result names the checks that could not complete", () => {
  const r = toVerificationResult(
    { version: "v2", overall: "incomplete", steps: steps({ 1: PASS, 2: PASS, 3: INCOMPLETE, 4: INCOMPLETE }) },
    { subject: "UPD-2026-0001" },
  );
  assertValid(r);
  assert.strictEqual(r.overall, "incomplete");
  assert.ok(
    r.does_not_prove.some((s) => s.includes("could not complete")),
    "names that checks could not complete",
  );
  assert.ok(
    r.does_not_prove.some((s) => s.includes(V2_STEP_NAMES[3])),
    "lists the incomplete step by name",
  );
});

test("a failed result proves nothing", () => {
  const r = toVerificationResult(
    {
      version: "v2",
      overall: "failed",
      steps: [{ n: 1, name: V2_STEP_NAMES[1], status: FAIL, detail: "signature mismatch" }],
    },
    { subject: "example.com" },
  );
  assertValid(r);
  assert.strictEqual(r.overall, "failed");
  assert.deepStrictEqual(r.proves, []);
  assert.ok(r.does_not_prove.some((s) => s.includes("conduct")), "conduct caveat is still present");
});

test("a not_found result proves nothing and makes no claim about adoption", () => {
  const r = toVerificationResult({ overall: "not_found", steps: [] }, { subject: "example.com" });
  assertValid(r);
  assert.strictEqual(r.overall, "not_found");
  assert.deepStrictEqual(r.proves, []);
  assert.ok(
    r.does_not_prove.some((s) => s.includes("no attestation was published")),
    "not_found must not read as a non-adoption",
  );
  assert.ok(r.does_not_prove.some((s) => s.includes("conduct")), "conduct caveat is still present");
});
