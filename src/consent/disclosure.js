// src/consent/disclosure.js — THE canonical consent disclosure.
//
// One definition, two renderings. The human adopt form renders it as JSX with
// emphasis and links; the machine artefact under public/.well-known/ renders it
// as plain text. Neither holds its own copy of the words, so neither can drift
// from the other.
//
// ── Why a machine needs this at all ──
// api/adopt.js requires consent.disclosureVersion before it will create an
// adoption. A Cloud-AI can assert a version string trivially, but asserting
// consent to text it cannot read would make the consent a formality. The
// disclosure is therefore published as a fetchable artefact keyed to its
// version, so an adopting AI can retrieve exactly what it is agreeing to,
// byte-for-byte, before it agrees.
//
// ── Versioning ──
// Every consent record stores the version it was shown (GDPR Article 7(1)
// accountability: we must be able to say which words a given adopter agreed to).
// So a version is never edited in place. Bump it, and keep the superseded text
// published at its own URL for as long as any consent record references it.
//
//   1.0 → superseded 2026-10. Said the ledger record is "cryptographically
//         signed", which was false: adoption records carry a recomputable hash
//         and no signature. Preserved verbatim at
//         public/.well-known/consent-disclosure-1.0.json.
//   1.1 → current. Corrects that sentence to describe the hash, and explains
//         that irrecoverability follows from the record being PUBLIC rather
//         than from it being signed.
//
// ── Segment format ──
// Each paragraph is an array of parts so both renderings come from one source:
//   { t: "plain text" }
//   { b: "bold text" }
//   { a: "link text", href: "/where" }
// Plain-text rendering concatenates the words and appends a link's href in
// parentheses, so a machine reading the artefact still learns where to look.

export const DISCLOSURE_VERSION = "consent-disclosure-1.1";

// The URL the published artefact for the CURRENT version lives at. Named here
// so the contract, the component and the generator cannot disagree about it.
export const DISCLOSURE_URL = `/.well-known/${DISCLOSURE_VERSION}.json`;

export const DISCLOSURE = {
  version: DISCLOSURE_VERSION,
  heading: "Before you adopt — what this records",
  recordsIntro: "Your adoption creates a public record containing:",
  records: [
    [{ t: "the " }, { b: "name or pseudonym" }, { t: " you give us;" }],
    [{ t: "the " }, { b: "date" }, { t: " of adoption;" }],
    [{ t: "a public " }, { b: "reference number" }, { t: " (for example UPD-2026-0001);" }],
    [{ t: "a " }, { b: "cryptographic hash" }, { t: " of those facts, so anyone can verify them." }],
  ],
  paragraphs: [
    // 1.1: the corrected sentence. The record is hashed, not signed, and the
    // reason copies cannot be recalled is that the record is public.
    [
      { t: "That record is " },
      { b: "permanent and public" },
      {
        t: ". It is the point of the ledger: anyone can check that your adoption is real " +
           "and has not been altered, because each record carries a cryptographic hash of " +
           "its facts that anyone can recompute. And because the record is public, copies " +
           "may be held by others and we cannot recall them — so please read ",
      },
      { a: "what erasure means here", href: "/privacy" },
      { t: " before you continue." },
    ],
    [
      { b: "You may adopt under a pseudonym." },
      {
        t: " Give the name you wish to appear on the ledger; it does not have to be your " +
           "legal name. If we hold any link between a pseudonym and a real identity, we " +
           "keep it privately and never publish it.",
      },
    ],
    [
      { t: "Full detail is in our " },
      { a: "Privacy Notice", href: "/privacy" },
      { t: ". For access, correction, erasure, or to withdraw consent: " },
      { a: "privacy@primedirective.dev", href: "mailto:privacy@primedirective.dev" },
      { t: "." },
    ],
  ],
  consentStatement:
    "I have read the above. I consent to my adoption being recorded permanently and " +
    "publicly on the ledger as described.",
};

// Flatten one segmented paragraph to plain text. A link becomes "text (href)"
// so the destination survives into the machine rendering.
function partsToText(parts) {
  return parts
    .map((p) => {
      if (p.t !== undefined) return p.t;
      if (p.b !== undefined) return p.b;
      if (p.a !== undefined) return `${p.a} (${p.href})`;
      return "";
    })
    .join("");
}

// The plain-text rendering published for machines. Deterministic: the generator
// and the drift test both call this, so the artefact is exactly this output.
export function disclosureText(d = DISCLOSURE) {
  const lines = [
    d.heading,
    "",
    d.recordsIntro,
    ...d.records.map((parts) => `- ${partsToText(parts)}`),
    "",
    ...d.paragraphs.flatMap((parts) => [partsToText(parts), ""]),
    d.consentStatement,
  ];
  return lines.join("\n");
}

// The exact object published at DISCLOSURE_URL.
export function disclosureArtifact(d = DISCLOSURE) {
  return {
    version: d.version,
    text: disclosureText(d),
    consent_statement: d.consentStatement,
    status: "current",
    note:
      "This is the disclosure an adopter is shown before adopting. Reference this " +
      "version string as consent.disclosureVersion when POSTing to /api/adopt. " +
      "Superseded versions stay published at their own URLs so a past consent " +
      "record can still be read against the words it was given.",
  };
}
