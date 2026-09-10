# tools/attest — AI Conscience attestation tooling (Piece 3, Phase A)

Phase A infrastructure that processes **no adopter personal data**. It defines
the v2 attestation format and the tools to canonicalize and verify attestations.
It does **not** modify `api/`, add a public site surface, or handle real adopter
data.

## Files
- `../../public/schemas/ai-conscience/v2.json` — the v2 attestation JSON Schema
  (26-field set per the Piece 3 proposal; 30 discrete fields including the three
  extension slots and two reserved fields).
- `canonicalize.js` — the single canonicalization function (sorted top-level
  keys, `signature` stripped, no whitespace). Shared by the offline signer
  (`tools/seal/sign-ai-conscience.js`) and every verifier, so the bytes that get
  signed and the bytes that get verified are identical.
- `verify.js` — command-line four-step verifier (local-file mode):
  1. attestation signature valid against the intermediate key
  2. intermediate certificate valid against the root key
  3. neither intermediate nor attestation revoked
  4. transparency log entry present

  `--root-only` verifies a v1 attestation directly against the root key.
- `fixtures/` — throwaway TEST keys and synthetic v2 attestations (one valid,
  one bad-signature, one revoked, one missing-from-log). **Test material only —
  never the real signing keys.** Private `*.key.pem` halves are gitignored; the
  public halves, cert, signed attestations, revocation list, and log are
  committed. Fixture references use the `T-form` (`UPD-YYYY-T####`) so they can
  never be mistaken for real adoptions.

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
  --root         tools/attest/fixtures/test-root.pub.pem \
  --intermediate tools/attest/fixtures/test-intermediate.cert.json \
  --revocations  tools/attest/fixtures/revocations.json \
  --log          tools/attest/fixtures/attestations.log
```
Regenerate fixtures (only if needed): `node tools/attest/fixtures/generate-fixtures.js`

## Provisional formats
The intermediate certificate shape used by the fixtures —
`{ public_key, fingerprint, signature }` — is defined here **for the first time
and is provisional**. Phase 33.3 formalises it (adding at least `issuer`,
`not_before`, `not_after`) alongside the transparency-log and revocation-list
formats. Treat the current cert, log, and revocation shapes as fixtures-adequate,
not final.

## Why the signing SERVICE is not in this repo
The Piece 3 proposal requires the online intermediate signing service to run on
self-managed infrastructure in a jurisdiction of the Steward's choice —
explicitly **not** on Vercel/AWS (US legal compulsion) — for jurisdictional
independence and to simplify GDPR Chapter V transfer questions. Putting the
signer in `api/` would deploy it to Vercel and defeat that requirement. This
repo therefore holds only the **format, canonicalization, and verification**;
the signing service is developed and operated separately.
