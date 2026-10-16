// Integrity-audit F1: a contact email address must never appear in the public
// adoption issue body. The address is private — used only for the confirmation
// and welcome emails (via Resend) and, for registered organisations, the private
// steward email. If any future edit reintroduces it into the issue body, the
// Privacy Policy's "never published on the ledger" promise breaks; this test is
// the guard.

import test from "node:test";
import assert from "node:assert";

import { buildSections } from "../api/_lib/adoptionCore.js";

// RFC-ish email detector — deliberately broad so any leaked address trips it.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const EMAIL = "real.person@example.com";

test("person adoption issue body contains no email address", () => {
  const body = buildSections("person", {
    fullName: "Jane Doe",
    email: EMAIL,
    countryRegion: "United Kingdom",
  }).join("\n");
  assert.ok(!EMAIL_RE.test(body), `person body leaked an email:\n${body}`);
});

test("founding-venture adoption issue body contains no email address", () => {
  const body = buildSections("person", {
    subType: "founder",
    fullName: "Acme Ventures",
    representativeName: "Jane Doe",
    email: EMAIL,
    countryRegion: "United Kingdom",
  }).join("\n");
  assert.ok(!EMAIL_RE.test(body), `venture body leaked an email:\n${body}`);
});

test("organisation adoption issue body contains no email address", () => {
  const body = buildSections("organisation", {
    organisationName: "Acme Ltd",
    orgType: "registered-company",
    representativeName: "Jane Doe",
    representativeRole: "Director",
    email: EMAIL,
    businessNumber: "12345678",
    country: "United Kingdom",
    size: "2-10",
  }).join("\n");
  assert.ok(!EMAIL_RE.test(body), `organisation body leaked an email:\n${body}`);
});
