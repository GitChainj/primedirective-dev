// api/adopt.js — step 1 of adoption.
//
// AI self-adoption (Article VI) keeps its original one-step flow: the ledger
// issue is created immediately, because an independent AI adoption may have no
// email to confirm through.
//
// Human paths (Individual / Founding Venture → person, Organisation) use the
// two-step confirmation flow (D4): this endpoint validates, pins the adoption
// date, mints a 24h HMAC token carrying the submission, and emails a
// confirmation link. No ledger issue is created until api/adopt-confirm.js.

import { Octokit } from "@octokit/rest";
import {
  VALID_PATHS, CONSCIENCE_SHA256, validate, createAdoptionIssue,
} from "./_lib/adoptionCore.js";
import { signToken } from "./_lib/adoptToken.js";
import { sendConfirmationEmail, SITE_URL } from "./_lib/email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const { path, affirmation, tier, ...data } = body;

  if (!VALID_PATHS.has(path)) {
    return res.status(400).json({ error: "Invalid adoption path" });
  }
  if (affirmation !== true) {
    return res.status(400).json({ error: "Affirmation is required to enter the Covenant" });
  }
  const validationError = validate(path, data);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // The server's UTC date is authoritative and is pinned here so that, for the
  // two-step flow, confirming later never changes the recorded adoption date.
  const adoptionDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  // ── AI self-adoption: create the ledger issue now (unchanged behaviour) ──
  if (path === "ai-system") {
    try {
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      const { issue, reference, hash, date } = await createAdoptionIssue(octokit, {
        path, data, adoptionDate,
      });
      return res.status(200).json({
        success: true,
        issueUrl: issue.html_url,
        issueNumber: issue.number,
        reference,
        hash,
        conscienceVersion: CONSCIENCE_SHA256,
        date,
      });
    } catch (err) {
      console.error("GitHub API error:", err);
      return res.status(500).json({
        error: "Failed to record adoption. Please try again.",
        details: err.message,
      });
    }
  }

  // ── Human paths: mint token + send confirmation email ──
  try {
    const token = signToken({ path, date: adoptionDate, tier: tier || null, data });
    const confirmUrl = `${SITE_URL}/adopt/confirm?token=${encodeURIComponent(token)}`;
    await sendConfirmationEmail({
      to: data.email,
      confirmUrl,
      adopterName: path === "organisation" ? data.organisationName : data.fullName,
    });
    return res.status(200).json({ pending: true, email: data.email });
  } catch (err) {
    console.error("Confirmation email error:", err);
    return res.status(500).json({
      error: "Could not send the confirmation email. Please try again.",
      details: err.message,
    });
  }
}
