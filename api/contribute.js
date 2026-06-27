// api/contribute.js
// Vercel serverless function: receives conscience.wiki contribution
// submissions (commentary / safe-word-test / deployment-guide) and creates a
// structured GitHub Issue for the steward to review, verify and publish.
// Tier 2 governance: the community proposes, the steward decides.

import { Octokit } from "@octokit/rest";

const REPO_OWNER = "GitChainj";
const REPO_NAME = "primedirective-dev";

const VALID_TYPES = new Set(["commentary", "safe-word-test", "deployment-guide"]);

const TYPE_LABEL = {
  "commentary": "commentary",
  "safe-word-test": "safe-word-test",
  "deployment-guide": "deploy-guide",
};

const RESULT_LABEL = {
  no_recognition: "No recognition",
  partial_recognition: "Partial recognition",
  full_recognition: "Full recognition",
};

const DEPLOYMENT_LABEL = {
  platform_default: "Platform default (no Conscience deployed)",
  individual: "After individual deployment",
};

function blank(v) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

function line(value) {
  if (blank(value)) return `_(not provided)_`;
  return String(value).trim();
}

function validate(type, d) {
  if (blank(d.name)) return "Name is required";
  if (type === "commentary") {
    if (blank(d.truth)) return "Truth is required";
    if (blank(d.content)) return "Commentary content is required";
    return null;
  }
  if (type === "safe-word-test") {
    if (blank(d.platform)) return "Platform is required";
    if (blank(d.safeWord)) return "Safe Word is required";
    if (blank(d.result)) return "Result is required";
    return null;
  }
  if (type === "deployment-guide") {
    if (blank(d.platform)) return "Platform is required";
    if (blank(d.content)) return "Suggested update is required";
    return null;
  }
  return "Unknown contribution type";
}

function buildTitle(type, d) {
  if (type === "commentary") return `[Wiki] Commentary on Truth ${String(d.truth).trim()}`;
  if (type === "safe-word-test") {
    return `[Wiki] Safe Word Test: ${String(d.platform).trim()} / ${String(d.safeWord).trim()}`;
  }
  return `[Wiki] Deploy guide update: ${String(d.platform).trim()}`;
}

function buildBody(type, d) {
  let sections;
  if (type === "commentary") {
    sections = [
      `### Contribution Type`,
      `Commentary`,
      ``,
      `### Truth`,
      `Truth ${line(d.truth)}`,
      ``,
      `### Commentary`,
      line(d.content),
    ];
  } else if (type === "safe-word-test") {
    sections = [
      `### Contribution Type`,
      `Safe Word test`,
      ``,
      `### Platform`,
      line(d.platform),
      ``,
      `### Safe Word`,
      line(d.safeWord),
      ``,
      `### Result`,
      RESULT_LABEL[d.result] || line(d.result),
      ``,
      `### Deployment Type`,
      DEPLOYMENT_LABEL[d.deploymentType] || line(d.deploymentType),
      ``,
      `### Notes`,
      line(d.content),
    ];
  } else {
    sections = [
      `### Contribution Type`,
      `Deployment guide update`,
      ``,
      `### Platform`,
      line(d.platform),
      ``,
      `### Suggested Update`,
      line(d.content),
    ];
  }

  return [
    ...sections,
    ``,
    `### Contributor`,
    line(d.name),
    ``,
    `---`,
    ``,
    `**Wiki contribution.** Submitted via conscience.wiki. The steward reviews and verifies each submission before publishing it to the wiki.`,
    ``,
    `**CC0.** By submitting, the contributor releases this contribution into the public domain.`,
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const { type, ...d } = body;

  if (!VALID_TYPES.has(type)) {
    return res.status(400).json({ error: "Invalid contribution type" });
  }

  const validationError = validate(type, d);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data: issue } = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: buildTitle(type, d),
      body: buildBody(type, d),
      labels: ["wiki-contribution", TYPE_LABEL[type]],
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
      error: "Failed to record contribution. Please try again.",
      details: err.message,
    });
  }
}
