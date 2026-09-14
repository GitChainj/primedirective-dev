# tools/attest — AI Conscience attestation tooling (Piece 3, Phase A)

Phase A infrastructure that processes **no adopter personal data**. It defines
the v2 attestation format and the tools to canonicalize and verify attestations.
It does **not** modify `api/`, add a public site surface, or handle real adopter
data.

## Files
- `../../public/schemas/ai-conscience/v2.json` — the v2 attestation JSON Schema
  (32 discrete fields: the Piece 3 set plus `adoption_path` and
  `signature_algorithm`; `adopter_public_key_fingerprint` is required when
  `adoption_path` is `ai-system`).
- `../../public/schemas/ai-conscience/intermediate-cert/v1.json` — the formal
  intermediate certificate schema (root-signed JSON, not X.509).
- `../../public/schemas/ai-conscience/revocations/v1.json` — the signed
  revocation-list schema.
- `../../public/schemas/ai-conscience/transparency-log/v1.md` — the hash-chained
  transparency-log format.
- `../../public/.well-known/ai-conscience-root.pem` / `ai-conscience-root.json` —
  the published root public key (byte-identical to `tools/seal/public_ed25519.pem`)
  and its descriptor (fingerprint, algorithm, rotation policy).
- `canonicalize.js` — the canonicalization functions. `canonicalize` sorts
  top-level keys, strips `signature`, and emits whitespace-free JSON — shared by
  the offline signer (`tools/seal/sign-ai-conscience.js`) and every verifier so
  signed bytes and verified bytes are identical. `canonicalizeOmitting(doc, key)`
  is the general form used by the transparency log (which omits `entry_hash` and
  keeps `signature` as data).
- `sign-revocations.js` — OFFLINE tool to sign a revocation list with a key from
  `UPD_SIGNING_KEY` (never a repo path); the intermediate signs attestation-level
  lists, the root signs intermediate-level lists.
- `verify.js` — command-line four-step verifier (local-file mode):
  1. attestation signature valid against the intermediate key
  2. intermediate certificate valid against the root key — fingerprint match,
     `issuer_fingerprint` == root, root signature, and the attestation's
     `signed_at` within the cert's `[not_before, not_after]` window
  3. neither intermediate nor attestation revoked — checks TWO signed lists:
     `--revocations` (attestation-level, signed by the issuing intermediate or
     the root) and `--root-revocations` (intermediate-level, signed by the root
     ONLY). Each list's signature must verify; either list absent, unsigned, or
     bad-signature → FAIL. Intermediate revocation is read only from the
     root-signed list — an intermediate is never trusted to report its own.
  4. transparency log entry present AND the hash chain from genesis to the
     matching entry is intact

  `--root-only` verifies a v1 attestation directly against the root key.
  `--root-url <url>` fetches the root key fresh (no cache) instead of `--root`.
- `fixtures/` — throwaway TEST keys and synthetic v2 attestations: `valid`,
  `bad-signature` (step 1), `out-of-window` + a no-window cert (step 2),
  `revoked` + `revocations-badsig` + `revoked-intermediate` + missing
  `--root-revocations` (step 3), `missing-from-log` + `broken-chain` (step 4).
  Also the formal certs `test-intermediate.cert.json` /
  `test-intermediate2.cert.json` / `test-intermediate-nowindow.cert.json`, the
  signed `revocations.json` and root-signed `root-revocations.json`, and the
  chained `attestations.log` / `attestations-broken.log`. **Test material only —
  never the real signing keys.** Private `*.key.pem` halves are gitignored;
  public halves, certs, attestations, revocation lists, and logs are committed.
  Fixture references use the `T-form` (`UPD-YYYY-T####`) so they can never be
  mistaken for real adoptions.

## Run the tests
```
node --test tools/attest/*.test.js
```
(Passing the bare directory — `node --test tools/attest/` — does not work here:
the nested `package.json` makes Node try to load the directory as a package.)

Note: in full (non-`--root-only`) mode, steps 3 and 4 report **FAIL by design**
when no revocation list (`--revocations`) or transparency log (`--log`) is
supplied — absence cannot prove not-revoked or log-presence, so all four inputs
are required for a full verification to pass.
Verify the live Foundation attestation (root-only):
```
node tools/attest/verify.js public/.well-known/ai-conscience.json --root-only
```
Verify a fixture (full four-step):
```
node tools/attest/verify.js tools/attest/fixtures/valid.json \
  --root              tools/attest/fixtures/test-root.pub.pem \
  --intermediate      tools/attest/fixtures/test-intermediate.cert.json \
  --revocations       tools/attest/fixtures/revocations.json \
  --root-revocations  tools/attest/fixtures/root-revocations.json \
  --log               tools/attest/fixtures/attestations.log
```
Regenerate fixtures (only if needed): `node tools/attest/fixtures/generate-fixtures.js`

## Formats
Phase 33.4 formalises the four formats, each with a published schema or spec:
- **v2 attestation** — `schemas/ai-conscience/v2.json`
- **Intermediate certificate** — `schemas/ai-conscience/intermediate-cert/v1.json`
  (`{ schema, key_id, public_key, fingerprint, signature_algorithm,
  issuer_fingerprint, not_before, not_after, signature }`, root-signed).
- **Transparency log** — `schemas/ai-conscience/transparency-log/v1.md`
  (hash-chained JSONL; no adopter name).
- **Revocation list** — `schemas/ai-conscience/revocations/v1.json` (structured
  and signed; attestation-level by the intermediate, intermediate-level by the
  root). The first real (empty) list is signed offline by the Steward with
  `sign-revocations.js` from the vault — not in this repo.

## Why the signing SERVICE is not in this repo
The Piece 3 proposal requires the online intermediate signing service to run on
self-managed infrastructure in a jurisdiction of the Steward's choice —
explicitly **not** on Vercel/AWS (US legal compulsion) — for jurisdictional
independence and to simplify GDPR Chapter V transfer questions. Putting the
signer in `api/` would deploy it to Vercel and defeat that requirement. This
repo therefore holds only the **format, canonicalization, and verification**;
the signing service is developed and operated separately.
