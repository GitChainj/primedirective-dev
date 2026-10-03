// Spins up a real B1 signing service for the B2 integration tests.
//
// Throwaway Ed25519 keys are generated into a tmpdir per run — no real key and
// no fixture private key ever touches this repo. The service is the actual
// ~/upd-signing-service build, so these tests exercise the true interface
// (status codes, schema validation, the four service-set fields) rather than a
// mock that could drift from it.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

export const SERVICE_DIR =
  process.env.UPD_SIGNING_SERVICE_DIR || path.join(os.homedir(), "upd-signing-service");

export const SERVICE_TOKEN = "b2-test-service-token-000000000000";
export const STEWARD_TOKEN = "b2-test-steward-token-111111111111";

export function haveService() {
  return fs.existsSync(path.join(SERVICE_DIR, "bin", "upd-signing-service.js"));
}

// Canonical form must match the signing service exactly: keys sorted, the
// "signature" field removed, no whitespace.
function canonicalize(doc) {
  const out = {};
  for (const k of Object.keys(doc).sort()) {
    if (k === "signature") continue;
    out[k] = doc[k];
  }
  return JSON.stringify(out);
}

function fingerprintOf(publicPem) {
  const der = crypto.createPublicKey(publicPem).export({ type: "spki", format: "der" });
  return crypto.createHash("sha256").update(der).digest("hex").slice(0, 16);
}

function signDetached(doc, privateKey) {
  return crypto.sign(null, Buffer.from(canonicalize(doc), "utf8"), privateKey).toString("base64");
}

// A disposable world: throwaway root, throwaway intermediate, a root-signed
// certificate whose window spans now, and the root-signed intermediate-level
// revocation list that verify.js step 3 requires (the service never produces
// that list — it is root-only and offline).
export function makeWorld() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "upd-b2-test-"));
  const pems = (kp) => ({
    privatePem: kp.privateKey.export({ type: "pkcs8", format: "pem" }),
    publicPem: kp.publicKey.export({ type: "spki", format: "pem" }),
  });
  const root = pems(crypto.generateKeyPairSync("ed25519"));
  const intermediate = pems(crypto.generateKeyPairSync("ed25519"));

  const rootPubPath = path.join(dir, "root.pub.pem");
  const keyPath = path.join(dir, "intermediate.key.pem");
  const certPath = path.join(dir, "cert.json");
  const rootRevocationsPath = path.join(dir, "root-revocations.json");

  fs.writeFileSync(rootPubPath, root.publicPem);
  fs.writeFileSync(keyPath, intermediate.privatePem, { mode: 0o600 });

  const year = 365 * 24 * 60 * 60 * 1000;
  const cert = {
    schema: "https://primedirective.dev/schemas/ai-conscience/intermediate-cert/v1",
    key_id: "b2-test-intermediate",
    public_key: intermediate.publicPem,
    fingerprint: fingerprintOf(intermediate.publicPem),
    signature_algorithm: "Ed25519",
    issuer_fingerprint: fingerprintOf(root.publicPem),
    not_before: new Date(Date.now() - year).toISOString(),
    not_after: new Date(Date.now() + year).toISOString(),
  };
  cert.signature = signDetached(cert, crypto.createPrivateKey(root.privatePem));
  fs.writeFileSync(certPath, JSON.stringify(cert, null, 2) + "\n");

  const rootRevocations = {
    schema: "https://primedirective.dev/schemas/ai-conscience/revocations/v1",
    issued_at: new Date().toISOString(),
    entries: [],
    signed_by_fingerprint: fingerprintOf(root.publicPem),
  };
  rootRevocations.signature = signDetached(rootRevocations, crypto.createPrivateKey(root.privatePem));
  fs.writeFileSync(rootRevocationsPath, JSON.stringify(rootRevocations, null, 2) + "\n");

  return {
    dir,
    rootPubPath,
    certPath,
    rootRevocationsPath,
    cert,
    env: {
      UPD_INTERMEDIATE_KEY: keyPath,
      UPD_INTERMEDIATE_CERT: certPath,
      UPD_ROOT_PUBKEY: rootPubPath,
      UPD_SERVICE_TOKEN: SERVICE_TOKEN,
      UPD_STEWARD_TOKEN: STEWARD_TOKEN,
      UPD_DATA_DIR: path.join(dir, "data"),
      UPD_BIND: "127.0.0.1",
      UPD_PORT: "0",
    },
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

export function startService(world) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(SERVICE_DIR, "bin", "upd-signing-service.js")], {
      cwd: SERVICE_DIR,
      env: { ...process.env, ...world.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d.toString();
      const m = out.match(/listening on http:\/\/([\d.]+):(\d+)/);
      if (m) {
        resolve({
          child,
          origin: `http://${m[1]}:${m[2]}`,
          // Idempotent: a test may stop the service deliberately (to exercise
          // the service-down path) and the after-hook will stop it again.
          // Awaiting "exit" a second time would hang forever.
          stop() {
            if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
            return new Promise((done) => {
              child.once("exit", done);
              child.kill("SIGTERM");
            });
          },
        });
      }
    });
    child.stderr.on("data", (d) => { err += d.toString(); });
    child.once("exit", (code) =>
      reject(new Error(`signing service exited ${code} before listening\n${out}\n${err}`)));
    child.once("error", reject);
  });
}
