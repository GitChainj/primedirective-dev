#!/usr/bin/env node
// scripts/curate-ledger.mjs
//
// Steward-run tooling (NOT CI) to curate public/api/adoptions.json from the
// public GitHub adoption issues. It parses each adoption issue's Verification
// block, independently recomputes the adoption hash with the project's canonical
// algorithm, and REFUSES any row whose recomputed hash does not match the hash
// recorded in the issue. Only complete, self-consistent, hash-verifying records
// are curated. Rows already in the ledger that have no corresponding issue
// (e.g. the founding UPD-2026-0001) are preserved untouched.
//
// The ledger schema is six fields ONLY — reference, name, path, date, hash,
// conscience_version. Brief statements and narrative stay in the issues.
//
// Idempotent: re-running with no new verifiable adoptions changes nothing (the
// file, including lastUpdated, is left byte-identical). lastUpdated is bumped to
// today's UTC date only when the adoptions array actually changes.
//
// Usage:
//   node scripts/curate-ledger.mjs            # curate and write
//   node scripts/curate-ledger.mjs --dry-run  # print would-be file, write nothing
//
// Requires the `gh` CLI, authenticated, with read access to the repo.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Canonical algorithm — reuse the exact string-builder and Conscience anchor the
// browser verifier uses, so a hash curated here is the hash verify recomputes.
import { buildAdoptionString, CONSCIENCE_SHA256 } from "../src/lib/adoptionHash.js";

const REPO = "GitChainj/primedirective-dev";
const ADOPTION_LABELS = new Set(["adoption-person", "adoption-organisation", "adoption-ai-system"]);
const ORG_PENDING_LABEL = "org-pending-verification";
const ORG_VERIFIED_LABEL = "org-verified";
const REFERENCE_RE = /^UPD-\d{4}-(?:\d{4}|T\d{1,15})$/;

// Ledger status (NOT hashed). An adoption is "provisional" only while a
// registered organisation still awaits the Steward's org-verified label —
// derivable from labels ALONE, never from path. Everything else — person,
// ai-system, unregistered organisation, verified organisation — is "confirmed".
// Human issues exist only after email confirmation, and ai-system issues are
// created confirmed, so issue existence already implies confirmation.
function deriveStatus(issue) {
  const labels = (issue.labels || []).map((l) => (typeof l === "string" ? l : l && l.name));
  const provisional = labels.includes(ORG_PENDING_LABEL) && !labels.includes(ORG_VERIFIED_LABEL);
  return provisional ? "provisional" : "confirmed";
}

// Status for a ledger row that has no matching issue this run (e.g. the founding
// UPD-2026-0001). Keep any status already recorded; otherwise default to
// "confirmed". Provisional is never inferred from path — only from labels, which
// require a live issue to read.
function statusForSeed(r) {
  return r.status || "confirmed";
}

// Write a result line for a GitHub Actions runner, if one is present.
// changedRefs is an array of { reference, status }.
function emitActionOutputs(changed, changedRefs) {
  const outPath = process.env.GITHUB_OUTPUT;
  if (!outPath) return;
  const message = changed && changedRefs.length === 1
    ? `Ledger: promote ${changedRefs[0].reference} (${changedRefs[0].status})`
    : "Ledger: regenerate";
  appendFileSync(outPath, `changed=${changed ? "true" : "false"}\nmessage=${message}\n`);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = join(__dirname, "..", "public", "api", "adoptions.json");

const DRY_RUN = process.argv.includes("--dry-run");

// SHA-256 hex of the canonical adoption string. Matches the Web Crypto output
// used in the browser (same input string, same algorithm).
function computeHash({ name, path, date }) {
  return createHash("sha256").update(buildAdoptionString({ name, path, date })).digest("hex");
}

// Pull the display name from the issue title: "Adoption (<path>): <name>".
function nameFromTitle(title) {
  const m = /^Adoption \([a-z-]+\):\s*(.+)$/.exec(String(title || "").trim());
  return m ? m[1].trim() : null;
}

function field(body, re) {
  const m = re.exec(body);
  return m ? m[1].trim() : null;
}

// Parse an issue into a candidate ledger row, or null if it has no complete
// Verification block. Returns { reference, name, path, date, hash, conscience_version }.
function parseIssue(issue) {
  const body = String(issue.body || "");
  const row = {
    reference: field(body, /\*\*Reference:\*\*\s*([^\s]+)/),
    name: nameFromTitle(issue.title),
    path: field(body, /\*\*Path:\*\*\s*([a-z-]+)/),
    date: field(body, /\*\*Adoption date:\*\*\s*(\d{4}-\d{2}-\d{2})/),
    hash: field(body, /Adoption hash \(SHA-256\):\*\*\s*`?([0-9a-f]{64})`?/),
    conscience_version: field(body, /Conscience version \(SHA-256\):\*\*\s*`?([0-9a-f]{64})`?/),
  };
  // Every field must be present for the record to be curatable.
  if (!row.reference || !row.name || !row.path || !row.date || !row.hash || !row.conscience_version) {
    return null;
  }
  if (!REFERENCE_RE.test(row.reference)) return null;
  return row;
}

// Order keys to match the ledger's existing schema exactly.
function orderedRow(r) {
  return {
    reference: r.reference,
    name: r.name,
    path: r.path,
    date: r.date,
    hash: r.hash,
    conscience_version: r.conscience_version,
    status: r.status,
  };
}

function fetchAdoptionIssues() {
  // Authenticate gh from GITHUB_TOKEN (CI) if the CLI has no auth of its own;
  // locally, gh's existing login is used unchanged.
  const out = execFileSync(
    "gh",
    ["issue", "list", "--repo", REPO, "--state", "all",
     "--json", "number,title,body,labels", "--limit", "500"],
    {
      encoding: "utf8",
      env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "" },
    }
  );
  const issues = JSON.parse(out);
  return issues.filter((i) => (i.labels || []).some((l) => ADOPTION_LABELS.has(l.name)));
}

function main() {
  const existing = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));
  const existingRows = Array.isArray(existing.adoptions) ? existing.adoptions : [];

  // Seed the merge map with the rows already in the ledger (preserves any row
  // that has no corresponding issue, e.g. the founding UPD-2026-0001). Rows
  // without a status yet are defaulted (confirmed); a matching issue may update
  // the status below (never the hashed fields).
  const byRef = new Map();
  for (const r of existingRows) {
    const seeded = orderedRow(r);
    seeded.status = statusForSeed(r);
    byRef.set(r.reference, seeded);
  }

  const issues = fetchAdoptionIssues();
  let verified = 0, refused = 0, skipped = 0;
  const added = [], statusChanged = [];
  const issueRefsSeen = new Set();

  for (const issue of issues) {
    const parsed = parseIssue(issue);
    if (!parsed) { skipped++; continue; } // no complete Verification block (legacy/test issues)

    const recomputed = computeHash(parsed);
    if (recomputed !== parsed.hash) {
      refused++;
      console.warn(`  REFUSED  #${issue.number} ${parsed.reference}: hash mismatch ` +
                   `(issue ${parsed.hash.slice(0, 12)}… vs recomputed ${recomputed.slice(0, 12)}…)`);
      continue;
    }

    // Refuse a second issue claiming a reference already provided by another
    // issue this run — two distinct issues must never collide on one reference.
    if (issueRefsSeen.has(parsed.reference)) {
      refused++;
      console.warn(`  REFUSED  #${issue.number} ${parsed.reference}: duplicate reference (already provided by another issue this run).`);
      continue;
    }
    issueRefsSeen.add(parsed.reference);
    verified++;

    const status = deriveStatus(issue);

    if (byRef.has(parsed.reference)) {
      // Row already present (seeded from the ledger). Keep the hashed six fields;
      // warn on drift. Status is NOT hashed and MAY change over time (e.g. an
      // organisation gaining org-verified) — so update it. This is the upgrade
      // path, not a gate.
      const cur = byRef.get(parsed.reference);
      const hashedKeys = ["reference", "name", "path", "date", "hash", "conscience_version"];
      const drift = hashedKeys.filter((k) => cur[k] !== parsed[k]);
      if (drift.length) console.warn(`  NOTE     ${parsed.reference} already curated; issue differs in ${drift.join(", ")} (keeping existing).`);
      if (cur.status !== status) {
        cur.status = status;
        statusChanged.push({ reference: parsed.reference, status });
      }
    } else {
      byRef.set(parsed.reference, orderedRow({ ...parsed, status }));
      added.push({ reference: parsed.reference, status });
    }
  }

  // Sort by reference for a stable, readable ledger.
  const adoptions = [...byRef.values()].sort((a, b) => a.reference.localeCompare(b.reference));

  // Duplicate adopter names are allowed (e.g. two "LangChain Example Agent"
  // rows) — never refused, only surfaced for the Steward's attention.
  const nameCounts = new Map();
  for (const r of adoptions) nameCounts.set(r.name, (nameCounts.get(r.name) || 0) + 1);
  const dupNames = [...nameCounts.entries()].filter(([, n]) => n > 1).map(([name]) => name);
  if (dupNames.length) console.warn(`  NOTE     duplicate adopter name(s) present (not refused): ${dupNames.join("; ")}`);

  // Idempotency: only change lastUpdated if the rows actually changed.
  const rowsChanged = JSON.stringify(adoptions) !== JSON.stringify(existingRows.map(orderedRow));
  const lastUpdated = rowsChanged ? new Date().toISOString().slice(0, 10) : existing.lastUpdated;

  const next = { adoptions, lastUpdated };
  const nextText = JSON.stringify(next, null, 2) + "\n";

  const fmt = (a) => a.map((c) => `${c.reference} (${c.status})`).join(", ");
  console.error(`\nIssues scanned: ${issues.length} | verified: ${verified} | refused: ${refused} | ` +
                `skipped (no Verification block): ${skipped}`);
  console.error(added.length ? `Added: ${fmt(added)}` : "Added: (none)");
  if (statusChanged.length) console.error(`Status changed: ${fmt(statusChanged)}`);
  console.error(`Ledger rows: ${existingRows.length} → ${adoptions.length}`);

  // Surface a result to a GitHub Actions runner, if present.
  emitActionOutputs(rowsChanged, [...added, ...statusChanged]);

  if (DRY_RUN) {
    console.error("\n--dry-run: would write the following (no file changed):\n");
    process.stdout.write(nextText);
    return;
  }

  if (!rowsChanged) {
    console.error("\nNo changes — ledger already current (idempotent, not rewritten).");
    return;
  }

  writeFileSync(LEDGER_PATH, nextText);
  console.error(`\nWrote ${LEDGER_PATH} (lastUpdated → ${lastUpdated}).`);
}

main();
