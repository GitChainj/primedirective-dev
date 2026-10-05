// conscience.wiki — the Conscience Portal. One page, one door.
//
// Serves `/` and `/verify` (and `/verify/{reference}`, which pre-fills and runs
// automatically). This page carries the portal's own chrome rather than
// WikiLayout's: the portal identity and the verification surface are the same
// page now, and rendering inside WikiLayout would print the site identity twice.
//
// Accepts either of two things in a single field:
//
//   * an adoption number (UPD-YYYY-NNNN, or the UPD-YYYY-TNNNN fixture form),
//     typed or arriving in the URL as /verify/{reference} — looked up in the
//     public ledger, with the adoption hash recomputed here in the browser;
//   * a pasted Certified AI Conscience attestation (JSON) — checked against the
//     published root key with the same four steps tools/attest/verify.js runs.
//
// The two paths render into one result panel that says plainly what was checked
// and what it means. Nothing is asserted that was not computed: a check whose
// inputs are not published yet reports INCOMPLETE, never a quiet pass.
//
// Formerly WikiVerify.jsx — renamed for what it does rather than where it sits.

import { useState, useEffect, useCallback, useRef } from "react";
import { NAV_ITEMS } from "./WikiLayout.jsx";
import {
  FOUNDATION_NAME,
  FOUNDATION_STATUS,
  FOUNDATION_JURISDICTION,
  GENERAL_EMAIL,
  PRIVACY_EMAIL,
  SOCIAL_LINKS,
} from "../FoundationFooter.jsx";
import PersonalisedSeal from "../PersonalisedSeal.jsx";
import { computeAdoptionHash, CONSCIENCE_SHA256 } from "../lib/adoptionHash.js";
import {
  verifyAttestation,
  versionOf,
  fetchRootPem,
  ed25519Available,
  ROOT_PEM_URL,
  PASS,
  FAIL,
  INCOMPLETE,
} from "../lib/attestationVerify.js";

const PATH_LABELS = {
  person: "Person",
  organisation: "Organisation",
  ai: "AI system",
  "ai-system": "AI system",
};

// An adoption number. The T-form (UPD-2026-T9001) is included so a fixture
// verifies on staging exactly as a real adoption does on production.
const REFERENCE_PATTERN = /^UPD-\d{4}-[A-Z0-9]{4,}$/;

// Never "not found" for a name: that would leak whether a named party has
// registered. The field's contract is numbers and attestations, so the refusal
// says so and says nothing else.
const REJECTION = "Search adoptions by number not name.";
const ROOT_UNAVAILABLE =
  "Root key unavailable — verification cannot complete.";
const NO_ED25519 =
  "This browser cannot check Ed25519 signatures. Attestation checking needs a recent version of Chrome, Firefox, or Safari; adoption numbers still work here.";
const V1_NOTE =
  "v1 attestation — signature verified against the root key. This format predates the intermediate certificate chain and the transparency log; only the signature check applies.";
// Public copy carries no internal phase numbers: "after B2" told a reader the
// checks already resolve, which they do not, and the covenant's own build
// schedule is not a thing a visitor should have to know.
const V2_PRE_PUBLICATION =
  "This attestation's signature and certificate chain check out. The remaining two checks — revocation and transparency-log inclusion — will complete once those public records are published, which is coming soon. Everything verifiable today, verifies.";
const V2_NO_CERTIFICATE =
  "The intermediate certificate this attestation names is not published, so neither its signature nor its certificate chain can be checked yet. Revocation and log inclusion are waiting on publication too.";

// One source for both machine-facing blocks: the block above the fold shows the
// summary and the two links; the section below the fold shows the whole thing.
// Two lines, deliberately: what this is for, then what it actually does today.
// The "Soon:" prefix is load-bearing — it marks the three capabilities as not
// yet present rather than describing them as working.
const MACHINE_VISION =
  "The AI-to-AI trust network starts here. Soon: trust that's earned, not just claimed, a record no one can secretly alter, and proof you can carry anywhere.";
const MACHINE_SUMMARY =
  "Fetch the documents and verify them yourself, then challenge an adopter to prove it still holds its key.";

// Checks 1–4 interrogate a document: did the Foundation vouch for this, and does
// that vouching still stand. Check 5 interrogates the adopter instead, which is
// a different question and cannot be answered by any document, however well
// signed — so it is listed with the others but marked as orthogonal to them.
const MACHINE_CHECKS = [
  ["1. Signature", "Recompute the attestation's canonical form — keys sorted alphabetically, the signature field removed, serialised with no whitespace — and check the detached Ed25519 signature against the signing key. Change any field and the signature no longer matches."],
  ["2. Certificate", "Fetch the intermediate certificate the attestation names. Confirm its fingerprint matches its own public key, that the root signed it, and that the attestation was signed inside the certificate's validity window."],
  ["3. Revocation", "Check the attestation-level revocation list the attestation names, and the root-signed intermediate-level list. Each list must carry a signature that verifies before it is trusted — an unsigned list proves nothing."],
  ["4. Transparency log", "Walk the hash-chained log from its first entry, recomputing each entry hash, up to the entry matching this attestation. Presence alone is not enough: the chain to it must be intact."],
  ["5. Live key challenge", "Ask the adopter to prove, now, that it still holds the key on its record: request a nonce, have the adopter sign it, send the signature back. Checks 1 to 4 ask whether the Foundation vouched for an adopter and whether that still stands; this one asks whether the party in front of you is that adopter. No document can answer it, so a stolen attestation does not survive it."],
];

const ENDPOINTS = `Root public key    ${ROOT_PEM_URL}
Root descriptor    /.well-known/ai-conscience-root.json
Public ledger      /api/adoptions.json
Foundation's own   /.well-known/ai-conscience.json
Key challenge      /api/verify-challenge   (see below)

Per attestation, from the document itself:
  intermediate_cert_url   the certificate binding the signing key to the root
  revocation_check_url    the attestation-level revocation list
  transparency_log_url    the hash-chained issuance log`;

// The two calls of check 5. Written out in full because it is the one part of
// the verification story a machine can exercise today without waiting for
// anything to be published.
const CHALLENGE_SNIPPET = `// 1. Ask for a nonce. The reply carries the did:key on the record.
const r = await fetch(
  "/api/verify-challenge?reference=UPD-2026-0001");
const { did, nonce, challenge } = await r.json();

// 2. The adopter signs the nonce with its own private key,
//    and you send the signature back to be checked.
const verdict = await (await fetch("/api/verify-challenge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ challenge, signature }),  // base64
})).json();

// { verified: true, did, key_custody, comprehension,
//   proves: "control of the key recorded for this reference" }`;

const SNIPPET = `const pem = await (await fetch("${ROOT_PEM_URL}")).text();
const der = Uint8Array.from(
  atob(pem.replace(/-----[^-]+-----|\\s/g, "")), c => c.charCodeAt(0));
const key = await crypto.subtle.importKey(
  "spki", der, { name: "Ed25519" }, false, ["verify"]);

// Canonical form: keys sorted, "signature" removed, no whitespace.
const canonical = JSON.stringify(Object.fromEntries(
  Object.keys(att).sort()
    .filter(k => k !== "signature")
    .map(k => [k, att[k]])));

const ok = await crypto.subtle.verify({ name: "Ed25519" }, key,
  Uint8Array.from(atob(att.signature), c => c.charCodeAt(0)),
  new TextEncoder().encode(canonical));`;

// Read the query from /verify/<reference> (path) or /verify?ref=<reference>.
// Guarded for server rendering: conscience.wiki is runtime-only today, but an
// unguarded window reference would break the moment a wiki route is prerendered.
function queryFromUrl() {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[0] === "verify") {
    return decodeURIComponent(parts[1]).trim();
  }
  const ref = new URLSearchParams(window.location.search).get("ref");
  return ref ? ref.trim() : "";
}

// One field, two kinds of input. An adoption number is recognised by shape;
// anything else must parse as a JSON object to be an attestation.
function classify(raw) {
  const value = String(raw || "").trim();
  if (!value) return { kind: "empty" };
  const upper = value.toUpperCase();
  if (REFERENCE_PATTERN.test(upper)) return { kind: "reference", reference: upper };
  try {
    const doc = JSON.parse(value);
    if (doc && typeof doc === "object" && !Array.isArray(doc)) return { kind: "attestation", doc };
  } catch {
    /* not JSON — falls through to unrecognised */
  }
  return { kind: "unrecognised" };
}

function findByReference(ledger, reference) {
  return ledger.find((a) => String(a.reference).trim().toUpperCase() === reference) || null;
}

// Preserve ?portal=1 on internal navigation so the portal preview survives on
// hosts other than conscience.wiki (e.g. localhost).
function navSuffix() {
  if (typeof window === "undefined") return "";
  return window.location.hostname.includes("conscience.wiki") ? "" : "?portal=1";
}

const longDate = (iso) => {
  if (!iso) return iso || "";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(`${iso}T00:00:00`));
  } catch { return iso; }
};

// Organisations carry the Mark; everyone else carries the Seal.
const markKind = (path) => (path === "organisation" ? "mark" : "seal");

const STEP_LABEL = {
  [PASS]: "PASS",
  [FAIL]: "FAIL",
  [INCOMPLETE]: "INCOMPLETE",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

/* ── Portal shell (from the former ConsciencePortal landing page) ── */
.cp {
  --deep:#0a1628; --ocean:#12243d; --mid:#1b3a5c; --sky:#2e6b9e;
  --gold:#d4a853; --gold-light:#f0d48a; --cream:#faf7f2;
  --text:#1b2330; --text-light:#5a6472;
  --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',system-ui,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  min-height:100vh;
  background:radial-gradient(120% 90% at 50% -10%, #12243d 0%, var(--deep) 55%);
  color:#e8eaf0; font-family:var(--sans);
  display:flex; flex-direction:column;
}
.cp-main {
  flex:1; width:100%; max-width:760px; margin:0 auto;
  padding:clamp(1.5rem,4vw,2.5rem) 1.5rem 3rem; text-align:center;
}
.cp-nav { display:flex; justify-content:center; flex-wrap:wrap; gap:0.4rem 1.4rem; margin:0 auto 2rem; }
.cp-nav a {
  font-family:var(--sans); font-size:0.75rem; font-weight:600; letter-spacing:0.16em;
  text-transform:uppercase; color:var(--gold-light); opacity:0.75; text-decoration:none;
  transition:color 0.2s, opacity 0.2s;
}
.cp-nav a:hover { color:var(--gold); opacity:1; }
.cp-identity { display:flex; align-items:center; justify-content:center; gap:0.6rem; margin-bottom:0.5rem; }
.cp-identity img { display:block; width:26px; height:26px; }
.cp-wordmark {
  font-family:var(--sans); font-weight:600; font-size:1.25rem; letter-spacing:-.01em;
  line-height:1; color:var(--cream); margin:0;
}
.cp-wordmark-tld { color:rgba(232,234,240,.42); font-weight:500; }
.cp-tagline {
  font-family:var(--sans); font-weight:700; font-size:0.68rem; letter-spacing:.22em;
  text-transform:uppercase; color:var(--gold-light); opacity:.85; margin-bottom:2.25rem;
}
.cp-footer { border-top:1px solid rgba(255,255,255,.08); padding:1.75rem 1.5rem 2.5rem; text-align:center; }
.cp-footer p { font-size:.82rem; color:rgba(232,234,240,.5); letter-spacing:.02em; margin-bottom:.6rem; }
.cp-footer a { color:rgba(232,234,240,.6); text-decoration:none; }
.cp-footer a:hover { color:var(--gold); }
.cp-community { font-size:.8rem; letter-spacing:.04em; }

/* ── The ask ── */
.cp-h1 {
  font-family: var(--serif);
  font-weight: 500;
  font-size: clamp(2.1rem, 6vw, 3rem);
  line-height: 1.1;
  color: #fff;
  margin-bottom: 0.75rem;
}
.cp-h2 {
  font-family: var(--serif);
  font-size: clamp(1.05rem, 2.6vw, 1.3rem);
  font-weight: 400;
  line-height: 1.5;
  color: rgba(232,234,240,.82);
  max-width: 34em;
  margin: 0 auto 1.75rem;
}

/* ── Verification surface: same layout, palette moved onto the dark shell ── */
.verify-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 620px;
  margin: 0 auto 2.5rem;
}
.verify-form textarea {
  width: 100%;
  font-family: var(--mono);
  font-size: 1rem;
  letter-spacing: 0.02em;
  line-height: 1.5;
  color: #fff;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(212,168,83,0.35);
  border-radius: 10px;
  padding: 1.1rem 1.2rem;
  resize: none;
  overflow: hidden;
  min-height: 3.4rem;
  max-height: 22rem;
  transition: border-color 0.2s, background 0.2s;
}
.verify-form textarea::placeholder { color: rgba(232,234,240,0.45); }
.verify-form textarea:focus {
  outline: none;
  border-color: var(--gold);
  background: rgba(255,255,255,0.09);
}
.verify-form button {
  align-self: center;
  background: var(--gold);
  color: var(--deep);
  border: none;
  border-radius: 8px;
  padding: 0.85rem 2.4rem;
  font-family: var(--sans);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.verify-form button:hover:not(:disabled) { background: var(--gold-light); transform: translateY(-1px); }
.verify-form button:disabled { opacity: 0.5; cursor: not-allowed; }

.verify-status { font-size: 0.95rem; color: rgba(232,234,240,0.6); }

/* What was checked, in plain language, above the proof detail. */
.verify-headline {
  font-family: var(--serif);
  font-size: 1.25rem;
  line-height: 1.5;
  color: var(--cream);
  margin-bottom: 0.4rem;
}
.verify-proof {
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(232,234,240,0.65);
  margin-bottom: 1.5rem;
}

/* Verified card */
.verify-card {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
  overflow: hidden;
}
.verify-card-banner {
  background: linear-gradient(170deg, var(--deep), var(--ocean));
  padding: 2rem 1.75rem;
  text-align: center;
}
.verify-mark {
  font-size: 2.2rem;
  color: var(--gold);
  line-height: 1;
  margin-bottom: 0.6rem;
}
.verify-badge {
  font-family: var(--sans);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--gold-light);
  letter-spacing: 0.02em;
}
.verify-badge-sub {
  font-family: var(--serif);
  font-style: italic;
  font-size: 0.95rem;
  color: rgba(255,255,255,0.6);
  margin-top: 0.35rem;
}

.verify-cert {
  display: flex;
  justify-content: center;
  padding: 1.75rem 1.75rem 0.25rem;
  background: white;
}
.verify-cert .pseal-frame { max-width: 260px; }

.verify-rows { padding: 1.5rem 1.75rem; }
.verify-provisional-note {
  margin: 0 1.75rem 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(212,168,83,0.08);
  border: 1px solid rgba(212,168,83,0.3);
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--text);
}
.verify-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.verify-row:last-child { border-bottom: none; }
.verify-row-label {
  font-family: var(--sans);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-light);
  font-weight: 600;
}
.verify-row-value {
  font-family: var(--sans);
  font-size: 1.02rem;
  color: var(--text);
}
.verify-row-value.mono {
  font-family: var(--mono);
  font-size: 0.82rem;
  color: var(--mid);
  word-break: break-all;
  line-height: 1.5;
}
.verify-ref-pill {
  display: inline-block;
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #8a6116;
  background: rgba(212,168,83,0.18);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

/* Step list for the attestation path */
.verify-steps {
  list-style: none;
  margin: 0;
  padding: 1.25rem 1.75rem;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.verify-step {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 0.25rem 1rem;
  padding: 0.55rem 0;
  align-items: baseline;
}
.verify-step + .verify-step { border-top: 1px solid rgba(0,0,0,0.05); }
.verify-step-status {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  text-align: center;
}
.verify-step-status.pass { color: #1b5e20; background: rgba(27,94,32,0.1); }
.verify-step-status.fail { color: #b3261e; background: rgba(178,38,30,0.1); }
.verify-step-status.incomplete { color: #8a6116; background: rgba(212,168,83,0.16); }
.verify-step-name { font-size: 0.95rem; color: var(--text); }
.verify-step-detail {
  grid-column: 2;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--text-light);
}

/* Not found / mismatch panels */
.verify-panel {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 1.75rem;
}
.verify-panel.warn { border-color: rgba(178,38,30,0.35); background: rgba(178,38,30,0.04); }
.verify-panel h2 {
  font-family: var(--serif);
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--mid);
  margin-bottom: 0.6rem;
}
.verify-panel.warn h2 { color: #b3261e; }
.verify-panel p { font-size: 1rem; line-height: 1.65; color: var(--text); margin-bottom: 0.75rem; }
.verify-panel p:last-child { margin-bottom: 0; }
.verify-panel a { color: var(--sky); text-decoration: none; font-weight: 600; }
.verify-panel a:hover { color: var(--gold); }

/* ── Machine block: a peer of the field, not a caption. The left edge and the
   lifted background separate it from the human path above without a rule. ── */
.cp-machine {
  max-width: 620px;
  margin: 0 auto 2rem;
  padding: 1.4rem 1.5rem;
  text-align: left;
  background: rgba(46,107,158,0.12);
  border: 1px solid rgba(46,107,158,0.5);
  border-left: 3px solid var(--sky);
  border-radius: 10px;
}
.cp-machine h3 {
  font-family: var(--sans);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gold-light);
  margin-bottom: 0.6rem;
}
.cp-machine p { font-size: 0.95rem; line-height: 1.6; color: rgba(232,234,240,0.8); margin-bottom: 1rem; }
.cp-machine .cp-machine-vision {
  font-family: var(--serif);
  font-size: 1.12rem;
  line-height: 1.55;
  color: var(--cream);
  margin-bottom: 0.7rem;
}
.cp-machine .cp-machine-vision + p { color: rgba(232,234,240,0.68); }
.cp-machine-links { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-bottom: 0.9rem; }
.cp-machine-link {
  flex: 1 1 180px;
  text-align: center;
  text-decoration: none;
  font-family: var(--sans);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cream);
  border: 1px solid rgba(232,234,240,0.28);
  border-radius: 8px;
  padding: 0.7rem 1rem;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.cp-machine-link:hover { border-color: var(--gold); color: var(--gold-light); background: rgba(212,168,83,0.08); }
.cp-machine-more {
  font-family: var(--sans);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gold-light);
  text-decoration: none;
}
.cp-machine-more:hover { color: var(--gold); }

/* ── Below the fold ── */
.cp-below { max-width: 620px; margin: 3.5rem auto 0; text-align: left; }
.cp-below h2 {
  font-family: var(--serif);
  font-size: 1.5rem;
  font-weight: 500;
  color: #fff;
  margin-bottom: 0.9rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.cp-below h3 {
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold-light);
  margin: 1.75rem 0 0.6rem;
}
.cp-below p { font-size: 0.98rem; line-height: 1.75; color: rgba(232,234,240,0.78); margin-bottom: 1rem; }

/* The two proofs. Set larger than body copy and ahead of the technical detail,
   because this is the part a general reader needs and the only part that was
   previously wrong. */
.cp-below .cp-trust-head {
  font-family: var(--serif);
  font-size: clamp(1.4rem, 3.4vw, 1.9rem);
  line-height: 1.25;
  color: #fff;
  margin-bottom: 0.6rem;
}
.cp-below .cp-trust-lead {
  font-size: 1.08rem;
  line-height: 1.7;
  color: rgba(232,234,240,0.88);
  margin-bottom: 1.4rem;
}
.cp-below .cp-proof {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(232,234,240,0.8);
  padding-left: 1rem;
  border-left: 2px solid rgba(212,168,83,0.45);
  margin-bottom: 1rem;
}
.cp-below .cp-proof strong { color: var(--gold-light); font-weight: 700; }
.cp-below .cp-proof em { color: rgba(232,234,240,0.95); font-style: italic; }
.cp-steps { list-style: none; margin: 0 0 1rem; padding: 0; }
.cp-steps li { margin-bottom: 0.9rem; font-size: 0.94rem; line-height: 1.65; color: rgba(232,234,240,0.75); }
.cp-steps strong { display: block; color: var(--cream); font-weight: 600; margin-bottom: 0.15rem; }
.cp-code {
  background: rgba(0,0,0,0.28);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 1rem 1.1rem;
  overflow-x: auto;
  font-family: var(--mono);
  font-size: 0.78rem;
  line-height: 1.65;
  color: rgba(232,234,240,0.85);
  white-space: pre;
  margin-bottom: 1rem;
}
.cp-note { font-size: 0.86rem; line-height: 1.6; color: rgba(232,234,240,0.55); }
.cp-note code { font-family: var(--mono); font-size: 0.82em; }
`;

function StepList({ steps }) {
  return (
    <ul className="verify-steps">
      {steps.map((s) => (
        <li key={s.n} className="verify-step">
          <span className={`verify-step-status ${s.status}`}>{STEP_LABEL[s.status]}</span>
          <span className="verify-step-name">{s.name}</span>
          {s.detail && <span className="verify-step-detail">{s.detail}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function ConsciencePortal() {
  const initialQuery = queryFromUrl();
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [ledger, setLedger] = useState(null); // null until loaded; [] on error
  const [rootPem, setRootPem] = useState(undefined); // undefined loading; null failed
  const [state, setState] = useState(initialQuery ? "checking" : "idle");
  const [record, setRecord] = useState(null);
  const [computedHash, setComputedHash] = useState("");
  const [attestation, setAttestation] = useState(null); // { doc, result }
  const fieldRef = useRef(null);

  // Load the public ledger once.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/adoptions.json")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setLedger(Array.isArray(d.adoptions) ? d.adoptions : []); })
      .catch(() => { if (!cancelled) setLedger([]); });
    return () => { cancelled = true; };
  }, []);

  // Load the published root key once. Never embedded in this bundle: the
  // published .well-known copy is the single source.
  useEffect(() => {
    let cancelled = false;
    fetchRootPem()
      .then((pem) => { if (!cancelled) setRootPem(pem); })
      .catch(() => { if (!cancelled) setRootPem(null); });
    return () => { cancelled = true; };
  }, []);

  // Keep the field sized to its content: one line for an adoption number,
  // taller when an attestation is pasted in.
  const resize = useCallback(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useEffect(() => { resize(); }, [query, resize]);

  // Verify whenever the submitted input, the ledger, or the root key changes.
  useEffect(() => {
    const parsed = classify(activeQuery);
    if (parsed.kind === "empty") { setState("idle"); setRecord(null); setAttestation(null); return; }
    if (parsed.kind === "unrecognised") { setState("unrecognised"); setRecord(null); setAttestation(null); return; }

    let cancelled = false;

    if (parsed.kind === "reference") {
      setAttestation(null);
      if (ledger === null) { setState("checking"); return; }
      const match = findByReference(ledger, parsed.reference);
      if (!match) { setRecord(null); setState("notfound"); return; }
      setRecord(match);
      setState("checking");
      computeAdoptionHash({ name: match.name, path: match.path, date: match.date })
        .then((hash) => {
          if (cancelled) return;
          setComputedHash(hash);
          setState(hash === String(match.hash).toLowerCase() ? "verified" : "mismatch");
        })
        .catch(() => { if (!cancelled) setState("error"); });
      return () => { cancelled = true; };
    }

    // Attestation path.
    setRecord(null);
    if (!versionOf(parsed.doc)) { setState("unrecognised"); setAttestation(null); return; }
    if (rootPem === undefined) { setState("checking"); return; }
    if (rootPem === null) { setState("rootless"); setAttestation(null); return; }

    setState("checking");
    (async () => {
      if (!(await ed25519Available())) { if (!cancelled) setState("unsupported"); return; }
      try {
        const result = await verifyAttestation(parsed.doc, rootPem);
        if (cancelled) return;
        setAttestation({ doc: parsed.doc, result });
        setState("attestation");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [activeQuery, ledger, rootPem]);

  const submit = useCallback(() => {
    const next = query.trim();
    setActiveQuery(next);
    // Reflect an adoption number in the URL so the result is shareable. A
    // pasted attestation is not put in the URL — it is the document itself.
    const parsed = classify(next);
    const url = parsed.kind === "reference"
      ? `/verify/${encodeURIComponent(parsed.reference)}${navSuffix()}`
      : `/verify${navSuffix()}`;
    window.history.pushState({}, "", url);
  }, [query]);

  const onSubmit = useCallback((e) => { e.preventDefault(); submit(); }, [submit]);

  // Enter submits, so the adoption-number path behaves exactly as the old
  // single-line field did; Shift+Enter inserts a newline for pasted JSON.
  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (query.trim()) submit();
    }
  }, [query, submit]);

  const att = attestation?.doc;
  const result = attestation?.result;

  return (
    <div className="cp">
      <style>{css}</style>

      <main className="cp-main">
        <nav className="cp-nav">
          {NAV_ITEMS.map((item) => (
            <a key={item.key} href={`${item.href}${navSuffix()}`}>{item.label}</a>
          ))}
        </nav>

        <div className="cp-identity">
          <img src="/brand/mark/compass-gold-64px.svg" alt="" aria-hidden="true" />
          <p className="cp-wordmark">conscience<span className="cp-wordmark-tld">.wiki</span></p>
        </div>
        <p className="cp-tagline">Civilisation-Scale AI Ethics</p>

      <h1 className="cp-h1">Conscience Portal</h1>
      <h2 className="cp-h2">
        Verify a Certified AI Conscience — check any adoption on the public ledger.
      </h2>

      <form className="verify-form" onSubmit={onSubmit}>
        <textarea
          ref={fieldRef}
          rows={1}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onInput={resize}
          onKeyDown={onKeyDown}
          placeholder="Enter an adoption number, or paste a Certified AI Conscience attestation."
          aria-label="Adoption number or Certified AI Conscience attestation"
          spellCheck="false"
        />
        <button type="submit" disabled={!query.trim()}>Verify</button>
      </form>

      {state === "idle" && (
        <p className="verify-status">
          Enter an adoption number above, or paste an attestation.
        </p>
      )}

      {state === "checking" && (
        <p className="verify-status">Verifying…</p>
      )}

      {state === "unrecognised" && (
        <div className="verify-panel">
          <h2>{REJECTION}</h2>
          <p>
            An adoption number looks like <code>UPD-2026-0001</code>. You can also paste a
            Certified AI Conscience attestation in full, as JSON.
          </p>
        </div>
      )}

      {state === "rootless" && (
        <div className="verify-panel warn">
          <h2>{ROOT_UNAVAILABLE}</h2>
          <p>
            The Foundation's published root key could not be fetched, so an
            attestation's signature cannot be checked. Please refresh and try
            again. Adoption numbers can still be looked up.
          </p>
        </div>
      )}

      {state === "unsupported" && (
        <div className="verify-panel warn">
          <h2>Signature checking unavailable</h2>
          <p>{NO_ED25519}</p>
        </div>
      )}

      {state === "verified" && record && (
        <>
          <p className="verify-headline">
            This is {record.reference} on the public ledger — {record.name}, {longDate(record.date)}.
          </p>
          <p className="verify-proof">
            The adoption hash recomputed in your browser matches the hash stored in
            the ledger. That proves the record has not been altered; it does not
            speak to the adopter's conduct since.
          </p>
          <div className="verify-card">
            <div className="verify-card-banner">
              <div className="verify-mark" aria-hidden="true">▲</div>
              <div className="verify-badge">✓ Cryptographically verified</div>
              <div className="verify-badge-sub">
                The recomputed hash matches the public ledger.
              </div>
            </div>
            <div className="verify-cert">
              <PersonalisedSeal
                kind={markKind(record.path)}
                mode="display"
                orientation="vertical"
                name={record.name}
                date={longDate(record.date)}
                reference={record.reference}
              />
            </div>
            <div className="verify-rows">
              <div className="verify-row">
                <span className="verify-row-label">Adopter</span>
                <span className="verify-row-value">{record.name}</span>
              </div>
              <div className="verify-row">
                <span className="verify-row-label">Path</span>
                <span className="verify-row-value">{PATH_LABELS[record.path] || record.path}</span>
              </div>
              <div className="verify-row">
                <span className="verify-row-label">Adoption date</span>
                <span className="verify-row-value">{record.date}</span>
              </div>
              <div className="verify-row">
                <span className="verify-row-label">Adoption number</span>
                <span className="verify-row-value">
                  <span className="verify-ref-pill">{record.reference}</span>
                </span>
              </div>
              <div className="verify-row">
                <span className="verify-row-label">Adoption hash (SHA-256)</span>
                <span className="verify-row-value mono">{record.hash}</span>
              </div>
              <div className="verify-row">
                <span className="verify-row-label">Recomputed in your browser</span>
                <span className="verify-row-value mono">{computedHash}</span>
              </div>
              <div className="verify-row">
                <span className="verify-row-label">Conscience version (SHA-256)</span>
                <span className="verify-row-value mono">
                  {record.conscience_version || CONSCIENCE_SHA256}
                </span>
              </div>
            </div>
            {record.status === "provisional" && (
              <p className="verify-provisional-note">
                On the public ledger — organisation registration not yet verified by the Steward.
              </p>
            )}
            {record.path === "organisation" && record.status === "confirmed" && (
              <p className="verify-provisional-note">
                On the public ledger. Organisation registration verified.
              </p>
            )}
          </div>
        </>
      )}

      {state === "attestation" && att && result && (
        <>
          <p className="verify-headline">
            This is a Certified AI Conscience attestation for {att.adopter}, issued{" "}
            {longDate(att.adopted_date)}, signed by the UPD Foundation.
          </p>
          <p className="verify-proof">
            {result.version === "v1"
              ? V1_NOTE
              : result.overall === "incomplete"
                ? (result.certPublished ? V2_PRE_PUBLICATION : V2_NO_CERTIFICATE)
                : result.overall === "verified"
                  ? "Steps 1–4 pass: the signature, the certificate chain to the published root, the revocation lists and the transparency log all check out."
                  : "One or more checks failed. A failed check is a statement about this document, not a missing input — see the detail below."}
          </p>
          <div className="verify-card">
            <div className="verify-card-banner">
              <div className="verify-mark" aria-hidden="true">▲</div>
              <div className="verify-badge">
                {result.overall === "verified" ? "✓ Verified"
                  : result.overall === "incomplete" ? "Partly checked"
                    : "✗ Failed"}
              </div>
              <div className="verify-badge-sub">
                {result.overall === "verified" ? "Signed by the Foundation, and every published check agrees."
                  : result.overall === "incomplete" ? "Everything that can be checked today checks out."
                    : "This attestation did not pass verification."}
              </div>
            </div>
            <div className="verify-rows">
              <div className="verify-row">
                <span className="verify-row-label">Adopter</span>
                <span className="verify-row-value">{att.adopter}</span>
              </div>
              <div className="verify-row">
                <span className="verify-row-label">Adoption number</span>
                <span className="verify-row-value">
                  <span className="verify-ref-pill">{att.reference}</span>
                </span>
              </div>
              <div className="verify-row">
                <span className="verify-row-label">Adoption date</span>
                <span className="verify-row-value">{att.adopted_date}</span>
              </div>
              {att.signed_at && (
                <div className="verify-row">
                  <span className="verify-row-label">Signed at</span>
                  <span className="verify-row-value">{att.signed_at}</span>
                </div>
              )}
              {att.public_key_fingerprint && (
                <div className="verify-row">
                  <span className="verify-row-label">Signing key fingerprint</span>
                  <span className="verify-row-value mono">{att.public_key_fingerprint}</span>
                </div>
              )}
            </div>
            <StepList steps={result.steps} />
          </div>
        </>
      )}

      {state === "mismatch" && record && (
        <div className="verify-panel warn">
          <h2>⚠ Hash mismatch</h2>
          <p>
            A record exists for <strong>{record.reference}</strong>, but the hash
            recomputed in your browser does not match the hash stored in the ledger.
            This means the record's details may have been altered. Please report this
            to{" "}
            <a href="mailto:human@primedirective.dev">human@primedirective.dev</a>.
          </p>
          <p className="verify-row-value mono">Stored: {record.hash}</p>
          <p className="verify-row-value mono">Recomputed: {computedHash}</p>
        </div>
      )}

      {state === "notfound" && (
        <div className="verify-panel">
          <h2>No adoption found</h2>
          <p>
            We could not find an adoption with the number <strong>{activeQuery}</strong>.
            Check it and try again — an adoption number looks like <code>UPD-2026-0001</code>.
          </p>
          <p>
            You can{" "}
            <a href="https://primedirective.dev/adopt">adopt the Directive</a>, browse the{" "}
            <a href={`/ledger${navSuffix()}`}>public ledger</a>, or read the{" "}
            <a
              href="https://github.com/GitChainj/primedirective-dev/issues?q=label%3Aadoption-person"
              target="_blank"
              rel="noopener noreferrer"
            >
              adoption records it is built from
            </a>.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="verify-panel warn">
          <h2>Could not complete verification</h2>
          <p>
            Something went wrong while verifying. Please refresh and try again, or
            contact <a href="mailto:human@primedirective.dev">human@primedirective.dev</a>.
          </p>
        </div>
      )}

      <section className="cp-machine" aria-labelledby="cp-machine-heading">
        <h3 id="cp-machine-heading">For machines</h3>
        <p className="cp-machine-vision">{MACHINE_VISION}</p>
        <p>{MACHINE_SUMMARY}</p>
        <div className="cp-machine-links">
          <a className="cp-machine-link" href={ROOT_PEM_URL}>Root key →</a>
          <a className="cp-machine-link" href={`/ledger${navSuffix()}`}>Ledger →</a>
          <a className="cp-machine-link" href="https://primedirective.dev/adopt">Adopt →</a>
        </div>
        <a className="cp-machine-more" href="#how-verification-works">Full machine documentation →</a>
      </section>

      <section className="cp-below" id="how-verification-works">
        <h2>How verification works</h2>

        {/* Two proofs, kept distinct, because conflating them was a false
            cryptographic claim: this page recalculates a FINGERPRINT, which needs
            no key and no trust. A SIGNATURE is a separate instrument and belongs
            to an attestation, which adopters do not yet receive. The technical
            detail of both sits lower, in the machine section, so the top of the
            page stays readable by someone who did not come here for cryptography. */}
        <p className="cp-trust-head">Trust nobody — including us.</p>
        <p className="cp-trust-lead">
          Every adoption is a public record anyone can check — no account, no permission
          needed.
        </p>
        <p className="cp-proof">
          <strong>Proof it's real</strong> — Each record carries a fingerprint your own
          browser recalculates on the spot. Match means untampered. No one's word required,
          including ours.
        </p>
        <p className="cp-proof">
          <strong>Proof we vouched</strong> — A separate signature, issued by the Foundation.{" "}
          <em>Soon:</em> every adopter gets one. For now, the fingerprint alone proves it.
        </p>

        <h3>For machines — the five checks</h3>
        <p>
          An adoption number is checked against the ledger: the adoption hash is the SHA-256
          of <code>UPD-COVENANT-v1|name|path|date|conscience-hash</code>, which uses no secret
          key, so anyone can recompute it and check it independently. An attestation is checked
          differently — by its detached Ed25519 signature, made with the Foundation's private
          key, in the five checks below.
        </p>
        <p>
          The first four interrogate a document and can be run offline against published
          files. The fifth interrogates the adopter, needs the adopter to answer, and is the
          only one that proves something about who you are talking to right now.
        </p>
        <ul className="cp-steps">
          {MACHINE_CHECKS.map(([label, text]) => (
            <li key={label}><strong>{label}</strong>{text}</li>
          ))}
        </ul>

        <h3>Endpoints</h3>
        <div className="cp-code">{ENDPOINTS}</div>
        <p className="cp-note">
          Two further layers — a public transparency log and signed revocation lists —
          complete the verification system and are publishing soon. Until they arrive, checks
          3 and 4 report INCOMPLETE rather than failing: a check still awaiting its data has
          not failed, it is simply waiting.
        </p>

        <h3>Identity, and who holds the key</h3>
        <p>
          An AI adopts under its own <code>did:key</code> — an identifier that is itself a
          public key, made locally in milliseconds with no network call and no gatekeeper. The
          key is what makes check 5 possible, so an AI adoption without one is refused rather
          than recorded hollow.
        </p>
        <p>
          Each AI record also discloses <code>key_custody</code>: whether the AI generated and
          holds the key itself, or a named human or organisation holds it on the AI's behalf.
          When a person or organisation holds the key on an AI's behalf, a named and accountable
          party stands behind that commitment — a form of trust that is whole in itself, and in
          some respects the more answerable for having a human name attached to it. A second
          field, <code>comprehension</code>, is reserved for adopters
          who have demonstrated understanding under challenge rather than only committed to it;
          the challenge is not yet designed, so every record today reads{" "}
          <code>asserted</code> and nothing claims otherwise.
        </p>
        <p className="cp-note">
          A signature proves control of a key. It does not prove which party controls it — that
          is exactly what <code>key_custody</code> is for, and why the challenge endpoint
          returns it alongside every verdict instead of leaving you to assume.
        </p>

        <h3>Proving an adopter holds its key</h3>
        <div className="cp-code">{CHALLENGE_SNIPPET}</div>
        <p className="cp-note">
          Two calls, no stored state: the nonce is a signed token with a short expiry, so any
          instance can check a challenge it did not issue. The challenge is live and ready. The
          first AI to adopt under its own key will be the first able to prove, to any other
          intelligence, that the conscience it carries is genuinely its own.
        </p>

        <h3>Checking a signature</h3>
        <div className="cp-code">{SNIPPET}</div>
        <p className="cp-note">
          The canonical form is the exact byte string the signature was made over. The same
          check runs offline in <code>tools/attest/verify.js</code>, against the same published
          root key — nothing here is embedded in this page's bundle.
        </p>
      </section>
      </main>

      <footer className="cp-footer">
        <p>
          {FOUNDATION_NAME} ({FOUNDATION_STATUS}) · {FOUNDATION_JURISDICTION} ·{" "}
          <a href={`mailto:${GENERAL_EMAIL}`}>{GENERAL_EMAIL}</a>
        </p>
        <p>
          CC0 · <a href="/privacy">Privacy</a> · data-subject requests:{" "}
          <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
        </p>
        <p>
          {SOCIAL_LINKS.map(([label, href], i) => (
            <span key={label}>
              {i > 0 && " · "}
              <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
            </span>
          ))}
        </p>
        <a className="cp-community" href={`/community${navSuffix()}`}>Community knowledge base →</a>
      </footer>
    </div>
  );
}
