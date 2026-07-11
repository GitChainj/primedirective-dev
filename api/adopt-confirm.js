// api/adopt-confirm.js — step 2 of the human adoption flow (D4).
//
// Verifies the HMAC confirmation token, creates the public ledger issue (using
// the date/name pinned in the token, so the hash matches what it would have
// been at submit time), and — for a registered organisation — sends the private
// steward verification email with the business number and a direct registry
// link (D3 + Additions 2/3). Returns the display facts so the confirmation page
// can render the Seal/Mark and trigger the welcome email, on any device.

import { Octokit } from "@octokit/rest";
import {
  CONSCIENCE_SHA256, createAdoptionIssue, displayName, isRegisteredOrgType,
} from "./_lib/adoptionCore.js";
import { verifyToken } from "./_lib/adoptToken.js";
import { registryLink } from "./_lib/registries.js";
import { sendStewardEmail } from "./_lib/email.js";

const SUBTYPE_LABELS = {
  founder: "Founder", solopreneur: "Solopreneur", "sole-proprietor": "Sole Proprietor",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = (req.body && req.body.token) || "";
  let verified;
  try {
    verified = verifyToken(token);
  } catch (err) {
    console.error("Token verify error:", err);
    return res.status(500).json({ error: "Confirmation is temporarily unavailable. Please try again." });
  }
  if (!verified.ok) {
    const msg = verified.reason === "expired"
      ? "This confirmation link has expired. Please start your adoption again."
      : "This confirmation link is not valid. Please start your adoption again.";
    return res.status(400).json({ error: msg, reason: verified.reason });
  }

  const { path, date, tier, data } = verified.payload;

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { issue, reference, hash, date: adoptionDate, adopterName } =
      await createAdoptionIssue(octokit, { path, data, adoptionDate: date });

    // Private steward email for registered organisations (business number stays
    // out of the public issue). Best-effort — never blocks the confirmation.
    if (path === "organisation" && isRegisteredOrgType(data.orgType)) {
      try {
        const registry = registryLink(data.country, data.usState);
        await sendStewardEmail({
          adopterName, orgType: data.orgType, businessNumber: data.businessNumber,
          registry, country: data.country, reference, issueUrl: issue.html_url, email: data.email,
        });
      } catch (mailErr) {
        console.error("Steward email failed (adoption still recorded):", mailErr && mailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      issueUrl: issue.html_url,
      issueNumber: issue.number,
      reference,
      hash,
      conscienceVersion: CONSCIENCE_SHA256,
      date: adoptionDate,
      path,
      tier: tier || null,
      // Facts the confirmation page needs to render the certificate(s):
      adopterName,                       // hashed identity (person/venture/org name)
      email: data.email || null,
      representativeName: data.representativeName || null,
      subTypeLabel: data.subType ? (SUBTYPE_LABELS[data.subType] || null) : null,
      orgType: path === "organisation" ? data.orgType : null,
      // Registered orgs are eligible for the Mark once a steward verifies them.
      markEligible: path === "organisation" && isRegisteredOrgType(data.orgType),
    });
  } catch (err) {
    console.error("GitHub API error:", err);
    return res.status(500).json({
      error: "Failed to record your adoption. Please try again.",
      details: err.message,
    });
  }
}
