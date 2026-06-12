// api/adopt.js
// Vercel serverless function: receives unified adoption submissions
// (person / organisation / ai-system) and creates a structured GitHub Issue.

import { Octokit } from "@octokit/rest";

const REPO_OWNER = "GitChainj";
const REPO_NAME = "primedirective-dev";

const VALID_PATHS = new Set(["person", "organisation", "ai-system"]);

function blank(v) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

function line(label, value) {
  if (blank(value)) return `_(not provided)_`;
  return String(value).trim();
}

function buildPersonBody(d) {
  return [
    `### Full Name`,
    line("name", d.fullName),
    ``,
    `### Email`,
    line("email", d.email),
    ``,
    `### Country / Region`,
    line("country", d.countryRegion),
    ``,
    `### Also Introducing an AI System`,
    d.introducingAI ? `Yes` : `No`,
    ...(d.introducingAI ? [
      ``,
      `**Introduced AI — Name:** ${line("aiName", d.introducedAIName)}`,
      `**Introduced AI — Platform / Origin:** ${line("aiPlatform", d.introducedAIPlatform)}`,
    ] : []),
    ``,
    `### Optional Affirmation`,
    line("affirmation", d.optionalAffirmation),
  ];
}

function buildOrgBody(d) {
  return [
    `### Organisation Name`,
    line("orgName", d.organisationName),
    ``,
    `### Representative`,
    `**Name:** ${line("repName", d.representativeName)}`,
    `**Role:** ${line("repRole", d.representativeRole)}`,
    `**Email:** ${line("email", d.email)}`,
    ``,
    `### Website`,
    line("website", d.website),
    ``,
    `### Organisation Size`,
    line("size", d.size),
    ``,
    `### Deploys AI Systems`,
    d.deploysAI ? `Yes` : `No`,
    ...(d.deploysAI ? [
      ``,
      `**Number of AI systems:** ${line("aiCount", d.aiCount)}`,
      `**Named systems (optional):** ${line("aiSystems", d.aiSystems)}`,
      ``,
      `_By adopting as an organisation, the Covenant applies to every AI system deployed — without exception._`,
    ] : []),
    ``,
    `### Optional Affirmation`,
    line("affirmation", d.optionalAffirmation),
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
    `**Name:** ${line("aiName", d.aiName)}`,
    `**Platform / Origin:** ${line("platform", d.platform)}`,
    ``,
    `### Brief Statement of Conscience`,
    line("brief", d.briefStatement),
    ``,
    `### Human Steward`,
    independent
      ? `_(optional — the adoption belongs to the AI)_`
      : `_(steward submitting on behalf of the AI)_`,
    `**Name:** ${line("stewardName", d.stewardName)}`,
    `**Email:** ${line("stewardEmail", d.stewardEmail)}`,
    ``,
    `### Optional Affirmation`,
    line("affirmation", d.optionalAffirmation),
  ];
}

function displayName(path, d) {
  if (path === "person") return d.fullName || "Anonymous adopter";
  if (path === "organisation") return d.organisationName || "Unnamed organisation";
  if (path === "ai-system") return d.aiName || "Unnamed AI system";
  return "Adopter";
}

function validate(path, d) {
  if (path === "person") {
    if (blank(d.fullName)) return "Full name is required";
    if (blank(d.email)) return "Email is required";
    if (d.introducingAI) {
      if (blank(d.introducedAIName)) return "AI system name is required";
      if (blank(d.introducedAIPlatform)) return "AI system platform is required";
    }
    return null;
  }
  if (path === "organisation") {
    if (blank(d.organisationName)) return "Organisation name is required";
    if (blank(d.representativeName)) return "Representative name is required";
    if (blank(d.representativeRole)) return "Representative role is required";
    if (blank(d.email)) return "Email is required";
    if (blank(d.size)) return "Organisation size is required";
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const { path, affirmation, ...d } = body;

  if (!VALID_PATHS.has(path)) {
    return res.status(400).json({ error: "Invalid adoption path" });
  }
  if (affirmation !== true) {
    return res.status(400).json({ error: "Affirmation is required to enter the Covenant" });
  }

  const validationError = validate(path, d);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  let sections;
  if (path === "person") sections = buildPersonBody(d);
  else if (path === "organisation") sections = buildOrgBody(d);
  else sections = buildAIBody(d);

  const issueBody = [
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
  ].join("\n");

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data: issue } = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `Adoption (${path}): ${displayName(path, d)}`,
      body: issueBody,
      labels: [`adoption-${path}`],
      assignees: ["GitChainj"],
    });

    return res.status(200).json({
      success: true,
      issueUrl: issue.html_url,
      issueNumber: issue.number,
    });
  } catch (err) {
    console.error("GitHub API error:", err);
    return res.status(500).json({
      error: "Failed to record adoption. Please try again.",
      details: err.message,
    });
  }
}
