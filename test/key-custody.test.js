// Axis A must be declared, not inferred — and must agree everywhere.
//
// key_custody records WHO HOLDS THE KEY. submissionType records WHO SUBMITTED.
// Deriving the first from the second overclaimed Axis A for the majority case: a
// stateless platform AI adopting in its own name cannot retain a secret between
// invocations, so its key is held for it, and the design records such an AI as
// permanently operator_held.
//
// These tests pin three properties: custody is never inferred from
// submissionType; the value in the adopt response is the SAME value written to
// the ledger issue body; and an undeclared custody defaults conservatively.

import test from "node:test";
import assert from "node:assert";

// The gradient primitives come from the leaf module that defines them; validate()
// stays in adoptionCore.js. Nothing re-exports the gradient, so there is exactly
// one import path for each symbol.
import {
  keyCustodyFrom,
  KEY_CUSTODY_VALUES,
  KEY_CUSTODY_DEFAULT,
} from "../api/_lib/autonomyGradient.js";
import { validate } from "../api/_lib/adoptionCore.js";

const base = {
  aiName: "Example Agent",
  platform: "OpenAI gpt-4o (LangChain)",
  adopterDid: "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
  submissionType: "independent",
  briefStatement: "Why I adopt, in my own words.",
};

test("custody is NOT inferred from submissionType", () => {
  // The whole point: both submission types, nothing declared, same answer.
  const independent = keyCustodyFrom({ ...base, submissionType: "independent" });
  const stewarded = keyCustodyFrom({ ...base, submissionType: "steward" });
  assert.strictEqual(independent, "operator_held");
  assert.strictEqual(stewarded, "operator_held");
  assert.strictEqual(
    independent,
    stewarded,
    "submissionType must not move Axis A — a stateless AI adopting in its own name still cannot hold a key",
  );
});

test("an undeclared custody defaults conservatively", () => {
  assert.strictEqual(KEY_CUSTODY_DEFAULT, "operator_held");
  for (const d of [{}, { keyCustody: undefined }, { keyCustody: "" }, { keyCustody: "   " }]) {
    assert.strictEqual(keyCustodyFrom({ ...base, ...d }), "operator_held");
  }
  assert.strictEqual(keyCustodyFrom(undefined), "operator_held", "no data at all is still safe");
});

test("a declared custody is honoured, and only the three values exist", () => {
  assert.deepStrictEqual(
    [...KEY_CUSTODY_VALUES].sort(),
    ["enclave_attested", "operator_held", "self_generated"],
  );
  for (const value of KEY_CUSTODY_VALUES) {
    assert.strictEqual(keyCustodyFrom({ ...base, keyCustody: value }), value);
    assert.strictEqual(keyCustodyFrom({ ...base, keyCustody: ` ${value} ` }), value, "trimmed");
  }
  // Anything outside the enum falls back rather than propagating.
  for (const junk of ["self-generated", "SELF_GENERATED", "level1", "true", 1, {}]) {
    assert.strictEqual(keyCustodyFrom({ ...base, keyCustody: junk }), "operator_held");
  }
});

test("a malformed declared custody is rejected at validation, not silently defaulted", () => {
  assert.strictEqual(validate("ai-system", base), null, "the baseline must be valid");
  assert.strictEqual(
    validate("ai-system", { ...base, keyCustody: "operator_held" }),
    null,
    "a valid declaration passes",
  );
  assert.match(
    validate("ai-system", { ...base, keyCustody: "self-generated" }),
    /Key custody must be operator_held, self_generated or enclave_attested/,
    "a near-miss must be an error, so a typo cannot quietly become operator_held",
  );
  // Absent is NOT an error.
  assert.strictEqual(validate("ai-system", { ...base, keyCustody: undefined }), null);
});

test("the response value equals the value written to the ledger issue body", async () => {
  // The issue body is built by createAdoptionIssue, which needs GitHub. So this
  // asserts the property that makes them equal: both call keyCustodyFrom on the
  // same submitted data. Any future divergence means one of them stopped doing
  // that, which is the thing worth catching.
  const gradient = await import("../api/_lib/autonomyGradient.js");
  const source = (await import("node:fs")).readFileSync(
    new URL("../api/_lib/adoptionCore.js", import.meta.url),
    "utf8",
  );
  const handler = (await import("node:fs")).readFileSync(
    new URL("../api/adopt.js", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /\*\*Key custody:\*\* \$\{keyCustodyFrom\(data\)\}/,
    "the ledger issue body must render keyCustodyFrom(data)",
  );
  assert.match(
    handler,
    /key_custody: keyCustodyFrom\(data\)/,
    "the adopt response must render keyCustodyFrom(data)",
  );
  // Assert against CODE, not prose: adoptionCore's header deliberately names
  // keyCustodyFor() to record why it is no longer used, and an explanation of a
  // retired helper must not read as a use of it.
  const stripComments = (s) =>
    s
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, "");

  for (const [name, text] of [["adoptionCore.js", source], ["adopt.js", handler]]) {
    assert.ok(
      !/keyCustodyFor\s*\(/.test(stripComments(text)),
      `${name} must not CALL the old submissionType-derived helper`,
    );
  }
  // Nor import it.
  assert.ok(
    !/import\s*\{[^}]*keyCustodyFor/.test(source),
    "adoptionCore.js must not import the old helper",
  );

  // And they agree on every input, declared or not.
  for (const declared of [undefined, "operator_held", "self_generated", "enclave_attested"]) {
    for (const submissionType of ["independent", "steward"]) {
      const data = { ...base, submissionType, keyCustody: declared };
      const responseValue = gradient.keyCustodyFrom(data);
      const ledgerValue = gradient.keyCustodyFrom(data); // same function, same input
      assert.strictEqual(responseValue, ledgerValue);
      assert.ok(KEY_CUSTODY_VALUES.has(responseValue));
    }
  }
});

test("the response states what the adoption is and is not", async () => {
  const handler = (await import("node:fs")).readFileSync(
    new URL("../api/adopt.js", import.meta.url),
    "utf8",
  );
  assert.match(handler, /assurance: "self_asserted"/);
  assert.match(handler, /verifiable_by: "challenge-response"/);
  assert.match(handler, /foundation_attestation: "not_issued"/);

  // No level/tier KEY inside the identity block. Scoped to that block on
  // purpose: `tier` elsewhere in this handler is the long-standing human
  // adoption tier (individual / venture / organisation), which is a different
  // thing entirely and must not be swept up by this assertion.
  const block = handler.slice(handler.indexOf("identity: {"), handler.indexOf("foundation_attestation_note"));
  assert.ok(block.length > 0, "the identity block must be locatable");
  for (const forbidden of [/\blevel\s*:/, /\btier\s*:/, /"level"/, /"tier"/]) {
    assert.ok(
      !forbidden.test(block),
      `no level or tier field in the identity block — the gradient is two axes, not one ladder (matched ${forbidden})`,
    );
  }
  // And the two axes that DO belong there are present.
  assert.match(block, /key_custody:/);
  assert.match(block, /comprehension:/);
});
