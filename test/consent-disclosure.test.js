// The consent disclosure must be ONE set of words.
//
// api/adopt.js will not create an adoption without consent.disclosureVersion,
// and a machine asserting consent to text it cannot read would make that consent
// a formality. So the words a human is shown and the words published for a
// machine have to be the same words — these tests fail if they ever diverge,
// and if a superseded version is ever edited.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

import {
  DISCLOSURE,
  DISCLOSURE_VERSION,
  DISCLOSURE_URL,
  disclosureText,
  disclosureArtifact,
} from "../src/consent/disclosure.js";

const REPO = path.resolve(import.meta.dirname, "..");
const WELL_KNOWN = path.join(REPO, "public", ".well-known");
const publishedPath = path.join(WELL_KNOWN, `${DISCLOSURE_VERSION}.json`);

test("the published artefact matches the canonical source exactly", () => {
  assert.ok(
    fs.existsSync(publishedPath),
    `${DISCLOSURE_VERSION}.json is missing — run: npm run build:consent`,
  );
  const published = JSON.parse(fs.readFileSync(publishedPath, "utf8"));
  assert.deepStrictEqual(
    published,
    disclosureArtifact(),
    "the published disclosure has drifted from src/consent/disclosure.js — run: npm run build:consent",
  );
});

test("the artefact is served at the URL the source names", () => {
  assert.strictEqual(DISCLOSURE_URL, `/.well-known/${DISCLOSURE_VERSION}.json`);
  // The path the URL implies is the path the file actually occupies.
  assert.ok(fs.existsSync(path.join(REPO, "public", DISCLOSURE_URL.replace(/^\//, ""))));
});

test("the current version carries the corrected hash wording, not the signed claim", () => {
  const text = disclosureText();
  assert.match(text, /cryptographic hash of its facts that anyone can recompute/);
  assert.match(text, /because the record is public, copies may be held by others/);
  assert.ok(
    !/cryptographically signed/.test(text),
    "an adoption record is hashed, not signed — signatures belong to Foundation attestations",
  );
});

test("the disclosure still names every fact the ledger actually records", () => {
  const text = disclosureText();
  for (const fact of ["name or pseudonym", "date", "reference number", "cryptographic hash"]) {
    assert.ok(text.includes(fact), `the disclosure must name: ${fact}`);
  }
  // And the things an adopter must be told before a permanent public record.
  assert.match(text, /permanent and public/);
  assert.match(text, /You may adopt under a pseudonym/);
  assert.match(text, /privacy@primedirective\.dev/);
  assert.match(text, /what erasure means here/);
});

test("the human rendering and the machine rendering come from one source", () => {
  // Every word in the machine text must originate in the structure the
  // component renders — no string in this test, and none in the component,
  // is an independent copy of the wording.
  const fromStructure = [
    DISCLOSURE.heading,
    DISCLOSURE.recordsIntro,
    ...DISCLOSURE.records.flat().map((p) => p.t ?? p.b ?? p.a),
    ...DISCLOSURE.paragraphs.flat().map((p) => p.t ?? p.b ?? p.a),
    DISCLOSURE.consentStatement,
  ].filter(Boolean);
  const text = disclosureText();
  for (const fragment of fromStructure) {
    assert.ok(
      text.includes(fragment),
      `a fragment of the canonical structure is missing from the published text: ${fragment.slice(0, 40)}…`,
    );
  }
});

test("superseded versions stay published, frozen, and marked", () => {
  const superseded = fs
    .readdirSync(WELL_KNOWN)
    .filter((f) => /^consent-disclosure-.*\.json$/.test(f) && f !== `${DISCLOSURE_VERSION}.json`);

  assert.ok(superseded.length > 0, "at least one superseded version should remain published");

  for (const file of superseded) {
    const doc = JSON.parse(fs.readFileSync(path.join(WELL_KNOWN, file), "utf8"));
    assert.strictEqual(doc.status, "superseded", `${file} must be marked superseded`);
    assert.ok(doc.superseded_by, `${file} must name its successor`);
    assert.ok(doc.text && doc.text.length > 0, `${file} must retain its text`);
    assert.notStrictEqual(doc.version, DISCLOSURE_VERSION);
  }
});

test("version 1.0's exact wording is preserved, including the error it was retired for", () => {
  // Deliberately asserts the OLD, wrong sentence is still there. A consent
  // record referencing 1.0 must remain readable against the words it was
  // actually given — correcting history would destroy the accountability
  // record rather than improve it.
  const doc = JSON.parse(fs.readFileSync(path.join(WELL_KNOWN, "consent-disclosure-1.0.json"), "utf8"));
  assert.strictEqual(doc.version, "consent-disclosure-1.0");
  assert.match(
    doc.text,
    /Because the record is cryptographically signed, copies may be held by others/,
    "1.0 must keep its original wording verbatim, mistake included",
  );
  assert.match(doc.note, /recomputable hash and no signature/);
});

test("the version is bumped rather than edited in place", () => {
  assert.strictEqual(DISCLOSURE_VERSION, "consent-disclosure-1.1");
  // adopt.js only presence-checks disclosureVersion, so a bump cannot reject
  // an otherwise valid adoption. This asserts the shape that check relies on.
  assert.ok(typeof DISCLOSURE_VERSION === "string" && DISCLOSURE_VERSION.length > 0);
});
