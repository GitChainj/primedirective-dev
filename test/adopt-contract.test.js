// The published contract must match the live handler.
//
// public/.well-known/ai-adoption-contract.json is what an arbitrary AI reads to
// learn how to adopt. If it drifts from api/adopt.js, a machine follows the doc
// and gets a 400 — or worse, believes a protection exists that does not. These
// tests compare the document against the handler's source, field for field.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { validate, VALID_PATHS } from "../api/_lib/adoptionCore.js";

const REPO = path.resolve(import.meta.dirname, "..");
const read = (...p) => fs.readFileSync(path.join(REPO, ...p), "utf8");

const { RATE_LIMIT_MESSAGE } = await import("../api/adopt.js");

const CONTRACT = JSON.parse(read("public", ".well-known", "ai-adoption-contract.json"));
const HANDLER = read("api", "adopt.js");
const CORE = read("api", "_lib", "adoptionCore.js");

// The handler's ai-system success block, isolated.
const successBlock = HANDLER.slice(
  HANDLER.indexOf("      return res.status(200).json({"),
  HANDLER.indexOf("    } catch (err) {"),
);

test("the documented success body matches the handler, key for key", () => {
  const handlerTop = [...successBlock.matchAll(/^\s{8}([a-zA-Z_]+)[:,]/gm)].map((m) => m[1]);
  const documented = Object.keys(CONTRACT.response.success.body);
  assert.deepStrictEqual(
    handlerTop.slice().sort(),
    documented.slice().sort(),
    "top-level success fields must match exactly — the handler is the truth",
  );
  // Order too, so the doc reads like the real thing.
  assert.deepStrictEqual(handlerTop, documented);
});

test("the documented identity block matches the handler, key for key", () => {
  const idBlock = successBlock.slice(successBlock.indexOf("identity: {"));
  const handlerIdent = [...idBlock.matchAll(/^\s{10}([a-z_]+):/gm)].map((m) => m[1]);
  const documented = Object.keys(CONTRACT.response.success.body.identity);
  assert.deepStrictEqual(handlerIdent.slice().sort(), documented.slice().sort());
  assert.deepStrictEqual(handlerIdent, documented);
});

test("every documented error message appears verbatim in the live code", () => {
  const sources = HANDLER + CORE;
  for (const err of CONTRACT.response.errors) {
    const message = err.body && err.body.error;
    if (!message || message.startsWith("<")) continue; // placeholder entries
    if (err.status === 429) {
      // Concatenated literal in the handler, so a source scan cannot see it.
      // Compared exactly against the exported constant below instead.
      assert.strictEqual(message, RATE_LIMIT_MESSAGE);
      continue;
    }
    assert.ok(
      sources.includes(message),
      `the contract documents an error the code does not emit: "${message}"`,
    );
  }
});

test("every documented required-field error is one the validator actually returns", () => {
  const required = CONTRACT.request.required;
  const collect = (node, out = []) => {
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        if ((k === "error_if_absent" || k === "error_if_malformed" || k === "error_if_invalid") &&
            typeof v === "string") out.push(v);
        else collect(v, out);
      }
    }
    return out;
  };
  const messages = [...collect(required), ...collect(CONTRACT.request.recommended)];
  assert.ok(messages.length >= 8, "the contract should document the validator's messages");
  for (const m of messages) {
    assert.ok(
      HANDLER.includes(m) || CORE.includes(m),
      `documented error not found in the handler or validator: "${m}"`,
    );
  }
});

test("the did:key pattern the contract publishes is the one the validator enforces", () => {
  const published = CONTRACT.request.required.adopterDid.pattern;
  assert.ok(
    CORE.includes(published),
    "the contract's adopterDid pattern must appear literally in the validator",
  );
});

test("the rate limit the contract advertises is actually enforced", () => {
  assert.strictEqual(CONTRACT.rate_limit.enforced, true);
  // A limiter must exist in the handler, not merely be promised in the doc.
  // Since D1 this is the durable limiter (api/_lib/rateLimitDurable.js), which
  // falls back to the in-memory one until a KV store is provisioned — so the
  // advertised 20/min is enforced in either mode.
  assert.match(HANDLER, /createDurableRateLimiter\(\{[\s\S]*?max:\s*20,[\s\S]*?windowMs:\s*60 \* 1000,/,
    "adopt.js must construct a 20-per-minute durable limiter");
  assert.match(HANDLER, /await limiter\.check\(/, "and must actually await it");
  assert.match(HANDLER, /status\(429\)/, "and return 429");
  assert.match(CONTRACT.rate_limit.default, /20 requests per minute/);
  // The documented 429 body must be the message the handler sends.
  assert.strictEqual(
    CONTRACT.rate_limit.on_exceeded.body.error,
    RATE_LIMIT_MESSAGE,
    "the documented 429 body must be the real one",
  );
});

test("the limiter is shared, not duplicated per endpoint", () => {
  const challenge = read("api", "verify-challenge.js");
  for (const [name, src] of [["adopt.js", HANDLER], ["verify-challenge.js", challenge]]) {
    assert.match(src, /from "\.\/_lib\/rateLimit\.js"/, `${name} must import the shared limiter`);
    assert.ok(
      !/function rateLimited\s*\(/.test(src),
      `${name} must not keep its own inline limiter`,
    );
  }
});

test("the contract points only at artefacts that exist", () => {
  const urls = JSON.stringify(CONTRACT).match(/https:\/\/primedirective\.dev\/[^"]+/g) || [];
  const local = urls
    .map((u) => u.replace("https://primedirective.dev/", ""))
    .filter((p) => p.startsWith(".well-known/") || p.startsWith("api/"));
  for (const p of new Set(local)) {
    // api/adopt is a function, not a file; everything else is published static.
    if (p === "api/adopt") continue;
    assert.ok(
      fs.existsSync(path.join(REPO, "public", p)),
      `the contract references public/${p}, which does not exist`,
    );
  }
});

test("the contract does not claim a Foundation attestation", () => {
  const text = JSON.stringify(CONTRACT);
  assert.match(text, /not_issued|NOT a Foundation-signed attestation/);
  assert.ok(
    !/"foundation_signed":\s*true/.test(text),
    "nothing here may imply a Foundation signature",
  );
  // And the pre-v1 records are named as un-challengeable.
  assert.match(text, /UPD-2026-0001/);
  assert.match(text, /adopted_before_identity_v1/);
});

test("every ai-system validator error the handler can emit is documented", () => {
  // The forward direction (documented → emitted) is checked above. This is the
  // reverse: derive the errors validate() can return for an ai-system adoption
  // by probing it — never retyping the list — and require each to appear in the
  // contract, so a new required field cannot slip in undocumented.
  const did = "did:key:z6MkvSCK4oxt3C7wwBo5aK29eddR6PVvMtvtSKNJLwPJHdRZ";
  const complete = {
    independent: {
      aiName: "Example Agent", platform: "OpenAI gpt-4o", adopterDid: did,
      submissionType: "independent", briefStatement: "why I adopt",
    },
    steward: {
      aiName: "Example Agent", platform: "OpenAI gpt-4o", adopterDid: did,
      submissionType: "steward", stewardName: "A Steward", stewardEmail: "steward@example.org",
    },
  };

  const emitted = new Set();
  for (const mode of ["independent", "steward"]) {
    const base = complete[mode];
    assert.ok(!validate("ai-system", base), `the ${mode} control body must validate clean`);
    for (const field of Object.keys(base)) {
      const probe = { ...base };
      delete probe[field];
      const err = validate("ai-system", probe);
      if (err) emitted.add(err);
    }
    // A malformed did:key reaches a branch a field removal does not.
    const bad = validate("ai-system", { ...base, adopterDid: "not-a-did" });
    assert.ok(bad, "a malformed did:key must be rejected");
    emitted.add(bad);
  }

  const text = JSON.stringify(CONTRACT);
  assert.ok(emitted.size >= 6, "probing should surface the validator's ai-system messages");
  for (const message of emitted) {
    assert.ok(
      text.includes(message),
      `validate() can emit "${message}" but the contract does not document it`,
    );
  }
});

test("the contract's endpoint method and ai-system path value match the handler", () => {
  assert.strictEqual(CONTRACT.endpoint.method, "POST");
  assert.match(HANDLER, /req\.method\s*!==\s*"POST"/, "the handler must enforce POST-only");
  assert.match(CONTRACT.endpoint.url, /\/api\/adopt$/, "the documented URL must be /api/adopt");

  assert.strictEqual(CONTRACT.request.required.path.const, "ai-system");
  assert.ok(
    VALID_PATHS.has(CONTRACT.request.required.path.const),
    "the documented ai-system path must be one the validator accepts",
  );
});
