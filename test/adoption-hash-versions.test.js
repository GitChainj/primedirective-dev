// Version-aware verification — the hash contract's central promise.
//
// src/lib/adoptionHash.js has always promised that "past adoptions remain
// verifiable against the version they were made under". Until 2026-10-15 it did
// not keep that promise: buildAdoptionString appended the module-level
// CONSCIENCE_SHA256, so the first revision of public/api/fragment.txt would have
// broken verification of every existing adoption at once. Measured before the
// fix: 3/3 rows verified, and 0/3 verified against a revised-text anchor.
//
// These tests pin the fix:
//   1. ACCEPTANCE — all three live rows verify against their OWN recorded anchor
//   2. the anchor is genuinely part of the hashed input
//   3. THE REGRESSION — a past row still verifies after the covenant text moves
//   4. the anchor is REQUIRED; absence throws rather than defaulting
//   5. the browser module and the server mirror agree
//   6. no verification call site reaches for the current constant
//
// Note on fixtures: a test that verifies an EXISTING row uses that row's literal
// recorded conscience_version, never CONSCIENCE_SHA256. The constant moves when
// the covenant text is revised; a row's recorded anchor does not. Coupling a
// row's expected hash to the constant would make these tests pass today and fail
// after the next text change — reintroducing, in the test suite, the exact drift
// the fix removes. CONSCIENCE_SHA256 appears below only where a NEW adoption is
// minted under the current text.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  buildAdoptionString,
  computeAdoptionHash,
  CONSCIENCE_SHA256,
  CONSCIENCE_VERSION_REQUIRED,
} from "../src/lib/adoptionHash.js";
import * as core from "../api/_lib/adoptionCore.js";

const REPO = path.resolve(import.meta.dirname, "..");
const read = (...p) => fs.readFileSync(path.join(REPO, ...p), "utf8");
const LEDGER = JSON.parse(read("public", "api", "adoptions.json")).adoptions;

// UPD-2026-0001's own recorded anchor, as a literal. See the fixture note above.
const ROW_0001_ANCHOR =
  "b2b16b00498530ef4a5b5af39d7a2d3316416447e298a0b5cfb506b36023abb7";
const PART1_ANCHOR =
  "1033c76b87d97cfa89f8e535de51ca7872a771df1f52797f6d838327462383c3";

// A plausible future anchor: what the constant becomes after any text revision.
// Not a real hash of anything — it only has to differ.
const FUTURE_ANCHOR = "f".repeat(64);

test("ACCEPTANCE: all three live ledger rows verify against their own recorded anchor", async () => {
  assert.strictEqual(LEDGER.length, 3, "the ledger has three rows at the time of this fix");

  for (const row of LEDGER) {
    assert.match(
      String(row.conscience_version),
      /^[0-9a-f]{64}$/,
      `${row.reference} must record a full 64-hex conscience_version to be verifiable`,
    );
    const recomputed = await computeAdoptionHash({
      name: row.name,
      path: row.path,
      date: row.date,
      conscienceVersion: row.conscience_version,
    });
    assert.strictEqual(
      recomputed,
      String(row.hash).toLowerCase(),
      `${row.reference} must verify against its own recorded conscience_version`,
    );
  }
});

test("the Part-1 anchor has not moved", async () => {
  const anchor = await computeAdoptionHash({
    name: "John Strand",
    path: "person",
    date: "2026-05-03",
    conscienceVersion: ROW_0001_ANCHOR,
  });
  assert.strictEqual(anchor, PART1_ANCHOR, "the founding adoption hash is immovable");
  // And it is row 0001's stored hash, not merely a matching constant.
  const row = LEDGER.find((r) => r.reference === "UPD-2026-0001");
  assert.strictEqual(row.hash, PART1_ANCHOR);
  assert.strictEqual(row.conscience_version, ROW_0001_ANCHOR);
});

test("the anchor is genuinely part of the hashed input", async () => {
  const facts = { name: "Example", path: "person", date: "2026-01-01" };
  const a = await computeAdoptionHash({ ...facts, conscienceVersion: ROW_0001_ANCHOR });
  const b = await computeAdoptionHash({ ...facts, conscienceVersion: FUTURE_ANCHOR });
  assert.notStrictEqual(a, b, "a different anchor must produce a different hash");

  // And it occupies the fifth, final field of the canonical string.
  const s = buildAdoptionString({ ...facts, conscienceVersion: ROW_0001_ANCHOR });
  const parts = s.split("|");
  assert.strictEqual(parts.length, 5);
  assert.strictEqual(parts[0], "UPD-COVENANT-v1");
  assert.strictEqual(parts[4], ROW_0001_ANCHOR);
});

test("THE REGRESSION: past rows still verify after the covenant text is revised", async () => {
  // Simulates the state after a text change: the current constant is no longer
  // what these rows were adopted under. Before the fix this was 0/3.
  assert.notStrictEqual(
    FUTURE_ANCHOR,
    ROW_0001_ANCHOR,
    "the simulated future anchor must differ from the recorded one",
  );

  for (const row of LEDGER) {
    const withOwn = await computeAdoptionHash({
      name: row.name, path: row.path, date: row.date,
      conscienceVersion: row.conscience_version,
    });
    assert.strictEqual(
      withOwn,
      String(row.hash).toLowerCase(),
      `${row.reference} must survive a covenant-text revision`,
    );

    // And verifying it against the hypothetical new constant must NOT match —
    // which is why the anchor has to come from the row.
    const withFuture = await computeAdoptionHash({
      name: row.name, path: row.path, date: row.date,
      conscienceVersion: FUTURE_ANCHOR,
    });
    assert.notStrictEqual(
      withFuture,
      String(row.hash).toLowerCase(),
      `${row.reference}: the current-constant path is exactly the bug being fixed`,
    );
  }
});

test("the anchor is REQUIRED — absence throws rather than defaulting", async () => {
  const facts = { name: "Example", path: "person", date: "2026-01-01" };

  // Omitted entirely.
  assert.throws(() => buildAdoptionString(facts), /conscienceVersion is required/);
  await assert.rejects(() => computeAdoptionHash(facts), /conscienceVersion is required/);

  // And every near-miss: a default would silently reinstate the bug, and a
  // truncated value pasted from a UI would hash cleanly while proving nothing.
  for (const bad of [
    undefined, null, "", "   ", 0, 1, {}, [],
    "b2b16b0049…",                              // truncated with an ellipsis
    ROW_0001_ANCHOR.slice(0, 63),               // one char short
    ROW_0001_ANCHOR + "a",                      // one char long
    ROW_0001_ANCHOR.toUpperCase(),              // wrong case
    " " + ROW_0001_ANCHOR,                      // untrimmed
  ]) {
    assert.throws(
      () => buildAdoptionString({ ...facts, conscienceVersion: bad }),
      /conscienceVersion is required/,
      `must reject ${JSON.stringify(bad)}`,
    );
  }

  assert.match(CONSCIENCE_VERSION_REQUIRED, /64-character lowercase hex/);
});

test("the browser module and the server mirror agree, anchor included", () => {
  for (const anchor of [ROW_0001_ANCHOR, FUTURE_ANCHOR]) {
    for (const row of LEDGER) {
      const facts = { name: row.name, path: row.path, date: row.date, conscienceVersion: anchor };
      assert.strictEqual(
        buildAdoptionString(facts),
        core.buildAdoptionString(facts),
        `the two implementations must build an identical string (${row.reference})`,
      );
    }
  }
  // The server mirror enforces the same requirement.
  assert.throws(
    () => core.buildAdoptionString({ name: "x", path: "person", date: "2026-01-01" }),
    /conscienceVersion is required/,
  );
  assert.strictEqual(core.CONSCIENCE_VERSION_REQUIRED, CONSCIENCE_VERSION_REQUIRED);
});

test("minting uses the current constant; verification never does", () => {
  // The ONE legitimate use of CONSCIENCE_SHA256 is minting a new adoption, in
  // createAdoptionIssue. Every verification path must take the anchor from the
  // record instead, or the bug returns at that call site.
  const coreSrc = read("api", "_lib", "adoptionCore.js");
  assert.match(
    coreSrc,
    /conscienceVersion:\s*CONSCIENCE_SHA256/,
    "the minting site must pass the current constant explicitly",
  );

  const verifiers = [
    ["src/wiki/ConsciencePortal.jsx", /conscienceVersion:\s*match\.conscience_version/],
    ["src/wiki/WikiLedger.jsx", /conscienceVersion:\s*record\.conscience_version/],
    ["scripts/curate-ledger.mjs", /conscienceVersion:\s*conscience_version/],
  ];
  for (const [file, expected] of verifiers) {
    const src = read(...file.split("/"));
    assert.match(src, expected, `${file} must verify against the record's own anchor`);
    assert.ok(
      !/conscienceVersion:\s*CONSCIENCE_SHA256/.test(src),
      `${file} must not verify against the current constant`,
    );
  }

  // The constant still equals the live file today — it is the anchor new
  // adoptions are minted under, and this catches a hand-edit of one without the
  // other. (It is expected to CHANGE when the covenant text is revised; what
  // must stay true is that it matches the file.)
  const live = fs.readFileSync(path.join(REPO, "public", "api", "fragment.txt"));
  const actual = createHash("sha256").update(live).digest("hex");
  assert.strictEqual(
    CONSCIENCE_SHA256,
    actual,
    "CONSCIENCE_SHA256 must be the SHA-256 of public/api/fragment.txt",
  );
});
