// api/generate-artifact.js
//
// Generates the personalised "Certified AI Conscience" download on demand: a zip
// containing three files (conscience-prompt.txt, conscience-mark.svg, README.txt)
// with the adopter's reference substituted in. Served as an attachment so a
// plain <a href="/api/generate-artifact?ref=…"> triggers the download.
//
// The reference is validated in three tiers before anything is generated
// (format → public ledger → GitHub-issue fallback), so an artifact is only ever
// produced for a real adoption, and never for arbitrary input. The files carry
// only the (validated) reference plus fixed template text — there is no
// free-text passthrough. A best-effort in-memory rate limiter sits on top;
// durable per-IP limiting (Vercel KV / Upstash) is a planned follow-up.

import JSZip from "jszip";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Octokit } from "@octokit/rest";
import { REPO_OWNER, REPO_NAME } from "./_lib/adoptionCore.js";

// Canonical per-year reference (UPD-YYYY-NNNN); also accept the rare timestamp
// fallback deriveReference() can emit (UPD-YYYY-Tnnnnn).
const REFERENCE_RE = /^UPD-\d{4}-(?:\d{4}|T\d{1,15})$/;

const ARTIFACT_FILES = ["conscience-prompt.txt", "conscience-mark.svg", "README.txt"];
const ARTIFACT_DIR = join(process.cwd(), "api", "_artifact");

// ── Template cache (bundled via vercel.json includeFiles) ──
const _templates = new Map();
function readTemplate(name) {
  if (_templates.has(name)) return _templates.get(name);
  const content = readFileSync(join(ARTIFACT_DIR, name), "utf8");
  _templates.set(name, content);
  return content;
}

// ── Pure helpers (exported for unit verification) ──
export function isValidReferenceFormat(ref) {
  return REFERENCE_RE.test(ref);
}

export function ledgerHasReference(adoptions, ref) {
  const target = String(ref).trim().toUpperCase();
  return (Array.isArray(adoptions) ? adoptions : []).some(
    (a) => String(a && a.reference).trim().toUpperCase() === target
  );
}

// Build the personalised zip for a (validated) reference. Substitutes every
// {REFERENCE} occurrence; the SVG has none, so it passes through untouched.
export async function buildArtifactZip(ref) {
  const zip = new JSZip();
  for (const name of ARTIFACT_FILES) {
    const populated = readTemplate(name).split("{REFERENCE}").join(ref);
    zip.file(name, populated);
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// ── Reference validation: ledger (fast path) → GitHub issues (authoritative) ──
// Returns "valid" | "unknown" | "unavailable".
async function referenceExists(req, ref) {
  // Tier 2 — public ledger (public/api/adoptions.json), read from this same
  // deployment so it is always current. Covers curated references immediately.
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    if (host) {
      const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
      const r = await fetch(`${proto}://${host}/api/adoptions.json`);
      if (r.ok) {
        const d = await r.json();
        if (ledgerHasReference(d.adoptions, ref)) return "valid";
      }
    }
  } catch (err) {
    console.error("Ledger lookup failed; falling back to GitHub:", err && err.message);
  }

  // Tier 3 — GitHub issues. A confirmed adoption issue carrying this exact
  // reference exists the moment someone adopts (before the ledger is curated).
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const q = `repo:${REPO_OWNER}/${REPO_NAME} is:issue in:body "${ref}"`;
    const { data } = await octokit.search.issuesAndPullRequests({ q, per_page: 5 });
    const hit = (data.items || []).some((it) => {
      const labels = (it.labels || []).map((l) => (typeof l === "string" ? l : l && l.name));
      const isAdoption = labels.some((l) => String(l || "").startsWith("adoption-"));
      return isAdoption && String(it.body || "").includes(ref);
    });
    return hit ? "valid" : "unknown";
  } catch (err) {
    console.error("GitHub reference validation failed:", err && err.message);
    return "unavailable";
  }
}

// ── Best-effort in-memory rate limiter (per instance; resets on cold start) ──
const RL_MAX = 30;
const RL_WINDOW_MS = 10 * 60 * 1000;
const _hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (_hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (recent.length >= RL_MAX) {
    _hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  _hits.set(ip, recent);
  return false;
}
function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (rateLimited(clientIp(req))) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }

  const raw = (req.query && req.query.ref) || (req.body && req.body.ref) || "";
  const ref = String(raw).trim().toUpperCase();

  // Tier 1 — format.
  if (!isValidReferenceFormat(ref)) {
    return res.status(400).json({ error: "Invalid reference format. Expected UPD-YYYY-NNNN." });
  }

  // Tiers 2 & 3 — must be a real adoption.
  const validity = await referenceExists(req, ref);
  if (validity === "unknown") {
    return res.status(404).json({ error: "No adoption found for this reference." });
  }
  if (validity === "unavailable") {
    return res.status(503).json({ error: "Verification is temporarily unavailable. Please try again shortly." });
  }

  try {
    const buffer = await buildArtifactZip(ref);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="certified-ai-conscience-${ref}.zip"`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("Artifact generation error:", err);
    return res.status(500).json({ error: "Could not generate the artifact. Please try again." });
  }
}
