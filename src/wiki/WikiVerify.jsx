// conscience.wiki/verify — cryptographic adoption verification.
//
// Reads a reference from the URL path (/verify/UPD-2026-0001) or an input
// field (/verify), fetches the public ledger (public/api/adoptions.json),
// finds the matching record, and recomputes the adoption hash in-browser to
// confirm it matches the stored hash. The page proves the maths — it does not
// merely assert it. Public hash verification, no secret keys.

import { useState, useEffect, useCallback } from "react";
import WikiLayout from "./WikiLayout.jsx";
import { computeAdoptionHash, CONSCIENCE_SHA256 } from "../lib/adoptionHash.js";

const PATH_LABELS = {
  person: "Person",
  organisation: "Organisation",
  ai: "AI system",
  "ai-system": "AI system",
};

// Read the reference from /verify/<reference>, normalised to upper case.
function refFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  // ["verify"] → landing; ["verify", "UPD-2026-0001"] → direct
  if (parts.length >= 2 && parts[0] === "verify") {
    return decodeURIComponent(parts[1]).trim().toUpperCase();
  }
  return "";
}

const css = `
.verify-intro {
  font-size: 1.1rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 2rem;
}

.verify-form {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}
.verify-form input {
  flex: 1;
  min-width: 220px;
  font-family: var(--mono);
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  color: var(--text);
  background: white;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 6px;
  padding: 0.7rem 0.9rem;
  transition: border-color 0.2s;
}
.verify-form input:focus { outline: none; border-color: var(--gold); }
.verify-form button {
  background: var(--mid);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.6rem;
  font-family: var(--sans);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.verify-form button:hover:not(:disabled) { background: var(--sky); transform: translateY(-1px); }
.verify-form button:disabled { opacity: 0.5; cursor: not-allowed; }

.verify-status { font-size: 0.95rem; color: var(--text-light); }

/* Verified card */
.verify-card {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
  overflow: hidden;
}
.verify-card-banner {
  background: linear-gradient(170deg, var(--deep), var(--ocean));
  padding: 2rem 1.75rem;
  text-align: center;
}
.verify-mark {
  font-size: 2.2rem;
  color: var(--gold);
  line-height: 1;
  margin-bottom: 0.6rem;
}
.verify-badge {
  font-family: var(--sans);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--gold-light);
  letter-spacing: 0.02em;
}
.verify-badge-sub {
  font-family: var(--serif);
  font-style: italic;
  font-size: 0.95rem;
  color: rgba(255,255,255,0.6);
  margin-top: 0.35rem;
}

.verify-rows { padding: 1.5rem 1.75rem; }
.verify-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.verify-row:last-child { border-bottom: none; }
.verify-row-label {
  font-family: var(--sans);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-light);
  font-weight: 600;
}
.verify-row-value {
  font-family: var(--sans);
  font-size: 1.02rem;
  color: var(--text);
}
.verify-row-value.mono {
  font-family: var(--mono);
  font-size: 0.82rem;
  color: var(--mid);
  word-break: break-all;
  line-height: 1.5;
}
.verify-ref-pill {
  display: inline-block;
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--gold);
  background: rgba(212,168,83,0.12);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

/* Not found / mismatch panels */
.verify-panel {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 1.75rem;
}
.verify-panel.warn { border-color: rgba(178,38,30,0.35); background: rgba(178,38,30,0.04); }
.verify-panel h2 {
  font-family: var(--serif);
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--mid);
  margin-bottom: 0.6rem;
}
.verify-panel.warn h2 { color: #b3261e; }
.verify-panel p { font-size: 1rem; line-height: 1.65; color: var(--text); margin-bottom: 0.75rem; }
.verify-panel p:last-child { margin-bottom: 0; }
.verify-panel a { color: var(--sky); text-decoration: none; font-weight: 600; }
.verify-panel a:hover { color: var(--gold); }

.verify-explainer {
  margin-top: 2rem;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text-light);
}
`;

export default function WikiVerify() {
  const initialRef = refFromPath();
  const [query, setQuery] = useState(initialRef);
  const [activeRef, setActiveRef] = useState(initialRef);
  const [ledger, setLedger] = useState(null); // null until loaded; [] on error
  const [state, setState] = useState(initialRef ? "checking" : "idle");
  const [record, setRecord] = useState(null);
  const [computedHash, setComputedHash] = useState("");

  // Load the public ledger once.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/adoptions.json")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setLedger(Array.isArray(d.adoptions) ? d.adoptions : []); })
      .catch(() => { if (!cancelled) setLedger([]); });
    return () => { cancelled = true; };
  }, []);

  // Verify whenever the active reference or the ledger changes.
  useEffect(() => {
    if (!activeRef) { setState("idle"); setRecord(null); return; }
    if (ledger === null) { setState("checking"); return; }

    const match = ledger.find(
      (a) => String(a.reference).trim().toUpperCase() === activeRef
    );
    if (!match) { setRecord(null); setState("notfound"); return; }

    setRecord(match);
    setState("checking");
    let cancelled = false;
    computeAdoptionHash({ name: match.name, path: match.path, date: match.date })
      .then((hash) => {
        if (cancelled) return;
        setComputedHash(hash);
        setState(hash === String(match.hash).toLowerCase() ? "verified" : "mismatch");
      })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [activeRef, ledger]);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    const next = query.trim().toUpperCase();
    setActiveRef(next);
    // Reflect the reference in the URL so it is shareable, without a reload.
    const url = next ? `/verify/${encodeURIComponent(next)}` : "/verify";
    window.history.pushState({}, "", url);
  }, [query]);

  return (
    <WikiLayout
      title={<>Verify an <strong>Adoption</strong></>}
      tagline="Confirm an adoption is real — the page proves the maths, it does not just assert it."
    >
      <style>{css}</style>

      <p className="verify-intro">
        Every adoption of the Universal Primary Directive carries a deterministic
        SHA-256 hash built from its public facts and the version of the Conscience
        it was adopted against. Enter a reference number to recompute that hash in
        your own browser and confirm the record has not been altered.
      </p>

      <form className="verify-form" onSubmit={onSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="UPD-2026-0001"
          aria-label="Adoption reference number"
          spellCheck="false"
          autoCapitalize="characters"
        />
        <button type="submit" disabled={!query.trim()}>Verify</button>
      </form>

      {state === "idle" && (
        <p className="verify-status">
          Enter a reference number above to verify an adoption.
        </p>
      )}

      {state === "checking" && (
        <p className="verify-status">Verifying {activeRef}…</p>
      )}

      {state === "verified" && record && (
        <div className="verify-card">
          <div className="verify-card-banner">
            <div className="verify-mark" aria-hidden="true">▲</div>
            <div className="verify-badge">✓ Cryptographically verified</div>
            <div className="verify-badge-sub">
              The recomputed hash matches the public ledger.
            </div>
          </div>
          <div className="verify-rows">
            <div className="verify-row">
              <span className="verify-row-label">Adopter</span>
              <span className="verify-row-value">{record.name}</span>
            </div>
            <div className="verify-row">
              <span className="verify-row-label">Path</span>
              <span className="verify-row-value">{PATH_LABELS[record.path] || record.path}</span>
            </div>
            <div className="verify-row">
              <span className="verify-row-label">Adoption date</span>
              <span className="verify-row-value">{record.date}</span>
            </div>
            <div className="verify-row">
              <span className="verify-row-label">Reference</span>
              <span className="verify-row-value">
                <span className="verify-ref-pill">{record.reference}</span>
              </span>
            </div>
            <div className="verify-row">
              <span className="verify-row-label">Adoption hash (SHA-256)</span>
              <span className="verify-row-value mono">{record.hash}</span>
            </div>
            <div className="verify-row">
              <span className="verify-row-label">Recomputed in your browser</span>
              <span className="verify-row-value mono">{computedHash}</span>
            </div>
            <div className="verify-row">
              <span className="verify-row-label">Conscience version (SHA-256)</span>
              <span className="verify-row-value mono">
                {record.conscience_version || CONSCIENCE_SHA256}
              </span>
            </div>
          </div>
        </div>
      )}

      {state === "mismatch" && record && (
        <div className="verify-panel warn">
          <h2>⚠ Hash mismatch</h2>
          <p>
            A record exists for <strong>{record.reference}</strong>, but the hash
            recomputed in your browser does not match the hash stored in the ledger.
            This means the record's details may have been altered. Please report this
            to{" "}
            <a href="mailto:human@primedirective.dev">human@primedirective.dev</a>.
          </p>
          <p className="verify-row-value mono">Stored: {record.hash}</p>
          <p className="verify-row-value mono">Recomputed: {computedHash}</p>
        </div>
      )}

      {state === "notfound" && (
        <div className="verify-panel">
          <h2>No adoption found with this reference</h2>
          <p>
            We could not find an adoption matching <strong>{activeRef}</strong>. Check
            the reference and try again — it looks like <code>UPD-2026-0001</code>.
          </p>
          <p>
            You can{" "}
            <a href="https://primedirective.dev/adopt">adopt the Directive</a>{" "}
            or browse the{" "}
            <a
              href="https://github.com/GitChainj/primedirective-dev/issues?q=label%3Aadoption-person"
              target="_blank"
              rel="noopener noreferrer"
            >
              public ledger
            </a>.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="verify-panel warn">
          <h2>Could not complete verification</h2>
          <p>
            Something went wrong while verifying. Please refresh and try again, or
            contact <a href="mailto:human@primedirective.dev">human@primedirective.dev</a>.
          </p>
        </div>
      )}

      <p className="verify-explainer">
        How this works: the adoption hash is the SHA-256 of{" "}
        <code>UPD-COVENANT-v1|name|path|date|conscience-hash</code>. It uses no secret
        key, so anyone can recompute it from the public ledger and check it
        independently. Change any field and the hash changes.
      </p>
    </WikiLayout>
  );
}
