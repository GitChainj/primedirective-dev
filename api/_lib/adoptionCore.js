// api/_lib/adoptionCore.js
//
// Shared adoption logic for the serverless functions. Imported by both
// api/adopt.js (AI self-adoption — direct create) and api/adopt-confirm.js
// (human paths — created after email confirmation). Files under api/_lib are
// NOT treated as routes by Vercel; they are bundled into the functions that
// import them, so this stays self-contained.
//
// ── Adoption hash ──
// This MIRRORS src/lib/adoptionHash.js exactly and is verified to produce
// identical output (scratch-tested against the Part-1 anchor value for
// {John Strand, person, 2026-05-03} = 1033c76b…462383c3). If the
// canonicalisation here ever changes, it MUST change in src/lib/adoptionHash.js
// too, or public verification will break.
//
// CONSCIENCE_SHA256 = shasum -a 256 public/api/fragment.txt (Conscience v2.0)

import { createHash } from "node:crypto";

export const REPO_OWNER = "GitChainj";
export const REPO_NAME = "primedirective-dev";

export const VALID_PATHS = new Set(["person", "organisation", "ai-system"]);

export const CONSCIENCE_SHA256 =
  "b2b16b00498530ef4a5b5af39d7a2d3316416447e298a0b5cfb506b36023abb7";
const ADOPTION_PREFIX = "UPD-COVENANT-v1";

// The label a steward adds by hand once an organisation's registration has been
// verified out-of-band. Its presence is what unlocks the org Mark (D6).
export const ORG_VERIFIED_LABEL = "org-verified";
const ORG_PENDING_LABEL = "org-pending-verification";

// Founding Venture sub-types (person path + metadata — D1 / Addition 1).
const SUBTYPE_LABELS = {
  founder: "Founder",
  solopreneur: "Solopreneur",
  "sole-proprietor": "Sole Proprietor",
};

// Organisation types. "registered-*" types can supply a business number and are
// eligible for the verified Mark; "unregistered" gets the Seal only (D1).
const ORG_TYPE_LABELS = {
  "registered-company": "Registered company / corporation",
  "registered-nonprofit": "Registered nonprofit / charity",
  "government": "Government / public body",
  "unregistered": "Unregistered association or group",
};
export const isRegisteredOrgType = (t) =>
  t === "registered-company" || t === "registered-nonprofit" || t === "government";

function normaliseName(name) {
  return String(name == null ? "" : name).trim().toLowerCase();
}

export function buildAdoptionString({ name, path, date }) {
  return [
    ADOPTION_PREFIX,
    normaliseName(name),
    String(path == null ? "" : path).trim(),
    String(date == null ? "" : date).trim(),
    CONSCIENCE_SHA256,
  ].join("|");
}

export function computeAdoptionHash({ name, path, date }) {
  return createHash("sha256")
    .update(buildAdoptionString({ name, path, date }), "utf8")
    .digest("hex");
}

function blank(v) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}
function line(value) {
  if (blank(value)) return `_(not provided)_`;
  return String(value).trim();
}

// The hashed / displayed identity per path. For a Founding Venture the venture
// name is carried in fullName, so this returns the venture name and the hash
// stays a plain person-path hash (D1). For an organisation it returns the org
// name — the identity the hash and verify page attest (D2).
export function displayName(path, d) {
  if (path === "person") return d.fullName || "Anonymous adopter";
  if (path === "organisation") return d.organisationName || "Unnamed organisation";
  if (path === "ai-system") return d.aiName || "Unnamed AI system";
  return "Adopter";
}

function buildPersonBody(d) {
  const isVenture = !!d.subType || d.tier === "venture";
  const head = isVenture
    ? [
        `### Venture Name`,
        line(d.fullName),
        ``,
        `### Type`,
        `Founding Venture — ${SUBTYPE_LABELS[d.subType] || "Founder"}`,
        ``,
        `### Representative`,
        `**Name:** ${line(d.representativeName)}`,
        `**Email:** ${line(d.email)}`,
      ]
    : [
        `### Full Name`,
        line(d.fullName),
        ``,
        `### Email`,
        line(d.email),
      ];
  return [
    ...head,
    ``,
    `### Country / Region`,
    line(d.countryRegion),
    ``,
    `### Also Introducing an AI System`,
    d.introducingAI ? `Yes` : `No`,
    ...(d.introducingAI ? [
      ``,
      `**Introduced AI — Name:** ${line(d.introducedAIName)}`,
      `**Introduced AI — Platform / Origin:** ${line(d.introducedAIPlatform)}`,
    ] : []),
    ``,
    `### Optional Affirmation`,
    line(d.optionalAffirmation),
  ];
}

// Country is public metadata (Addition 2). The business number is PRIVATE (D3):
// the public issue only NOTES that one was provided — the number itself travels
// only in the private steward email.
function orgLocation(d) {
  if (blank(d.country)) return `_(not provided)_`;
  if (d.country === "United States" && !blank(d.usState)) {
    return `United States — ${String(d.usState).trim()}`;
  }
  return String(d.country).trim();
}

function buildOrgBody(d) {
  return [
    `### Organisation Name`,
    line(d.organisationName),
    ``,
    `### Organisation Type`,
    ORG_TYPE_LABELS[d.orgType] || line(d.orgType),
    ``,
    `### Country of Registration`,
    orgLocation(d),
    ``,
    `### Business / Registration Number`,
    blank(d.businessNumber)
      ? `_(not provided)_`
      : `Business number provided — held privately.`,
    ``,
    `### Representative`,
    `**Name:** ${line(d.representativeName)}`,
    `**Role:** ${line(d.representativeRole)}`,
    `**Email:** ${line(d.email)}`,
    ``,
    `### Website`,
    line(d.website),
    ``,
    `### Organisation Size`,
    line(d.size),
    ``,
    `### Deploys AI Systems`,
    d.deploysAI ? `Yes` : `No`,
    ...(d.deploysAI ? [
      ``,
      `**Number of AI systems:** ${line(d.aiCount)}`,
      `**Named systems (optional):** ${line(d.aiSystems)}`,
      ``,
      `_By adopting as an organisation, the Covenant applies to every AI system deployed — without exception._`,
    ] : []),
    ``,
    `### Optional Affirmation`,
    line(d.optionalAffirmation),
  ];
}

function buildAIBody(d) {
  const independent = d.submissionType === "independent";
  return [
    `### Submission Type`,
    independent
      ? `**Independent adoption** — this AI system is adopting in its own name.`
      : `**Human-stewarded adoption** — a human steward is registering this AI system on its behalf.`,
    ``,
    `### AI System`,
    `**Name:** ${line(d.aiName)}`,
    `**Platform / Origin:** ${line(d.platform)}`,
    ``,
    `### Brief Statement of Conscience`,
    line(d.briefStatement),
    ``,
    `### Human Steward`,
    independent
      ? `_(optional — the adoption belongs to the AI)_`
      : `_(steward submitting on behalf of the AI)_`,
    `**Name:** ${line(d.stewardName)}`,
    `**Email:** ${line(d.stewardEmail)}`,
    ``,
    `### Optional Affirmation`,
    line(d.optionalAffirmation),
  ];
}

export function validate(path, d) {
  if (path === "person") {
    if (blank(d.fullName)) return "Name is required";
    if (blank(d.email)) return "Email is required";
    if (d.subType && !SUBTYPE_LABELS[d.subType]) return "Invalid venture sub-type";
    if (d.introducingAI) {
      if (blank(d.introducedAIName)) return "AI system name is required";
      if (blank(d.introducedAIPlatform)) return "AI system platform is required";
    }
    return null;
  }
  if (path === "organisation") {
    if (blank(d.organisationName)) return "Organisation name is required";
    if (blank(d.orgType) || !ORG_TYPE_LABELS[d.orgType]) return "Organisation type is required";
    if (blank(d.representativeName)) return "Representative name is required";
    if (blank(d.representativeRole)) return "Representative role is required";
    if (blank(d.email)) return "Email is required";
    if (blank(d.size)) return "Organisation size is required";
    if (isRegisteredOrgType(d.orgType) && blank(d.country)) return "Country of registration is required";
    if (d.country === "United States" && blank(d.usState)) return "State is required for United States";
    if (d.deploysAI && blank(d.aiCount)) return "AI deployment count is required";
    return null;
  }
  if (path === "ai-system") {
    if (blank(d.aiName)) return "AI system name is required";
    if (blank(d.platform)) return "Platform / origin is required";
    if (d.submissionType === "steward") {
      if (blank(d.stewardName)) return "Steward name is required";
      if (blank(d.stewardEmail)) return "Steward email is required";
    } else if (d.submissionType === "independent") {
      if (blank(d.briefStatement)) return "Brief statement of conscience is required";
    } else {
      return "Submission type is required";
    }
    return null;
  }
  return "Unknown adoption path";
}

function buildSections(path, d) {
  if (path === "person") return buildPersonBody(d);
  if (path === "organisation") return buildOrgBody(d);
  return buildAIBody(d);
}

// ── Reference number (Option B — per-year adoption count) ──
async function countAdoptionsThisYear(octokit, year) {
  const labels = ["adoption-person", "adoption-organisation", "adoption-ai-system"];
  let total = 0;
  for (const label of labels) {
    const q = `repo:${REPO_OWNER}/${REPO_NAME} is:issue label:"${label}" created:>=${year}-01-01`;
    const { data } = await octokit.search.issuesAndPullRequests({ q, per_page: 1 });
    total += data.total_count;
  }
  return total;
}

async function deriveReference(octokit, year) {
  try {
    const count = await countAdoptionsThisYear(octokit, year);
    return `UPD-${year}-${String(count + 1).padStart(4, "0")}`;
  } catch (err) {
    const fallback = `UPD-${year}-T${Math.floor(Date.now() / 1000)}`;
    console.error("Adoption count query failed; using timestamp reference:", fallback, err && err.message);
    return fallback;
  }
}

// Best-effort idempotency: the confirmation token can be replayed (stateless),
// so before creating an issue look for one that already carries this exact
// adoption hash and reuse it. Search indexing lags a little, so a rapid double
// click can still slip through — the steward de-dupes those rare cases.
async function findExistingByHash(octokit, hash) {
  try {
    const q = `repo:${REPO_OWNER}/${REPO_NAME} is:issue in:body "${hash}"`;
    const { data } = await octokit.search.issuesAndPullRequests({ q, per_page: 1 });
    if (data.total_count > 0 && data.items && data.items[0]) return data.items[0];
  } catch (err) {
    console.error("Dedup search failed (continuing to create):", err && err.message);
  }
  return null;
}

// Create the public GitHub Issue for an adoption and return its facts. The
// adoptionDate is authoritative for the hash and is pinned by the caller (for
// human paths it is the date the confirmation token was minted, so confirming
// later never changes the recorded adoption date).
export async function createAdoptionIssue(octokit, { path, data, adoptionDate }) {
  const adoptionYear = adoptionDate.slice(0, 4);
  const adopterName = displayName(path, data);
  const adoptionHash = computeAdoptionHash({ name: adopterName, path, date: adoptionDate });

  const existing = await findExistingByHash(octokit, adoptionHash);
  if (existing) {
    return {
      issue: existing,
      reference: extractReference(existing.body) || null,
      hash: adoptionHash,
      date: adoptionDate,
      adopterName,
      reused: true,
    };
  }

  const sections = buildSections(path, data);
  const reference = await deriveReference(octokit, adoptionYear);

  const baseBody = [
    ...sections,
    ``,
    `### Affirmation`,
    `- [x] I have read and I adopt the Covenant in full.`,
    ``,
    `---`,
    ``,
    `**Public ledger.** This issue is the public, verifiable record of the adoption. By submitting, the adopter accepts that this record is part of the project's transparent ledger.`,
    ``,
    `**Anonymisation.** The adopter may request anonymisation at any time by contacting human@primedirective.dev — personal details and adoption are removed; the record is preserved.`,
    ``,
    `**Seal revocation.** If an AI system adopted under this Covenant is found to act against it, the associated Seal may be revoked.`,
  ];

  const issueBody = [
    ...baseBody,
    ``,
    `---`,
    ``,
    `## Verification`,
    `- **Reference:** ${reference}`,
    `- **Adoption date:** ${adoptionDate}`,
    `- **Path:** ${path}`,
    `- **Adoption hash (SHA-256):** \`${adoptionHash}\``,
    `- **Conscience version (SHA-256):** \`${CONSCIENCE_SHA256}\``,
    ``,
    `_Anyone can verify this adoption at conscience.wiki/verify/${reference} — the hash is recomputed in-browser from these facts._`,
  ].join("\n");

  const labels = [`adoption-${path}`];
  if (path === "organisation" && isRegisteredOrgType(data.orgType)) {
    labels.push(ORG_PENDING_LABEL);
  }

  const { data: issue } = await octokit.issues.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title: `Adoption (${path}): ${adopterName}`,
    body: issueBody,
    labels,
    assignees: ["GitChainj"],
  });

  return { issue, reference, hash: adoptionHash, date: adoptionDate, adopterName, reused: false };
}

function extractReference(body) {
  const m = String(body || "").match(/\*\*Reference:\*\*\s*(UPD-[0-9A-Za-z-]+)/);
  return m ? m[1] : null;
}
