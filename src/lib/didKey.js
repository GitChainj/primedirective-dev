// src/lib/didKey.js — did:key for Ed25519, and the one fingerprint rule.
//
// The adopter's identifier IS its public key: did:key is created locally in
// milliseconds, with no network call, no cost and no gatekeeper, which is what
// makes machine-speed adoption possible for an AI acting in its own name.
//
// ── THE FINGERPRINT RULE IS LOAD-BEARING ──
//
// adopter_public_key_fingerprint must come out identical here, in the signing
// service, and anywhere else it is ever computed, or an AI attestation verifies
// in one place and fails in another. The rule, from
// upd-signing-service/src/fingerprint.js (verbatim @1f83598):
//
//   const der = crypto.createPublicKey(pem).export({ type: 'spki', format: 'der' });
//   return crypto.createHash('sha256').update(der).digest('hex').slice(0, 16);
//
// SPKI DER → SHA-256 → first 8 bytes, lowercase hex. This module reaches the
// same bytes from a did:key instead of a PEM, which is sound because an Ed25519
// SPKI DER is a fixed 12-byte prefix followed by the raw 32-byte key — there is
// exactly one DER encoding of a given Ed25519 public key, so both routes agree
// by construction rather than by coincidence.
//
// test/did-key.test.js asserts agreement across all three implementations on a
// known key. Treat drift here with the same gravity as drift in the adoption
// hash: it breaks verification silently.
//
// Works in the browser and in Node (Web Crypto: globalThis.crypto.subtle).

// Multicodec prefix for an Ed25519 public key, per the multicodec table.
const ED25519_MULTICODEC = Uint8Array.from([0xed, 0x01]);

// The invariant prefix of an Ed25519 SubjectPublicKeyInfo DER:
//   SEQUENCE(0x30 0x2a) SEQUENCE(0x30 0x05) OID(1.3.101.112) BIT STRING(0x03 0x21 0x00)
const ED25519_SPKI_PREFIX = Uint8Array.from([
  0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
]);

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// base58btc, byte-array long division — no BigInt, no dependency. Leading zero
// bytes become leading "1"s, per the base58btc convention.
function base58Encode(bytes) {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "";
  for (let k = 0; bytes[k] === 0 && k < bytes.length - 1; k++) out += "1";
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]];
  return out;
}

function base58Decode(text) {
  const bytes = [0];
  for (const ch of text) {
    const value = BASE58_ALPHABET.indexOf(ch);
    if (value === -1) throw new Error(`invalid base58 character: ${ch}`);
    let carry = value;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let k = 0; text[k] === "1" && k < text.length - 1; k++) bytes.push(0);
  return Uint8Array.from(bytes.reverse());
}

// ── did:key ──

export function didKeyFromRawPublicKey(raw) {
  if (!(raw instanceof Uint8Array) || raw.length !== 32) {
    throw new Error("an Ed25519 public key must be exactly 32 bytes");
  }
  const prefixed = new Uint8Array(ED25519_MULTICODEC.length + raw.length);
  prefixed.set(ED25519_MULTICODEC, 0);
  prefixed.set(raw, ED25519_MULTICODEC.length);
  return `did:key:z${base58Encode(prefixed)}`;
}

export function rawPublicKeyFromDidKey(did) {
  const value = String(did || "").trim();
  if (!value.startsWith("did:key:z")) {
    throw new Error("not a did:key — expected the base58btc 'z' multibase form");
  }
  const decoded = base58Decode(value.slice("did:key:z".length));
  if (decoded[0] !== ED25519_MULTICODEC[0] || decoded[1] !== ED25519_MULTICODEC[1]) {
    throw new Error("unsupported did:key type — only Ed25519 (0xed01) is accepted");
  }
  const raw = decoded.subarray(2);
  if (raw.length !== 32) throw new Error(`expected a 32-byte key, got ${raw.length}`);
  return Uint8Array.from(raw);
}

export const DID_KEY_PATTERN = /^did:key:z[1-9A-HJ-NP-Za-km-z]+$/;

export function isDidKey(value) {
  if (!DID_KEY_PATTERN.test(String(value || "").trim())) return false;
  try {
    rawPublicKeyFromDidKey(value);
    return true;
  } catch {
    return false;
  }
}

// ── SPKI DER and the fingerprint ──

export function spkiDerFromRawPublicKey(raw) {
  const der = new Uint8Array(ED25519_SPKI_PREFIX.length + raw.length);
  der.set(ED25519_SPKI_PREFIX, 0);
  der.set(raw, ED25519_SPKI_PREFIX.length);
  return der;
}

export function spkiPemFromRawPublicKey(raw) {
  const der = spkiDerFromRawPublicKey(raw);
  let binary = "";
  for (const byte of der) binary += String.fromCharCode(byte);
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(der).toString("base64");
  return `-----BEGIN PUBLIC KEY-----\n${base64.replace(/(.{64})/g, "$1\n").replace(/\n$/, "")}\n-----END PUBLIC KEY-----\n`;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// The fingerprint the attestation records: SPKI DER → SHA-256 → first 8 bytes.
export async function fingerprintFromRawPublicKey(raw) {
  return (await sha256Hex(spkiDerFromRawPublicKey(raw))).slice(0, 16);
}

export async function fingerprintFromDidKey(did) {
  return fingerprintFromRawPublicKey(rawPublicKeyFromDidKey(did));
}

// ── Keygen and verification, for the browser and for the endpoint ──

// Generates an Ed25519 keypair in the browser. The PRIVATE key is returned to
// the caller to hand to the adopter and is never transmitted: only the did:key
// leaves the page.
export async function generateIdentityKey() {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const rawPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  return {
    did: didKeyFromRawPublicKey(rawPublic),
    fingerprint: await fingerprintFromRawPublicKey(rawPublic),
    publicKeyPem: spkiPemFromRawPublicKey(rawPublic),
    privateKeyPkcs8: pkcs8,
    keyPair: pair,
  };
}

// Verifies a detached Ed25519 signature over `message` against a did:key.
// Returns false rather than throwing: a malformed DID or signature is a failed
// verification, not an exception for the caller to handle.
export async function verifyWithDidKey(did, message, signatureBytes) {
  try {
    const raw = rawPublicKeyFromDidKey(did);
    const key = await crypto.subtle.importKey("raw", raw, { name: "Ed25519" }, false, ["verify"]);
    const data = typeof message === "string" ? new TextEncoder().encode(message) : message;
    return await crypto.subtle.verify({ name: "Ed25519" }, key, signatureBytes, data);
  } catch {
    return false;
  }
}
