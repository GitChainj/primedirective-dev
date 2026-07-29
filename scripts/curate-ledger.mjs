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
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Canonical algorithm — reuse the exact string-builder and Conscience anchor the
// browser verifier uses, so a hash curated here is the hash verify recomputes.
import { buildAdoptionString, CONSCIENCE_SHA256 } from "../src/lib/adoptionHash.js";

const REPO = "GitChainj/primedirective-dev";
const ADOPTION_LABELS = new Set(["adoption-person", "adoption-organisation", "adoption-ai-system"]);
const REFERENCE_RE = /^UPD-\d{4}-(?:\d{4}|T\d{1,15})$/;

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
  };
}

function fetchAdoptionIssues() {
  const out = execFileSync(
    "gh",
    ["issue", "list", "--repo", REPO, "--state", "all",
     "--json", "number,title,body,labels", "--limit", "500"],
    { encoding: "utf8" }
  );
  const issues = JSON.parse(out);
  return issues.filter((i) => (i.labels || []).some((l) => ADOPTION_LABELS.has(l.name)));
}

function main() {
  const existing = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));
  const existingRows = Array.isArray(existing.adoptions) ? existing.adoptions : [];

  // Seed the merge map with the rows already in the ledger (preserves any row
  // that has no corresponding issue, e.g. the founding UPD-2026-0001).
  const byRef = new Map();
  for (const r of existingRows) byRef.set(r.reference, orderedRow(r));

  const issues = fetchAdoptionIssues();
  let verified = 0, refused = 0, skipped = 0, added = [];

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
    verified++;

    if (byRef.has(parsed.reference)) {
      // Consistency check against a row already present; keep existing, warn on drift.
      const cur = byRef.get(parsed.reference);
      const drift = Object.keys(orderedRow(parsed)).filter((k) => cur[k] !== parsed[k]);
      if (drift.length) console.warn(`  NOTE     ${parsed.reference} already curated; issue differs in ${drift.join(", ")} (keeping existing).`);
    } else {
      byRef.set(parsed.reference, orderedRow(parsed));
      added.push(parsed.reference);
    }
  }

  // Sort by reference for a stable, readable ledger.
  const adoptions = [...byRef.values()].sort((a, b) => a.reference.localeCompare(b.reference));

  // Idempotency: only change lastUpdated if the rows actually changed.
  const rowsChanged = JSON.stringify(adoptions) !== JSON.stringify(existingRows.map(orderedRow));
  const lastUpdated = rowsChanged ? new Date().toISOString().slice(0, 10) : existing.lastUpdated;

  const next = { adoptions, lastUpdated };
  const nextText = JSON.stringify(next, null, 2) + "\n";

  console.error(`\nIssues scanned: ${issues.length} | verified: ${verified} | refused: ${refused} | ` +
                `skipped (no Verification block): ${skipped}`);
  console.error(added.length ? `Added references: ${added.join(", ")}` : "Added references: (none)");
  console.error(`Ledger rows: ${existingRows.length} → ${adoptions.length}`);

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
