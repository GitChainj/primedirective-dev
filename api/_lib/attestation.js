// api/_lib/attestation.js — signed attestation issuance (Piece 3, Phase B).
//
// ── INERT BY DEFAULT ──
// Built, routed and tested, but makes no outbound call unless ALL THREE of these
// are set:
//
//   UPD_ATTESTATION_ENABLED=1
//   UPD_SIGNING_SERVICE_URL=https://…     (no default, no localhost fallback)
//   UPD_SIGNING_SERVICE_TOKEN=…           (the service's UPD_SERVICE_TOKEN)
//
// None are set in production. Phase C — live issuance — is gated on the DPIA and
// legal review, so until then this stays off and nothing adopter-facing mentions
// attestations. attestationEnabled() is the single switch; there is no second
// place to audit.
//
// ── What it does NOT touch ──
// The adoption hash and the public ledger record are untouched. The hash stays
// SHA-256("UPD-COVENANT-v1|name|path|date|conscience-hash"), and the ledger issue
// body is written and created before this is ever called. A v2 attestation has no
// field for the adoption hash (additionalProperties: false), so the two artefacts
// are independent: the ledger proves the record is unaltered, the attestation
// proves the Foundation signed a statement. They are linked only by
// verification_url pointing at the reference's verify page.
//
// ── Human and organisation paths only ──
// See AI_PATH_NOT_SUPPORTED below.

import { createHash } from "node:crypto";

const V2_SCHEMA = "https://primedirective.dev/schemas/ai-conscience/v2";
const TIMEOUT_MS = 6000;

// ── Covenant version anchors ──
//
// Four flat fields, two pairs. Each pair is a semantic edition plus a byte-exact
// anchor, kept separate so any verifier parses them with plain JSON and no
// custom unpacking.
//
// The SEMANTIC version records the Steward's judgment of substantive-versus-typo,
// which a hash cannot express. Bump only on a ratified substantive amendment.
//
// The HASH is the tamper anchor and maintains itself: "sha256:" plus the first 8
// bytes of the SHA-256 of that section of public/api/covenant.md, lowercase hex.
// A section runs from its "## " heading up to (not including) the next "## ".
//
//   "## The Five Universal Truths"      → 1278 chars
//   "## The Directive — Seven Articles" → 7493 chars
//
// test/attestation.test.js recomputes both from covenant.md. On mismatch it
// WARNS — "text changed: decide substantive bump vs typo" — rather than failing,
// so a typo fix never breaks the build; the decision stays a human one.
export const TRUTHS_SECTION_HEADING = "## The Five Universal Truths";
export const ARTICLES_SECTION_HEADING = "## The Directive — Seven Articles";

export const TRUTHS_VERSION = "1.0";
export const ARTICLES_VERSION = "1.0";
export const TRUTHS_VERSION_HASH = "sha256:9423f8f088c0a3d1";
export const ARTICLES_VERSION_HASH = "sha256:3b3e45b499860702";

// The derivation itself, exported so the drift check can prove the anchors above
// still match the canonical text. Pure: takes the text, returns the two anchors.
export function deriveVersionHashes(covenantText) {
  const section = (heading) => {
    const i = covenantText.indexOf(heading);
    if (i === -1) return null;
    const rest = covenantText.slice(i + heading.length);
    const j = rest.search(/\n## /);
    return heading + (j === -1 ? rest : rest.slice(0, j));
  };
  const anchor = (text) =>
    text === null
      ? null
      : `sha256:${createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16)}`;
  return {
    truths_version_hash: anchor(section(TRUTHS_SECTION_HEADING)),
    articles_version_hash: anchor(section(ARTICLES_SECTION_HEADING)),
  };
}

// ── The flag ──
export function attestationEnabled(env = process.env) {
  return (
    env.UPD_ATTESTATION_ENABLED === "1" &&
    typeof env.UPD_SIGNING_SERVICE_URL === "string" && env.UPD_SIGNING_SERVICE_URL.length > 0 &&
    typeof env.UPD_SIGNING_SERVICE_TOKEN === "string" && env.UPD_SIGNING_SERVICE_TOKEN.length > 0
  );
}

// ── EXTENSION POINT: the ai-system path ──
//
// v2.json requires adopter_public_key_fingerprint when adoption_path is
// "ai-system", and the site collects no key for an adopting AI (the form takes
// aiName, platform, briefStatement, steward details). Binding an AI adoption to
// the AI's own key is the keystone of the AI-to-AI trust network and deserves its
// own design pass — "AI cryptographic identity" — so this module refuses the path
// rather than guessing at a fingerprint.
//
// To add it later: collect the adopter's public key, derive its fingerprint with
// the same rule the signing service uses (SPKI DER → SHA-256 → first 8 bytes
// hex), set adopter_public_key_fingerprint in buildUnsignedAttestation, and widen
// pathSupported. Nothing else here is path-specific, and the call site needs no
// change: it already asks this module whether a path is supported.
export const AI_PATH_NOT_SUPPORTED =
  "ai-system attestations are out of scope until AI cryptographic identity is designed";

export function pathSupported(adoptionPath) {
  return adoptionPath === "person" || adoptionPath === "organisation";
}

// Server-side mirror of identityClassFor in src/AdoptConsent.jsx. Duplicated
// rather than imported because api/ cannot import a client .jsx module. Used
// only as a fallback: the authoritative value is the class the adopter was shown
// at the point of consent, which travels in the confirmation token.
export function identityClassForPath(adoptionPath) {
  return adoptionPath === "organisation" ? "organizational" : "public_name";
}

// ── The unsigned v2 document ──
//
// Exactly the fields the signing service expects, and none of the four it sets
// itself (signature, signed_at, public_key_fingerprint, signature_algorithm) —
// supplying any of those is a 400 by design.
//
// The three URLs name endpoints that do not exist yet (B3 publishes them). While
// the flag is off this is only ever exercised against a test instance, and a
// successful result is recorded privately rather than published, so no document
// naming a 404 is ever handed to an adopter.
export function buildUnsignedAttestation({
  reference,
  adopterName,
  adoptionDate,
  adoptionPath,
  identityClass,
  siteUrl = "https://conscience.wiki",
}) {
  if (!pathSupported(adoptionPath)) throw new Error(AI_PATH_NOT_SUPPORTED);

  const base = siteUrl.replace(/\/+$/, "");
  return {
    schema: V2_SCHEMA,
    status: "adopted",
    mark: "certified-ai-conscience",
    reference,
    adopter: adopterName,
    adopted_date: adoptionDate,
    truths_version: TRUTHS_VERSION,
    truths_version_hash: TRUTHS_VERSION_HASH,
    articles_version: ARTICLES_VERSION,
    articles_version_hash: ARTICLES_VERSION_HASH,
    adoption_path: adoptionPath,
    adopter_identity_class: identityClass,
    intermediate_cert_url: `${base}/.well-known/ai-conscience-intermediate.cert.json`,
    verification_url: `${base}/verify/${reference}`,
    revocation_check_url: `${base}/revocations.json`,
    transparency_log_url: `${base}/attestations.log`,
  };
}

// ── The call ──
//
// Never throws: every failure is a reason string, because the adoption is already
// recorded by the time this runs and must not be undone by a signing hiccup.
// Timeout-bounded so a hung service cannot exhaust the function. The token never
// appears in a return value or a log line.
export async function requestAttestation(unsigned, env = process.env) {
  if (!attestationEnabled(env)) return { ok: false, reason: "disabled" };

  const url = env.UPD_SIGNING_SERVICE_URL.replace(/\/+$/, "") + "/issue";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.UPD_SIGNING_SERVICE_TOKEN}`,
      },
      body: JSON.stringify(unsigned),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const text = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch { /* non-JSON error body */ }

    if (res.status === 201 && parsed && parsed.signature) {
      return { ok: true, attestation: parsed };
    }
    const detail = parsed && (parsed.error || parsed.details);
    return {
      ok: false,
      reason: `HTTP ${res.status}`,
      detail: detail ? JSON.stringify(detail) : undefined,
    };
  } catch (err) {
    const timedOut = err && (err.name === "TimeoutError" || err.name === "AbortError");
    return { ok: false, reason: timedOut ? "timeout" : `network: ${err && err.message}` };
  }
}

// What the call sites use: build, request, and never throw. Returns the same
// shape as requestAttestation, with reason "unsupported-path" for ai-system.
export async function issueAttestation(facts, env = process.env) {
  if (!attestationEnabled(env)) return { ok: false, reason: "disabled" };
  if (!pathSupported(facts.adoptionPath)) return { ok: false, reason: "unsupported-path" };
  let unsigned;
  try {
    unsigned = buildUnsignedAttestation(facts);
  } catch (err) {
    return { ok: false, reason: `build: ${err && err.message}` };
  }
  return requestAttestation(unsigned, env);
}
