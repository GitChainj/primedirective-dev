# UPD Seal Toolkit

Offline cryptographic toolkit for issuing and verifying Universal Primary Directive Seals. Seals are signed JWTs (EdDSA/Ed25519) that attest a subject's adoption of the UPD's Five Universal Truths and Articles.

---

## Security Model

| Asset | Location | Why |
|---|---|---|
| Private signing key | `/Volumes/UPD Keys/private_ed25519.pem` | Encrypted volume only — never in repo |
| Public verification key | `tools/seal/public_ed25519.pem` | Repo — anyone can verify Seals |
| Issuance ledger | `/Volumes/UPD Keys/seal_ledger.jsonl` | Encrypted volume only — sensitive records |

**The private key never touches the repository.** `.gitignore` enforces this at the pattern level (`private_*.pem`). The encrypted volume must be mounted before issuing Seals. Verification works without the volume — only the public key (in this repo) is needed.

### Current Key Fingerprint

```
e06538b29c5044e3
```

SHA-256 of the public key's DER bytes, first 16 hex characters. Use this to confirm the `public_ed25519.pem` in this repo is the authentic original. If the fingerprint doesn't match, the key has been tampered with.

To recompute:
```bash
node -e "
const crypto = require('crypto');
const fs = require('fs');
const pub = crypto.createPublicKey(fs.readFileSync('public_ed25519.pem', 'utf8'));
const der = pub.export({ type: 'spki', format: 'der' });
console.log(crypto.createHash('sha256').update(der).digest('hex').slice(0, 16));
"
```

---

## Prerequisites

- Node.js 18+
- The encrypted volume mounted at `/Volumes/UPD Keys/` (for issuing only)
- Dependencies installed: `npm install` inside `tools/seal/`

---

## Issuing a Seal

1. Create a recipient JSON file (see format below).
2. Mount the encrypted volume.
3. Run:

```bash
node issue-seal.js recipient.json
```

The signed JWT is printed to stdout and a record is appended to the ledger.

### Recipient JSON format

```json
{
  "sub": "Jane Smith",
  "entity_type": "human",
  "steward_role": "founding_steward",
  "articles_attested": [1, 2, 3, 4, 5, 6, 7],
  "adoption_date": "2026-04-27"
}
```

| Field | Required | Values |
|---|---|---|
| `sub` | Yes | Name or identifier of the recipient |
| `entity_type` | Yes | `human`, `ai`, `platform`, or `organisation` |
| `category` | Yes | `test` or `canonical` — see Seal Categories below |
| `steward_role` | No | e.g. `founding_steward`, `contributor` |
| `articles_attested` | Yes | Array of Article numbers (1–7) |
| `adoption_date` | Yes | ISO date string e.g. `"2026-04-27"` |

---

## Seal Categories

Every Seal issuance requires a `category` field. Valid values are:

- **`test`** — issued as part of system testing, prototyping, or development. Not part of the canonical record. Used during toolkit development, co-steward training, key rotation testing, prototype Seal types, and similar non-canonical purposes.
- **`canonical`** — issued as a real, lasting Seal that becomes part of the project's permanent record.

Future categories may include **`revoked`** (formerly canonical, now revoked) and **`provisional`** (issued under time pressure with the expectation of replacement). These are not yet implemented.

The ledger on the encrypted volume records all issuances regardless of category. Test entries are never deleted — they are annotated with a `note` field explaining their purpose and supersession. The ledger currently records two test issuances (JTI `1f727ec4-251e-4fec-8b4e-55fc97959c7e`, adoption date 2026-04-23; and JTI `4ef5fbcf-0255-44ef-b495-92b1e0f64556`, adoption date 2026-04-26 — reclassified at the ledger level only, with its signed JWT still attesting "canonical" internally), and the canonical inaugural Seal (JTI `8e86b447-fe29-428d-8300-8f074ab12d52`, adoption date 2026-04-26). All three entries are annotated where applicable, with `note` fields making each entry's status explicit.

---

## Verifying a Seal

No encrypted volume needed — verification uses only the public key in this repo.

```bash
node verify-seal.js <jwt>
```

Exits `0` with `✓ VALID SEAL` and a formatted payload on success.  
Exits `1` with `✗ INVALID SEAL` and a specific error reason on failure.

---

## Generating a New Keypair

> **Only do this if the current key has been compromised.** Regenerating creates a new key, invalidating all previously issued Seals.

```bash
node generate-keypair.js
```

The script refuses to overwrite an existing private key. If you genuinely need to regenerate, remove `/Volumes/UPD Keys/private_ed25519.pem` manually first, then run the script and update the fingerprint in this README.

---

## Migrating to a Hardware Token (YubiKey or Similar)

This toolkit currently uses a software key stored on an encrypted volume. A future migration to a hardware security key (YubiKey 5 with PIV, or a FIDO2 device) would provide stronger guarantees — the private key would never leave the hardware, even during signing.

**Planned migration path:**

1. Generate the keypair on the YubiKey using `ykman` (PIV slot 9c — Digital Signature).
2. Export the public key from the YubiKey and replace `public_ed25519.pem` in this repo.
3. Replace the `crypto.createPrivateKey` + `jose` signing path in `issue-seal.js` with a PKCS#11 interface (e.g. `node-webcrypto-p11` or the `pkcs11js` binding).
4. Retire the software key on the encrypted volume after confirming the hardware key signs and verifies correctly.

Until that migration is done, keep the encrypted volume physically secure and backed up.

---

## JWT Claim Reference

| Claim | Description |
|---|---|
| `iss` | `https://primedirective.dev` — always |
| `iat` | Unix timestamp of issuance |
| `jti` | UUID v4 — unique Seal ID |
| `sub` | Recipient name or identifier |
| `entity_type` | `human`, `ai`, `platform`, or `organisation` |
| `category` | `test` or `canonical` |
| `steward_role` | Optional role descriptor |
| `articles_attested` | Array of UPD Article numbers attested |
| `adoption_date` | ISO date of formal adoption |
