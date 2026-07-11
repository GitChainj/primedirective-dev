// api/adopt-status.js (D6).
//
// Reports whether an organisation adoption has been verified by a steward — the
// gate for the organisation Mark. Verification is expressed as the org-verified
// label on the ledger issue, which the steward adds by hand after checking the
// business number against the public registry. The confirmation page polls this.
// (The auto-push webhook is deferred to a follow-up per D6.)

import { Octokit } from "@octokit/rest";
import { REPO_OWNER, REPO_NAME, ORG_VERIFIED_LABEL } from "./_lib/adoptionCore.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const issueNumber = parseInt(req.query.issue, 10);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    return res.status(400).json({ error: "A valid issue number is required" });
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data: issue } = await octokit.issues.get({
      owner: REPO_OWNER, repo: REPO_NAME, issue_number: issueNumber,
    });
    const labels = (issue.labels || []).map((l) => (typeof l === "string" ? l : l.name));
    const verified = labels.includes(ORG_VERIFIED_LABEL);
    return res.status(200).json({ verified, state: issue.state });
  } catch (err) {
    console.error("adopt-status error:", err);
    return res.status(500).json({ error: "Could not read verification status." });
  }
}
