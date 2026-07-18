# Signing `ai-conscience.json`

The Foundation's own attestation lives at
`public/.well-known/ai-conscience.json` and is served at
<https://primedirective.dev/.well-known/ai-conscience.json>.

Its `signature` field ships as `"__PLACEHOLDER_SIGN_MANUALLY__"` because the
Ed25519 private key is **not** in this repo or the deployment environment — it
is held only on the encrypted key volume (`/Volumes/UPD Keys/private_ed25519.pem`),
the same key used by `issue-seal.js`. Claude Code (and CI) therefore cannot sign;
John signs manually and commits the result.

## How to sign (John, with the key volume mounted)

```bash
node tools/seal/sign-ai-conscience.js
git add public/.well-known/ai-conscience.json
git commit -m "Sign ai-conscience.json attestation"
```

That script canonicalises the document, signs it, writes the base64 signature
back into the file, and prints the exact message it signed.

## The signing scheme (so anyone can verify)

1. **Canonical form** — take the JSON object, **remove the `signature` field**,
   **sort the remaining keys alphabetically**, and serialise **with no
   whitespace**. That exact UTF-8 string is the message.
2. **Signature** — a detached **Ed25519** signature over that message,
   base64-encoded, placed in the `signature` field.
3. **Public key** — `tools/seal/public_ed25519.pem`. Its
   `public_key_fingerprint` is the **first 8 bytes of SHA-256 of the SPKI DER**,
   lowercase hex (`e06538b29c5044e3`).

### Verify (anyone)

```js
const fs = require('fs'), crypto = require('crypto');
const doc = JSON.parse(fs.readFileSync('public/.well-known/ai-conscience.json', 'utf8'));
const { signature, ...rest } = doc;
const canon = JSON.stringify(Object.fromEntries(Object.keys(rest).sort().map(k => [k, rest[k]])));
const pub = crypto.createPublicKey(fs.readFileSync('tools/seal/public_ed25519.pem', 'utf8'));
const ok = crypto.verify(null, Buffer.from(canon, 'utf8'), pub, Buffer.from(signature, 'base64'));
console.log('valid:', ok);
```

## When values change

Re-run the signing step **whenever any field changes** (new reference, adopter,
versions, key rotation). The signature only covers the canonical form, so any
edit invalidates it until re-signed. When the Foundation is formally incorporated
with its own ledger entry, update `reference`/`adopter`/`verification_url` and
re-sign.
