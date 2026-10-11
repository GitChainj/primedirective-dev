#!/usr/bin/env node
// scripts/build-consent-disclosure.mjs
//
// Emits the machine-fetchable consent disclosure FROM the canonical source, so
// the published artefact cannot drift from the words the human form shows.
//
//   src/consent/disclosure.js  →  public/.well-known/<version>.json
//
// Runs as part of `npm run build`. test/consent-disclosure.test.js re-derives
// the artefact independently and fails if the checked-in file differs, so a
// forgotten regeneration is caught by the suite rather than shipped.
//
// Superseded versions are NOT generated: once published, a version's text is
// frozen so a past consent record can still be read against the exact words it
// was given. Those files are written once, by hand, and never regenerated.

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");

const { DISCLOSURE_VERSION, disclosureArtifact } = await import(
  join(REPO, "src", "consent", "disclosure.js")
);

const artifact = disclosureArtifact();
const out = join(REPO, "public", ".well-known", `${DISCLOSURE_VERSION}.json`);
const text = JSON.stringify(artifact, null, 2) + "\n";

const unchanged = existsSync(out) && readFileSync(out, "utf8") === text;
writeFileSync(out, text);

console.error(
  `consent disclosure: ${DISCLOSURE_VERSION} → public/.well-known/${DISCLOSURE_VERSION}.json` +
  (unchanged ? " (unchanged)" : " (written)"),
);
