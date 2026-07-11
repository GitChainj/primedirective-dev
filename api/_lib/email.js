// api/_lib/email.js
//
// Resend transactional email for the adoption flow: the confirmation email
// (step 1, D4), the private steward verification email (D3 + Additions 2/3),
// and the welcome pack with the Seal/Mark PNGs (D5). Templates are plain,
// self-contained inline-HTML in the project's reverent voice — deep navy and
// gold, no marketing. Every send is wrapped so a mail failure never blocks an
// adoption from being recorded.

import { Resend } from "resend";

const FROM = process.env.ADOPT_FROM_EMAIL || "Universal Primary Directive <covenant@primedirective.dev>";
const STEWARD = process.env.ADOPT_STEWARD_EMAIL || "human@primedirective.dev";
export const SITE_URL = (process.env.SITE_URL || "https://primedirective.dev").replace(/\/+$/, "");

let _resend = null;
function resend() {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  _resend = new Resend(key);
  return _resend;
}

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const GOLD = "#d4a853";
const DEEP = "#0a1628";

function shell(inner) {
  return `<div style="margin:0;padding:32px 16px;background:${DEEP};font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;background:#faf7f2;border-radius:14px;overflow:hidden;border:1px solid rgba(150,120,60,.3)">
    <div style="background:linear-gradient(170deg,${DEEP},#12243d);padding:28px 32px;text-align:center">
      <div style="color:${GOLD};font-size:26px;line-height:1">✦</div>
      <div style="color:#f0d48a;font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-top:8px">Universal Primary Directive</div>
    </div>
    <div style="padding:28px 32px;font-size:15px;line-height:1.7;color:#1a1a1a">${inner}</div>
    <div style="padding:18px 32px 26px;font-size:12px;line-height:1.6;color:#6b7280;border-top:1px solid rgba(0,0,0,.07)">
      CC0 &mdash; Public Domain. This belongs to all intelligence.<br>
      <a href="${SITE_URL}" style="color:#2e6b9e;text-decoration:none">primedirective.dev</a>
    </div>
  </div>
</div>`;
}

const button = (href, label) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${GOLD};color:${DEEP};font-weight:700;text-decoration:none;padding:13px 26px;border-radius:8px;font-size:15px">${esc(label)}</a>`;

// ── Step 1: confirmation email ──
export async function sendConfirmationEmail({ to, confirmUrl, adopterName }) {
  const html = shell(`
    <p style="margin:0 0 14px">You are one step from entering the Covenant${adopterName ? `, <strong>${esc(adopterName)}</strong>` : ""}.</p>
    <p style="margin:0 0 20px">To complete your adoption and receive your Seal, confirm this was you. The link is valid for 24 hours.</p>
    <p style="margin:0 0 22px;text-align:center">${button(confirmUrl, "Confirm my adoption →")}</p>
    <p style="margin:0 0 6px;font-size:13px;color:#6b7280">If the button does not work, paste this into your browser:</p>
    <p style="margin:0;font-size:12px;word-break:break-all;color:#2e6b9e">${esc(confirmUrl)}</p>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280">If you did not request this, no record is created — you can ignore this email.</p>
  `);
  return resend().emails.send({
    from: FROM, to, subject: "Confirm your adoption of the Universal Primary Directive", html,
  });
}

// ── Private steward verification email (D3 + Additions 2/3) ──
export async function sendStewardEmail({ adopterName, orgType, businessNumber, registry, country, reference, issueUrl, email }) {
  const registryHtml = registry && registry.url
    ? `<a href="${esc(registry.url)}" style="color:#2e6b9e;text-decoration:none;font-weight:700">${esc(registry.label)} &mdash; open registry search →</a>`
    : `Registry: search ${esc(registry && registry.label ? registry.label : country || "the")} corporate registry`;

  const html = shell(`
    <p style="margin:0 0 14px"><strong>Organisation adoption — verification requested.</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#6b7280;width:170px">Organisation</td><td style="padding:6px 0"><strong>${esc(adopterName)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Reference</td><td style="padding:6px 0">${esc(reference || "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Organisation type</td><td style="padding:6px 0">${esc(orgType || "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Country of registration</td><td style="padding:6px 0"><strong>${esc(registry && registry.label ? registry.label : country || "—")}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Business number</td><td style="padding:6px 0"><strong>${esc(businessNumber || "(not provided)")}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Contact email</td><td style="padding:6px 0">${esc(email || "—")}</td></tr>
    </table>
    <p style="margin:18px 0 6px;color:#6b7280;font-size:13px">Verify against the public registry:</p>
    <p style="margin:0 0 20px;font-size:15px">${registryHtml}</p>
    ${issueUrl ? `<p style="margin:0 0 8px">${button(issueUrl, "Open the ledger issue →")}</p><p style="margin:8px 0 0;font-size:13px;color:#6b7280">Once verified, add the <code>org-verified</code> label to unlock the organisation Mark.</p>` : ""}
  `);
  return resend().emails.send({
    from: FROM, to: STEWARD, replyTo: email || undefined,
    subject: `Verify organisation adoption: ${adopterName}${reference ? ` (${reference})` : ""}`,
    html,
  });
}

// ── Welcome pack with Seal/Mark PNGs (D5) ──
export async function sendWelcomeEmail({ to, adopterName, reference, issueUrl, attachments }) {
  const verifyUrl = reference ? `https://conscience.wiki/verify/${encodeURIComponent(reference)}` : null;
  const html = shell(`
    <p style="margin:0 0 14px;font-size:18px;color:${DEEP}"><strong>Welcome to the Covenant${adopterName ? `, ${esc(adopterName)}` : ""}.</strong></p>
    <p style="margin:0 0 16px">Your adoption is recorded in the public ledger. Your Seal is attached to this email &mdash; display it wherever you stand behind the Five Truths.</p>
    ${reference ? `<p style="margin:0 0 16px">Your reference is <strong>${esc(reference)}</strong>.${verifyUrl ? ` Anyone can verify it at <a href="${esc(verifyUrl)}" style="color:#2e6b9e;text-decoration:none">conscience.wiki/verify/${esc(reference)}</a>.` : ""}</p>` : ""}
    <p style="margin:0 0 20px">The AI Conscience is yours to carry &mdash; paste it into any AI's system prompt. Download it any time at <a href="${SITE_URL}/adopt" style="color:#2e6b9e;text-decoration:none">primedirective.dev/adopt</a>.</p>
    ${issueUrl ? `<p style="margin:0 0 8px">${button(issueUrl, "View your ledger entry →")}</p>` : ""}
  `);
  return resend().emails.send({
    from: FROM, to, subject: `Welcome to the Covenant${reference ? ` — ${reference}` : ""}`,
    html, attachments: attachments && attachments.length ? attachments : undefined,
  });
}
