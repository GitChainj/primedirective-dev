// api/send-welcome.js (D5).
//
// Emails the welcome pack with the Seal/Mark PNGs the browser generated. The
// recipient is taken from the verified token — never from the request body — so
// this cannot be used to email arbitrary addresses. The reference / issue URL /
// attachments are display-only and supplied by the confirmation page.

import { verifyToken } from "./_lib/adoptToken.js";
import { sendWelcomeEmail } from "./_lib/email.js";

const MAX_ATTACHMENTS = 6;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024; // ~8MB guard

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, reference, issueUrl, attachments } = req.body || {};
  let verified;
  try {
    verified = verifyToken(token);
  } catch (err) {
    console.error("Token verify error:", err);
    return res.status(500).json({ error: "Email is temporarily unavailable." });
  }
  if (!verified.ok) {
    return res.status(400).json({ error: "This link is no longer valid.", reason: verified.reason });
  }

  const { path, data } = verified.payload;
  const to = data && data.email;
  if (!to) return res.status(400).json({ error: "No email on file for this adoption." });

  // Sanitise attachments: keep only { filename, content(base64) }, within limits.
  let clean = [];
  if (Array.isArray(attachments)) {
    let total = 0;
    for (const a of attachments.slice(0, MAX_ATTACHMENTS)) {
      if (!a || typeof a.filename !== "string" || typeof a.content !== "string") continue;
      total += Math.ceil((a.content.length * 3) / 4);
      if (total > MAX_TOTAL_BYTES) break;
      clean.push({ filename: a.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80), content: a.content });
    }
  }

  try {
    await sendWelcomeEmail({
      to,
      adopterName: path === "organisation" ? data.organisationName : data.fullName,
      reference: reference || null,
      issueUrl: issueUrl || null,
      attachments: clean,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Welcome email error:", err);
    return res.status(500).json({ error: "Could not send the welcome email.", details: err.message });
  }
}
