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
  VALID_PATHS, CONSCIENCE_SHA256, validate, createAdoptionIssue, keyCustodyFrom,
} from "./_lib/adoptionCore.js";
import { signToken } from "./_lib/adoptToken.js";
import { sendConfirmationEmail, sendConsentRecordEmail, sendAttestationRecordEmail, SITE_URL } from "./_lib/email.js";
import { attestationEnabled, issueAttestation, identityClassForPath, COMPREHENSION_V1 } from "./_lib/attestation.js";
import { createRateLimiter, clientIp } from "./_lib/rateLimit.js";

// ── Rate limiting ──
//
// The published adoption contract advertises 20/min per source, and until now
// this endpoint enforced nothing — a protection claimed but not delivered. The
// limiter is the one shared in api/_lib/rateLimit.js, extracted from
// api/verify-challenge.js so both endpoints use the same implementation.
//
// Applied to EVERY path, not just the machine one. Honest use needs a single
// request: an AI adopts once, and a human adopts once. On the human paths the
// endpoint also sends a confirmation email, so an unlimited endpoint would be a
// way to send mail at someone else's address. It is also the guard against
// rapid re-adoption: the ledger is idempotent within a UTC day, but a loop
// across days would otherwise be free.
const limiter = createRateLimiter({ max: 20, windowMs: 60 * 1000 });

// Exported so the published contract can be tested against the real string
// rather than against a guess at it.
export const RATE_LIMIT_MESSAGE =
  "Too many requests. Adoption is a one-time act and needs a single request; " +
  "if you are a legitimate high-volume adopter or hub, contact " +
  "human@primedirective.dev for a raised limit.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const source = clientIp(req);
  if (limiter.limited(source)) {
    res.setHeader("Retry-After", String(limiter.retryAfterSeconds(source)));
    return res.status(429).json({ error: RATE_LIMIT_MESSAGE });
  }

  const body = req.body || {};
  const { path, affirmation, tier, consent, ...data } = body;

  if (!VALID_PATHS.has(path)) {
    return res.status(400).json({ error: "Invalid adoption path" });
  }
  if (affirmation !== true) {
    return res.status(400).json({ error: "Affirmation is required to enter the Covenant" });
  }
  // Consent to the public, permanent record is the lawful basis for creating it.
  if (!consent || consent.granted !== true || !consent.at || !consent.disclosureVersion) {
    return res.status(400).json({ error: "Consent to the public record is required to adopt" });
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
      // Signed attestation for this AI adoption (Piece 3 Phase B) — INERT unless
      // all three UPD_ATTESTATION_* vars are set, which they are not in
      // production. The ledger record above is already final; this is strictly
      // additional and may never undo it. AI identity v1 supplies the did:key
      // that makes the v2 ai-system conditional satisfiable.
      if (attestationEnabled()) {
        try {
          const result = await issueAttestation({
            reference,
            adopterName: data.aiName,
            adoptionDate: date,
            adoptionPath: path,
            identityClass: (consent && consent.identityClass) || identityClassForPath(path),
            adopterDid: data.adopterDid,
            submissionType: data.submissionType,
          });
          if (result.ok) {
            await sendAttestationRecordEmail({ reference, attestation: result.attestation });
          } else {
            console.error("Attestation not issued:", result.reason, result.detail || "");
          }
        } catch (attErr) {
          console.error("Attestation step failed (adoption still recorded):", attErr && attErr.message);
        }
      }

      // Private accountability copy; a mail failure must never undo an adoption.
      try {
        await sendConsentRecordEmail({ reference, path, adopterName: data.name || data.fullName || data.systemName || null, consent });
      } catch (mailErr) {
        console.error("Consent record email failed:", mailErr);
      }
      return res.status(200).json({
        success: true,
        issueUrl: issue.html_url,
        issueNumber: issue.number,
        reference,
        hash,
        conscienceVersion: CONSCIENCE_SHA256,
        date,
        // What the adopter just received, stated in the response so a machine can
        // describe its own adoption accurately without inferring anything.
        //
        // Existing vocabulary only: key_custody and comprehension are the two
        // gradient axes already in the ledger and the v2 schema. There is
        // deliberately no "level" or "tier" field — trust is two independent
        // axes, not one ladder.
        //
        // key_custody comes from keyCustodyFrom(), the SAME function that writes
        // the ledger issue body, so this value and the record's value cannot
        // disagree. It is the adopter's declaration, defaulting to operator_held
        // — never inferred from submissionType, which is a different question.
        identity: {
          adopter_did: data.adopterDid,
          key_custody: keyCustodyFrom(data),
          comprehension: COMPREHENSION_V1,
          assurance: "self_asserted",
          verifiable_by: "challenge-response",
          challenge_endpoint:
            `https://conscience.wiki/api/verify-challenge?reference=${reference}`,
          proves: "control of the key recorded for this reference, when challenged",
          does_not_prove:
            "which party controls that key — see key_custody, where operator_held means a named, accountable human or organisation holds it on the AI's behalf, which is full baseline trust rather than a lesser tier",
          foundation_attestation: "not_issued",
          foundation_attestation_note:
            "This adoption is self-asserted and peer-verifiable. It is NOT a Foundation-signed attestation: that signing layer is built but not live and issues nothing today. Please do not describe this adoption as Foundation-signed, certified or attested.",
        },
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
    const token = signToken({ path, date: adoptionDate, tier: tier || null, data, consent });
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
