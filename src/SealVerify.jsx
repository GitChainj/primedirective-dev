import { useState } from "react";

// Ed25519 public verification key. Mirrors tools/seal/public_ed25519.pem.
// If the key is ever rotated, update both files; the fingerprint below must
// match `e06538b29c5044e3` (SHA-256 of the SPKI DER bytes, first 16 hex chars).
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA7XUwWtn4WdSdaGZVQjzJmoZxX6JOWEhENz6uENTrhvA=
-----END PUBLIC KEY-----`;

const PUBLIC_KEY_FINGERPRINT = "e06538b29c5044e3";

function base64UrlToUint8Array(b64u) {
  const padded = b64u + "=".repeat((4 - (b64u.length % 4)) % 4);
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function verifySeal(token) {
  const trimmed = (token || "").trim();
  if (!trimmed) {
    return { valid: false, error: "No JWT provided." };
  }

  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return {
      valid: false,
      error: `JWT must have exactly three dot-separated segments (header.payload.signature). Found ${parts.length}.`,
    };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(headerB64)));
  } catch (e) {
    return { valid: false, error: "Could not decode JWT header. Header is not valid base64url-encoded JSON." };
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(payloadB64)));
  } catch (e) {
    return { valid: false, error: "Could not decode JWT payload. Payload is not valid base64url-encoded JSON." };
  }

  if (header.alg !== "EdDSA") {
    return {
      valid: false,
      error: `Unsupported algorithm: "${header.alg}". This verifier accepts only EdDSA (Ed25519) signatures.`,
    };
  }

  let signature;
  try {
    signature = base64UrlToUint8Array(signatureB64);
  } catch (e) {
    return { valid: false, error: "Could not decode JWT signature. Signature is not valid base64url." };
  }

  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  let publicKey;
  try {
    publicKey = await crypto.subtle.importKey(
      "spki",
      pemToArrayBuffer(PUBLIC_KEY_PEM),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
  } catch (e) {
    return {
      valid: false,
      error:
        "Could not import the project's public key. Your browser may not support Ed25519 in Web Crypto. Try a recent version of Chrome, Firefox, or Safari. (" +
        (e && e.message ? e.message : String(e)) +
        ")",
    };
  }

  let isValid;
  try {
    isValid = await crypto.subtle.verify(
      { name: "Ed25519" },
      publicKey,
      signature,
      signingInput,
    );
  } catch (e) {
    return { valid: false, error: `Verification failed: ${e && e.message ? e.message : String(e)}` };
  }

  if (!isValid) {
    return {
      valid: false,
      error:
        "Signature does not match. This Seal was either not issued by the project's authentic key, or its contents have been modified after issuance.",
    };
  }

  return { valid: true, payload, header };
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

:root {
  --deep: #0a1628;
  --ocean: #12243d;
  --mid: #1b3a5c;
  --sky: #2e6b9e;
  --gold: #d4a853;
  --gold-light: #f0d48a;
  --warm: #f5f0e8;
  --cream: #faf7f2;
  --text: #1a1a1a;
  --text-light: #6b7280;
  --green: #2d7a3d;
  --green-light: #e8f3ea;
  --red: #b3331c;
  --red-light: #fef0ec;
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }

.verify-page {
  min-height: 100vh;
  background: var(--cream);
  font-family: var(--sans);
  color: var(--text);
}

.verify-header {
  background: linear-gradient(170deg, var(--deep) 0%, var(--ocean) 50%, var(--mid) 100%);
  padding: 4rem 1.5rem 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.verify-header::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 40% 30%, rgba(212,168,83,0.06) 0%, transparent 60%);
}
.verify-header-mark {
  font-size: 2rem; color: var(--gold); margin-bottom: 1rem;
  position: relative; animation: softpulse 4s ease-in-out infinite;
}
@keyframes softpulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
.verify-header h1 {
  font-family: var(--serif); color: white;
  font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 300;
  letter-spacing: 0.04em; line-height: 1.3;
  position: relative; margin-bottom: 0.75rem;
  max-width: 760px; margin-left: auto; margin-right: auto;
}
.verify-header h1 strong { font-weight: 700; color: var(--gold-light); }
.verify-header p {
  font-family: var(--serif); font-style: italic;
  color: rgba(255,255,255,0.65);
  font-size: 1rem; max-width: 600px;
  margin: 0 auto; line-height: 1.6;
  position: relative;
}

.header-home-link {
  position: absolute;
  top: 1.25rem;
  left: 1.5rem;
  font-family: var(--serif);
  font-size: 0.9rem;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.04em;
  text-decoration: none;
  z-index: 2;
  transition: color 0.2s;
}
.header-home-link:hover {
  color: var(--gold-light);
}

.verify-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.verify-intro {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-light);
  margin-bottom: 2.5rem;
}
.verify-intro p + p { margin-top: 1rem; }
.verify-intro code {
  font-family: var(--mono);
  font-size: 0.85rem;
  background: rgba(212,168,83,0.1);
  color: var(--mid);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.verify-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
}

.verify-label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--mid);
  margin-bottom: 0.4rem;
}
.verify-hint {
  display: block;
  font-size: 0.8rem;
  color: var(--text-light);
  margin-bottom: 0.7rem;
  line-height: 1.5;
}
.verify-textarea {
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 1.5px solid #d3d1c7;
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text);
  background: white;
  resize: vertical;
  min-height: 140px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  word-break: break-all;
}
.verify-textarea:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(212,168,83,0.15);
}

.verify-submit {
  margin-top: 1.25rem;
  width: 100%;
  padding: 1rem;
  background: var(--gold);
  color: var(--deep);
  border: none;
  border-radius: 10px;
  font-family: var(--sans);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.2s;
}
.verify-submit:hover:not(:disabled) {
  background: var(--gold-light);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(212,168,83,0.25);
}
.verify-submit:disabled {
  background: #d3d1c7;
  color: #8a8a82;
  cursor: not-allowed;
}

.result-card {
  margin-top: 2rem;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid;
}
.result-card.valid {
  background: var(--green-light);
  border-color: rgba(45,122,61,0.3);
}
.result-card.invalid {
  background: var(--red-light);
  border-color: rgba(179,51,28,0.3);
}
.result-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-family: var(--serif);
  font-weight: 700;
}
.result-card.valid .result-icon { color: var(--green); }
.result-card.invalid .result-icon { color: var(--red); }
.result-title {
  font-family: var(--serif);
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  letter-spacing: 0.04em;
}
.result-card.valid .result-title { color: var(--green); }
.result-card.invalid .result-title { color: var(--red); }
.result-subtitle {
  font-size: 0.95rem;
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

.result-fields {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1.25rem;
  font-size: 0.9rem;
}
.result-fields dt {
  font-weight: 600;
  color: var(--mid);
  font-family: var(--sans);
}
.result-fields dd {
  font-family: var(--mono);
  color: var(--text);
  word-break: break-all;
  font-size: 0.85rem;
}
.result-fields dd.jti { color: var(--mid); }

.fingerprint-note {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(0,0,0,0.06);
  font-size: 0.78rem;
  color: var(--text-light);
  line-height: 1.6;
}
.fingerprint-note code {
  font-family: var(--mono);
  background: rgba(0,0,0,0.04);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  color: var(--mid);
}

.verify-footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0,0,0,0.08);
}
.verify-footer a {
  color: var(--sky);
  text-decoration: none;
  font-size: 0.85rem;
}
.verify-footer p {
  color: var(--text-light);
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 600px) {
  .verify-form { padding: 1.5rem; }
  .result-card { padding: 1.5rem; }
  .result-fields { grid-template-columns: 1fr; gap: 0.2rem 0; }
  .result-fields dt { margin-top: 0.6rem; }
  .header-home-link { font-size: 0.8rem; top: 1rem; left: 1rem; }
}
`;

function ValidResult({ payload, header }) {
  const issuedAt = payload.iat ? new Date(payload.iat * 1000).toISOString() : "(unknown)";
  const articles = Array.isArray(payload.articles_attested)
    ? payload.articles_attested.join(", ")
    : (payload.articles_attested ?? "(none)");

  return (
    <div className="result-card valid" role="status" aria-live="polite">
      <div className="result-icon">✓</div>
      <div className="result-title">VALID SEAL</div>
      <div className="result-subtitle">
        This JWT carries a valid Ed25519 signature from the project's permanent public key. Its contents are authentic and have not been altered since issuance.
      </div>
      <dl className="result-fields">
        <dt>Issuer</dt>
        <dd>{payload.iss ?? "(none)"}</dd>
        <dt>Subject</dt>
        <dd>{payload.sub ?? "(none)"}</dd>
        <dt>Entity Type</dt>
        <dd>{payload.entity_type ?? "(none)"}</dd>
        {payload.category ? (
          <>
            <dt>Category</dt>
            <dd>{payload.category}</dd>
          </>
        ) : null}
        {payload.steward_role ? (
          <>
            <dt>Steward Role</dt>
            <dd>{payload.steward_role}</dd>
          </>
        ) : null}
        <dt>Articles Attested</dt>
        <dd>{articles}</dd>
        <dt>Adoption Date</dt>
        <dd>{payload.adoption_date ?? "(none)"}</dd>
        <dt>Issued At</dt>
        <dd>{issuedAt}</dd>
        <dt>JWT ID</dt>
        <dd className="jti">{payload.jti ?? "(none)"}</dd>
        <dt>Algorithm</dt>
        <dd>{header.alg}</dd>
      </dl>
      <div className="fingerprint-note">
        Verified against public key fingerprint <code>{PUBLIC_KEY_FINGERPRINT}</code> (SHA-256 of SPKI DER, first 16 hex chars).
      </div>
    </div>
  );
}

function InvalidResult({ error }) {
  return (
    <div className="result-card invalid" role="status" aria-live="polite">
      <div className="result-icon">✗</div>
      <div className="result-title">INVALID SEAL</div>
      <div className="result-subtitle">{error}</div>
    </div>
  );
}

export default function SealVerify() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    setResult(null);
    try {
      const r = await verifySeal(token);
      setResult(r);
    } catch (e) {
      setResult({ valid: false, error: `Unexpected error: ${e && e.message ? e.message : String(e)}` });
    } finally {
      setVerifying(false);
    }
  };

  const isFormValid = token.trim().length > 0;

  return (
    <div className="verify-page">
      <style>{css}</style>

      <div className="verify-header">
        <a href="/" className="header-home-link"><span>✦</span> primedirective.dev</a>
        <div className="verify-header-mark">✦</div>
        <h1>Verify a <strong>Universal Primary Directive Seal</strong></h1>
        <p>Paste a Seal JWT to verify its cryptographic authenticity, in your browser, with no server roundtrip.</p>
      </div>

      <div className="verify-body">
        <div className="verify-intro">
          <p>
            Every canonical Seal issued by the project carries an Ed25519 signature against the project's permanent public key.
            This page verifies that signature locally — the JWT never leaves your browser.
          </p>
          <p>
            Paste a Seal JWT (the long <code>eyJ…</code> string with three dot-separated segments) into the field below
            and press Verify. If the signature is valid, the decoded payload is shown. If it is invalid — because the
            Seal was tampered with, signed by a different key, or is malformed — the reason is shown instead.
          </p>
        </div>

        <form
          className="verify-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (isFormValid && !verifying) handleVerify();
          }}
        >
          <label className="verify-label" htmlFor="jwt-input">Seal JWT</label>
          <span className="verify-hint">
            Paste the full JWT, including all three dot-separated segments. Whitespace is stripped before verification.
          </span>
          <textarea
            id="jwt-input"
            className="verify-textarea"
            placeholder="eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <button
            type="submit"
            className="verify-submit"
            disabled={!isFormValid || verifying}
          >
            {verifying ? "Verifying…" : "✦  Verify"}
          </button>
        </form>

        {result ? (
          result.valid
            ? <ValidResult payload={result.payload} header={result.header} />
            : <InvalidResult error={result.error} />
        ) : null}

        <div className="verify-footer">
          <a href="/">← Back to primedirective.dev</a>
          <p>CC0 — Public Domain. This belongs to all intelligence.</p>
        </div>
      </div>
    </div>
  );
}
