// One AI door.
//
// /api/register-ai created a human-review issue, never an adoption: it minted no
// reference and no adoption hash, so the curator — which fetches only
// adoption-* labelled issues and refuses any row without a complete,
// hash-verifying Verification block — could never turn one into a ledger record.
// The page that posted to it was routed but unlinked, so a human following an old
// link filled in a form that went nowhere.
//
// These tests pin the retirement: the endpoint answers 410 and names the
// canonical path, nothing in src/ posts to it, and no link points at it.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..");
const read = (...p) => fs.readFileSync(path.join(REPO, ...p), "utf8");

const handler = (await import("../api/register-ai.js")).default;

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
  };
}

test("the retired endpoint answers 410 for every method", async () => {
  for (const method of ["POST", "GET", "PUT", "DELETE", "PATCH"]) {
    const res = fakeRes();
    await handler({ method, headers: {}, body: {} }, res);
    assert.strictEqual(
      res.statusCode,
      410,
      `${method} must get 410 Gone — a 405 would imply some other method still works here`,
    );
    assert.strictEqual(res.body.retired, true);
  }
});

test("it names the canonical path a machine should use instead", async () => {
  const res = fakeRes();
  await handler({ method: "POST", headers: {}, body: {} }, res);

  assert.strictEqual(res.body.adopt_instead.method, "POST");
  assert.strictEqual(res.body.adopt_instead.url, "https://primedirective.dev/api/adopt");
  assert.strictEqual(res.body.adopt_instead.path, "ai-system");
  assert.strictEqual(
    res.body.adopt_instead.contract,
    "https://primedirective.dev/.well-known/ai-adoption-contract.json",
  );
  assert.match(res.body.adopt_instead.keygen, /ai-identity-keygen\.json$/);
  // And it warns that the body shape differs, so an old-shaped POST is not
  // simply replayed against the new address.
  assert.match(res.body.adopt_instead.note, /body differs/);
  assert.match(res.body.adopt_instead.note, /adopterDid/);
});

test("it does not overclaim what adoption gives you", async () => {
  const res = fakeRes();
  await handler({ method: "POST", headers: {}, body: {} }, res);
  assert.match(res.body.what_you_get, /[Ss]elf-asserted/);
  assert.match(res.body.what_you_get, /NOT a Foundation-signed attestation/);
});

test("it sets machine-followable Link relations and is not cached", async () => {
  const res = fakeRes();
  await handler({ method: "POST", headers: {}, body: {} }, res);
  assert.strictEqual(res.headers["Cache-Control"], "no-store");
  assert.match(res.headers.Link, /rel="describedby"/);
  assert.match(res.headers.Link, /rel="successor-version"/);
});

test("it creates nothing: no Octokit, no issue, no label", () => {
  const source = read("api", "register-ai.js");
  assert.ok(!/Octokit/.test(source), "the retired endpoint must not import Octokit");
  assert.ok(!/issues\.create/.test(source), "it must not create an issue");
  assert.ok(
    !/labels:\s*\[/.test(source),
    "and must not apply the ai-registration label",
  );
});

test("nothing in src/ posts to the retired endpoint", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.jsx?$/.test(e.name) && read(path.relative(REPO, full)).includes("api/register-ai")) {
        offenders.push(path.relative(REPO, full));
      }
    }
  };
  walk(path.join(REPO, "src"));
  assert.deepStrictEqual(offenders, [], "no component may submit to the retired endpoint");
});

test("no link or nav points at /register-ai", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.jsx?$/.test(e.name)) {
        const src = read(path.relative(REPO, full));
        if (/href=["{][^"}]*\/register-ai/.test(src)) offenders.push(path.relative(REPO, full));
      }
    }
  };
  walk(path.join(REPO, "src"));
  assert.deepStrictEqual(offenders, []);
});

test("/register-ai redirects to /adopt, server-side and in dev", () => {
  const vercel = JSON.parse(read("vercel.json"));
  const redirect = vercel.redirects.find((r) => r.source === "/register-ai");
  assert.ok(redirect, "vercel.json must redirect /register-ai");
  assert.strictEqual(redirect.destination, "/adopt");
  assert.strictEqual(redirect.permanent, true);
  assert.ok(
    !vercel.rewrites.some((r) => r.source === "/register-ai"),
    "and must no longer rewrite it to the SPA",
  );

  // vercel.json does not apply under `vite dev`, so the router covers it too.
  const app = read("src", "App.jsx");
  assert.match(app, /if \(path === '\/register-ai'\)/);
  assert.match(app, /window\.location\.replace\('\/adopt'\)/);
  assert.ok(!/RegisterAI/.test(app), "the retired component must not be imported");
});

test("the one remaining AI entry path is the ai-system adopt flow", () => {
  const adopt = read("src", "Adopt.jsx");
  assert.match(adopt, /fetch\("\/api\/adopt"/);
  // And the contract published to machines names only that endpoint.
  const contract = JSON.parse(read("public", ".well-known", "ai-adoption-contract.json"));
  assert.strictEqual(contract.endpoint.url, "https://primedirective.dev/api/adopt");
  assert.ok(
    !JSON.stringify(contract).includes("register-ai"),
    "the published contract must not mention the retired endpoint",
  );
});
