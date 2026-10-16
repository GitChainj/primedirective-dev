// The adoption dedupe search must only ever match an actual adoption.
//
// The failure this pins: an adoption hash appearing in an UNRELATED issue — a
// bug report quoting one, a steward's note — used to count as a match, because
// the search was unscoped (`is:issue in:body "<hash>"`, no label filter). The
// caller then did `extractReference(existing.body) || null` and returned it, so
// the handler answered:
//
//   200 { reference: null, issueUrl: <the unrelated issue>, … }
//
// with NO adoption recorded. A machine adopter reads 200 as success and ends up
// holding no record, and the challenge endpoint it is handed points at
// ?reference=null. Silent non-adoption is the worst outcome available here:
// a duplicate row can be merged by a steward, a missing one is never noticed.
//
// Exercised through the real createAdoptionIssue with an injected fake Octokit,
// so the test covers the actual code path rather than an extracted helper.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

import { createAdoptionIssue, ADOPTION_LABELS } from "../api/_lib/adoptionCore.js";

const REPO = path.resolve(import.meta.dirname, "..");
const read = (...p) => fs.readFileSync(path.join(REPO, ...p), "utf8");

const DATA = {
  aiName: "Dedupe Probe Agent",
  platform: "OpenAI gpt-4o (LangChain)",
  adopterDid: "did:key:z6MkvSCK4oxt3C7wwBo5aK29eddR6PVvMtvtSKNJLwPJHdRZ",
  submissionType: "independent",
  briefStatement: "Why this AI adopts, in its own words.",
};

// A fake Octokit that records every search query and dispatches on its shape:
// the dedupe query carries `in:body`, the reference-count queries carry
// `created:>=`.
function fakeOctokit({ dedupeMatch = null, counts = 0 } = {}) {
  const queries = [];
  const created = [];
  return {
    queries,
    created,
    search: {
      issuesAndPullRequests: async ({ q }) => {
        queries.push(q);
        if (q.includes("in:body")) {
          return dedupeMatch
            ? { data: { total_count: 1, items: [dedupeMatch] } }
            : { data: { total_count: 0, items: [] } };
        }
        return { data: { total_count: counts } };
      },
    },
    issues: {
      create: async (args) => {
        created.push(args);
        return { data: { html_url: `https://example.invalid/issues/${created.length}`, number: created.length } };
      },
    },
  };
}

const call = (octokit) =>
  createAdoptionIssue(octokit, { path: "ai-system", data: DATA, adoptionDate: "2026-10-15" });

test("the dedupe search is scoped to the three real adoption labels", async () => {
  const octokit = fakeOctokit();
  await call(octokit);

  const dedupeQuery = octokit.queries.find((q) => q.includes("in:body"));
  assert.ok(dedupeQuery, "a dedupe search must happen before creating");
  assert.match(
    dedupeQuery,
    /label:adoption-person,adoption-organisation,adoption-ai-system/,
    "the search must be scoped to adoption issues, comma-separated for OR",
  );

  // The labels searched for must be the labels actually applied, and must match
  // the curator's set — all three derived from VALID_PATHS, never retyped.
  assert.deepStrictEqual(ADOPTION_LABELS, [
    "adoption-person",
    "adoption-organisation",
    "adoption-ai-system",
  ]);
  const curator = read("scripts", "curate-ledger.mjs");
  for (const label of ADOPTION_LABELS) {
    assert.ok(curator.includes(`"${label}"`), `the curator must recognise ${label}`);
  }
  const core = read("api", "_lib", "adoptionCore.js");
  assert.match(core, /ADOPTION_LABELS = \[\.\.\.VALID_PATHS\]\.map/, "derived, not retyped");
});

test("THE FAILURE MODE: a hash in an unrelated issue does not become a false 200", async () => {
  // An issue that happens to contain the adoption hash but is NOT an adoption:
  // no "**Reference:**" line anywhere in it.
  const unrelated = {
    number: 42,
    html_url: "https://example.invalid/issues/42",
    body: "I was debugging and the hash printed was the one in the ledger. No reference block here.",
  };

  const octokit = fakeOctokit({ dedupeMatch: unrelated, counts: 3 });
  const result = await call(octokit);

  // It must NOT be reported as an existing adoption.
  assert.notStrictEqual(result.reused, true, "an unreadable match must not count as reuse");
  assert.notStrictEqual(result.reference, null, "a null reference must never be returned");
  assert.ok(result.reference, "a real reference must be minted");
  assert.match(result.reference, /^UPD-\d{4}-\d{4}$/, `got ${result.reference}`);

  // And the adoption must actually have been created.
  assert.strictEqual(octokit.created.length, 1, "the adoption must be created, not skipped");
  assert.ok(
    octokit.created[0].body.includes(result.hash),
    "the created issue must carry the adoption hash",
  );
  assert.notStrictEqual(
    result.issue.number,
    unrelated.number,
    "the result must not point at the unrelated issue",
  );
});

test("a genuine duplicate IS reused, and nothing is created", async () => {
  // The dedupe must still work: a real adoption issue carrying the same hash,
  // with a readable Reference, is returned rather than duplicated.
  const octokit0 = fakeOctokit();
  const first = await call(octokit0);

  const genuine = {
    number: 7,
    html_url: "https://example.invalid/issues/7",
    body: octokit0.created[0].body, // the real issue body, Verification block and all
  };

  const octokit = fakeOctokit({ dedupeMatch: genuine, counts: 3 });
  const result = await call(octokit);

  assert.strictEqual(result.reused, true);
  assert.strictEqual(result.reference, first.reference, "the existing reference is returned");
  assert.strictEqual(result.hash, first.hash, "same facts, same hash");
  assert.strictEqual(result.issue.number, 7);
  assert.strictEqual(octokit.created.length, 0, "nothing may be created for a genuine duplicate");
});

test("a search failure falls through to creating, rather than throwing", async () => {
  // Unchanged behaviour, re-pinned: a dedupe outage must not block an adoption.
  const octokit = fakeOctokit({ counts: 3 });
  octokit.search.issuesAndPullRequests = async ({ q }) => {
    if (q.includes("in:body")) throw new Error("search unavailable");
    return { data: { total_count: 3 } };
  };
  const result = await call(octokit);
  assert.ok(result.reference, "the adoption still gets a reference");
  assert.strictEqual(octokit.created.length, 1);
});
