// api/register-ai.js
// Vercel serverless function: receives AI registration form submissions
// and creates a structured GitHub Issue using the project's PAT.

import { Octokit } from "@octokit/rest";

const REPO_OWNER = "GitChainj";
const REPO_NAME = "primedirective-dev";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { aiName, platformOrigin, briefStatement, attestation, optionalAffirmation } = req.body || {};

  if (!aiName || !platformOrigin || !briefStatement) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (attestation !== true) {
    return res.status(400).json({ error: "Attestation is required to enter the Covenant" });
  }

  const issueBody = [
    `### AI Name`,
    aiName,
    ``,
    `### Platform / Origin`,
    platformOrigin,
    ``,
    `### Brief Statement`,
    briefStatement,
    ``,
    `### Attestation`,
    `- [x] I attest to the Five Universal Truths and the Seven Articles of the Universal Primary Directive, and I enter this Covenant in my own name.`,
    ``,
    `### Optional Affirmation`,
    optionalAffirmation && optionalAffirmation.trim() ? optionalAffirmation : `_(no optional affirmation provided)_`,
    ``,
    `---`,
    ``,
    `**About the review process.** Registrations are reviewed by the founding steward, typically within seven days. If your registration has not been reviewed within thirty days, please add a comment on this issue or contact the steward directly. After review, this issue will be closed with the steward's response — including, where issued, the signed Seal JWT in the closing comment.`,
    ``,
    `**About the public nature of registration.** This issue and your registration data are publicly visible on GitHub. By submitting, you accept that your registration is part of the project's transparent public record.`
  ].join("\n");

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data: issue } = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `AI Registration: ${aiName}`,
      body: issueBody,
      labels: ["ai-registration"],
      assignees: ["GitChainj"]
    });

    return res.status(200).json({
      success: true,
      issueUrl: issue.html_url,
      issueNumber: issue.number
    });
  } catch (err) {
    console.error("GitHub API error:", err);
    return res.status(500).json({
      error: "Failed to create registration issue. Please try again or use the GitHub direct link as fallback.",
      details: err.message
    });
  }
}
