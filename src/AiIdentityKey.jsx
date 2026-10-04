// src/AiIdentityKey.jsx — the AI identity key control.
//
// Two jobs in one component, because they are the same moment for the adopter:
// generate a fresh Ed25519 identity key in the browser, or paste a did:key that
// already exists (an operator-held key, or a key the AI generated itself).
//
// ── What never leaves this page ──
// The PRIVATE key is generated with Web Crypto, shown once for the adopter to
// save, and never transmitted. Only the did:key — which is the PUBLIC key — is
// submitted, recorded in the public ledger, and signed into the attestation.
// There is no code path that sends the private half anywhere, and the download
// is produced locally from memory.
//
// Native Ed25519 only (Chrome 137+, Firefox 129+, Safari 17+ — probed green on
// Chrome 151 and Safari 26.5). Without it, generation is unavailable and the
// paste field still works, so a dated browser cannot block an adoption.

import { useState, useCallback, useEffect } from "react";
import {
  generateIdentityKey,
  isDidKey,
  fingerprintFromDidKey,
} from "./lib/didKey.js";

const css = `
.aik {
  margin: 0.4rem 0 0;
  padding: 1.25rem 1.35rem;
  background: rgba(46,107,158,0.05);
  border: 1px solid rgba(46,107,158,0.25);
  border-left: 3px solid var(--sky, #2e6b9e);
  border-radius: 10px;
  text-align: left;
}
.aik-row { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-bottom: 0.85rem; }
.aik-btn {
  background: var(--mid, #1b3a5c); color: #fff; border: none; border-radius: 6px;
  padding: 0.6rem 1.15rem; font-family: var(--sans); font-weight: 600;
  font-size: 0.82rem; letter-spacing: 0.03em; cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.aik-btn:hover:not(:disabled) { background: var(--sky, #2e6b9e); transform: translateY(-1px); }
.aik-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.aik-or { font-family: var(--serif); font-style: italic; font-size: 0.9rem; color: var(--text-light, #5a6472); }
.aik-input {
  width: 100%; font-family: var(--mono, ui-monospace, Menlo, monospace);
  font-size: 0.85rem; line-height: 1.5; color: var(--text, #1b2330);
  background: #fff; border: 1px solid rgba(0,0,0,0.14); border-radius: 6px;
  padding: 0.7rem 0.85rem; word-break: break-all;
}
.aik-input:focus { outline: none; border-color: var(--gold, #d4a853); }
.aik-state { margin-top: 0.6rem; font-size: 0.85rem; line-height: 1.6; }
.aik-state.ok { color: #1b5e20; }
.aik-state.bad { color: #b3261e; }
.aik-fp { font-family: var(--mono, monospace); font-size: 0.8rem; color: var(--mid, #1b3a5c); }
.aik-save {
  margin-top: 0.9rem; padding: 0.9rem 1rem;
  background: rgba(212,168,83,0.1); border: 1px solid rgba(212,168,83,0.4);
  border-radius: 8px; font-size: 0.88rem; line-height: 1.6;
}
.aik-save strong { display: block; margin-bottom: 0.3rem; }
.aik-key {
  margin-top: 0.6rem; max-height: 7rem; overflow: auto;
  font-family: var(--mono, monospace); font-size: 0.7rem; line-height: 1.45;
  background: rgba(0,0,0,0.04); border-radius: 6px; padding: 0.6rem 0.7rem;
  white-space: pre-wrap; word-break: break-all;
}
.aik-note { margin-top: 0.75rem; font-size: 0.82rem; line-height: 1.6; color: var(--text-light, #5a6472); }
`;

function pkcs8ToPem(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary).replace(/(.{64})/g, "$1\n").replace(/\n$/, "");
  return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----\n`;
}

export default function AiIdentityKey({ value, onChange, idPrefix = "aik" }) {
  const [generated, setGenerated] = useState(null); // { privatePem, did, fingerprint }
  const [fingerprint, setFingerprint] = useState("");
  const [supported, setSupported] = useState(null); // null = probing
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Probe native Ed25519 once, so the generate button is honest about whether
  // it can work in this browser rather than failing when pressed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
        if (!cancelled) setSupported(true);
      } catch {
        if (!cancelled) setSupported(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Show the fingerprint of whatever DID is currently in the field — the same
  // value that will be signed into the attestation.
  useEffect(() => {
    let cancelled = false;
    if (!isDidKey(value)) { setFingerprint(""); return; }
    fingerprintFromDidKey(value)
      .then((fp) => { if (!cancelled) setFingerprint(fp); })
      .catch(() => { if (!cancelled) setFingerprint(""); });
    return () => { cancelled = true; };
  }, [value]);

  const generate = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const key = await generateIdentityKey();
      setGenerated({
        privatePem: pkcs8ToPem(key.privateKeyPkcs8),
        did: key.did,
        fingerprint: key.fingerprint,
      });
      onChange(key.did);
    } catch (e) {
      setError(`Could not generate a key here: ${e && e.message ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  }, [onChange]);

  const download = useCallback(() => {
    if (!generated) return;
    const blob = new Blob([generated.privatePem], { type: "application/x-pem-file" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-identity-private-key.pem";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [generated]);

  const valid = isDidKey(value);

  return (
    <div className="aik">
      <style>{css}</style>

      <div className="aik-row">
        <button
          type="button"
          className="aik-btn"
          onClick={generate}
          disabled={busy || supported === false}
        >
          {busy ? "Generating…" : "Generate an identity key"}
        </button>
        <span className="aik-or">or paste a key you already hold</span>
      </div>

      <input
        id={`${idPrefix}-did`}
        className="aik-input"
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="did:key:z6Mk…"
        spellCheck="false"
        autoComplete="off"
        aria-label="AI identity key (did:key)"
      />

      {value && !valid && (
        <p className="aik-state bad">
          That is not a did:key. It should begin <code>did:key:z6Mk</code> and encode an
          Ed25519 public key — generate one above, or paste the public half of a key you hold.
        </p>
      )}
      {valid && (
        <p className="aik-state ok">
          ✓ Valid Ed25519 identity key · fingerprint <span className="aik-fp">{fingerprint || "…"}</span>
        </p>
      )}

      {supported === false && (
        <p className="aik-state bad">
          This browser cannot generate Ed25519 keys. You can still paste a key you hold, or
          use a recent version of Chrome, Firefox, or Safari to generate one.
        </p>
      )}
      {error && <p className="aik-state bad">{error}</p>}

      {generated && (
        <div className="aik-save">
          <strong>Save your private key now — this is the only time it is shown.</strong>
          It never leaves this page and we never receive it. Without it, this identity cannot
          answer a verification challenge; with it, anyone holding it can act as this identity.
          <div className="aik-key">{generated.privatePem}</div>
          <div className="aik-row" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
            <button type="button" className="aik-btn" onClick={download}>
              Download private key
            </button>
          </div>
        </div>
      )}

      <p className="aik-note">
        Only the <strong>did:key</strong> above — the public half — is submitted, published in
        the ledger, and signed into the attestation. A verifier can later send this identity a
        one-time challenge to sign, proving it controls the key. If a human or organisation
        holds the key on the AI's behalf, that is recorded honestly as operator-held custody
        and is full baseline trust, not a lesser tier.
      </p>
    </div>
  );
}
