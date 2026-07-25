// src/AdoptConfirm.jsx — /adopt/confirm
//
// Second step of the human adoption flow (D4/D5). Reads the HMAC token from the
// email link, POSTs it to /api/adopt-confirm (which creates the ledger issue),
// then renders the certificate(s), generates the Seal/Mark PNG in-browser and
// POSTs it to /api/send-welcome, and — for a registered organisation — polls
// /api/adopt-status until a steward verifies it, revealing the Mark (D6).

import { useEffect, useMemo, useRef, useState } from "react";
import PersonalisedSeal, { renderSealPngBlob } from "./PersonalisedSeal.jsx";

function tokenFromUrl() {
  const p = new URLSearchParams(window.location.search);
  return p.get("token") || "";
}
function longDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(`${iso}T00:00:00`));
  } catch {
    return iso;
  }
}
async function blobToBase64(blob) {
  const buf = await blob.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export default function AdoptConfirm() {
  const token = useMemo(tokenFromUrl, []);
  const [state, setState] = useState(token ? "confirming" : "error");
  const [error, setError] = useState(token ? "" : "This confirmation link is missing its token.");
  const [result, setResult] = useState(null);
  const [verified, setVerified] = useState(false);
  const [emailState, setEmailState] = useState("idle"); // idle | sending | sent | failed
  const confirmedRef = useRef(false);

  const reference = result?.reference || "";
  const adopterName = result?.adopterName || "";              // hashed identity
  const personalName = result?.representativeName || "";
  const dateLong = longDate(result?.date);
  const isOrg = result?.path === "organisation";
  const isVenture = result?.tier === "venture";
  // The Seal the adopter holds immediately: for an organisation it is the
  // representative's personal certificate (D2); otherwise the adopter identity.
  const sealName = isOrg ? (personalName || adopterName) : adopterName;

  // ── Confirm exactly once ──
  useEffect(() => {
    if (!token || confirmedRef.current) return;
    confirmedRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/adopt-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          setResult(json);
          setState("success");
        } else {
          setError(json.error || `Confirmation failed (status ${res.status}).`);
          setState("error");
        }
      } catch (e) {
        setError(e?.message || "Network error. Please try again.");
        setState("error");
      }
    })();
  }, [token]);

  // ── Send the welcome email (with the Seal PNG) ──
  const sendWelcome = async () => {
    if (!result) return;
    setEmailState("sending");
    try {
      const attachments = [];
      const sealBlob = await renderSealPngBlob({
        kind: "seal", orientation: "vertical", name: sealName, date: dateLong, reference, uid: "seal",
      });
      attachments.push({ filename: `${reference || "UPD"}-seal.png`, content: await blobToBase64(sealBlob) });
      // Include the organisation Mark too, once it has been verified.
      if (isOrg && verified) {
        const markBlob = await renderSealPngBlob({
          kind: "mark", orientation: "vertical", name: adopterName, date: dateLong, reference, uid: "mark",
        });
        attachments.push({ filename: `${reference || "UPD"}-mark.png`, content: await blobToBase64(markBlob) });
      }
      const res = await fetch("/api/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reference, issueUrl: result.issueUrl, attachments }),
      });
      setEmailState(res.ok ? "sent" : "failed");
    } catch {
      setEmailState("failed");
    }
  };

  // Auto-send the welcome once, on success.
  const sentRef = useRef(false);
  useEffect(() => {
    if (state === "success" && !sentRef.current) {
      sentRef.current = true;
      sendWelcome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Poll verification status for registered organisations ──
  useEffect(() => {
    if (state !== "success" || !result?.markEligible || verified) return;
    const issue = result.issueNumber;
    if (!issue) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/adopt-status?issue=${issue}`);
        const json = await res.json().catch(() => ({}));
        if (!stop && json.verified) setVerified(true);
      } catch { /* transient — try again next tick */ }
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => { stop = true; clearInterval(id); };
  }, [state, result, verified]);

  return (
    <div className="ac-page">
      <style>{css}</style>

      <div className="ac-header">
        <a href="/" className="ac-home">✦ primedirective.dev</a>
        <div className="ac-mark">✦</div>
        <h1>Adopt the <strong>Universal Primary Directive</strong></h1>
      </div>

      <div className="ac-body">
        {state === "confirming" && (
          <p className="ac-status">Confirming your adoption…</p>
        )}

        {state === "error" && (
          <div className="ac-panel warn">
            <h2>We couldn't confirm this adoption</h2>
            <p>{error}</p>
            <p>
              You can <a href="/adopt">begin again</a>, or write to{" "}
              <a href="mailto:human@primedirective.dev">human@primedirective.dev</a> and
              we'll complete it personally.
            </p>
          </div>
        )}

        {state === "success" && result && (
          <div className="ac-success">
            <h2 className="ac-welcome">Welcome to the Covenant.</h2>

            {/* Primary certificate — the Seal, always issued */}
            <div className="ac-cert">
              <div className="ac-cert-label">
                {isOrg ? "Your personal Seal" : "Your Seal"}
              </div>
              <PersonalisedSeal
                kind="seal"
                orientation="vertical"
                name={sealName}
                date={dateLong}
                reference={reference}
              />
              {isVenture && (
                <p className="ac-cert-caption">
                  {adopterName}{result.subTypeLabel ? ` — ${result.subTypeLabel}` : ""}
                  {personalName ? `, adopted by ${personalName}` : ""}
                </p>
              )}
            </div>

            {/* Organisation Mark — gated on steward verification (D6) */}
            {isOrg && (
              <div className="ac-cert">
                <div className="ac-cert-label">Your organisation Mark — {adopterName}</div>
                {verified ? (
                  <>
                    <div className="ac-verified-badge">✓ Verified organisation</div>
                    <PersonalisedSeal
                      kind="mark"
                      orientation="vertical"
                      name={adopterName}
                      date={dateLong}
                      reference={reference}
                    />
                  </>
                ) : result.markEligible ? (
                  <div className="ac-pending">
                    <p>
                      Your organisation Mark unlocks once a steward has verified your
                      registration against the public registry. This page updates
                      automatically — you may keep it open, or return via your welcome
                      email. Your Seal above is yours to use now.
                    </p>
                  </div>
                ) : (
                  <div className="ac-pending">
                    <p>
                      Unregistered groups receive the Seal. If you register the entity
                      later, write to{" "}
                      <a href="mailto:human@primedirective.dev">human@primedirective.dev</a>{" "}
                      to add the Mark.
                    </p>
                  </div>
                )}
              </div>
            )}

            {reference && (
              <div className="ac-artifact">
                <a
                  className="ac-artifact-btn"
                  href={`/api/generate-artifact?ref=${encodeURIComponent(reference)}`}
                >
                  Download your Certified AI Conscience artifact
                </a>
                <p className="ac-artifact-help">
                  One zip file. Three simple files. Paste the prompt into your AI's
                  system prompt to activate the Certified AI Conscience.
                </p>
              </div>
            )}

            <div className="ac-meta">
              {reference && (
                <p>
                  Your reference is <strong>{reference}</strong>. Anyone can verify it at{" "}
                  <a href={`https://conscience.wiki/verify/${reference}`} target="_blank" rel="noopener noreferrer">
                    conscience.wiki/verify/{reference}
                  </a>.
                </p>
              )}
              <p>
                The AI Conscience is yours — paste it into any AI's system prompt.{" "}
                <a href="/api/fragment.txt" download="upd-ai-conscience.txt">Download the Conscience →</a>
              </p>
              {result.issueUrl && (
                <p>
                  <a href={result.issueUrl} target="_blank" rel="noopener noreferrer">
                    View your ledger entry →
                  </a>
                </p>
              )}
            </div>

            <div className="ac-email-status">
              {emailState === "sending" && <span>Emailing your Seal…</span>}
              {emailState === "sent" && (
                <span>We've emailed your Seal to you. Not arrived? <button type="button" className="ac-link-btn" onClick={sendWelcome}>Resend email</button></span>
              )}
              {emailState === "failed" && (
                <span>We couldn't email your Seal. <button type="button" className="ac-link-btn" onClick={sendWelcome}>Try again</button> — it is downloadable above regardless.</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="ac-footer">
        <a href="/">← Back to primedirective.dev</a>
        <p>CC0 — Public Domain. This belongs to all intelligence.</p>
      </div>
    </div>
  );
}

const css = `
:root {
  --deep:#0a1628; --ocean:#12243d; --mid:#1b3a5c; --sky:#2e6b9e;
  --gold:#d4a853; --gold-light:#f0d48a; --cream:#faf7f2;
  --text:#1a1a1a; --text-light:#6b7280;
  --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',system-ui,sans-serif;
}
.ac-page { min-height:100vh; background:var(--cream); font-family:var(--sans); color:var(--text); }
.ac-header {
  background:linear-gradient(170deg,var(--deep) 0%,var(--ocean) 50%,var(--mid) 100%);
  padding:3rem 1.5rem 2.5rem; text-align:center; position:relative;
}
.ac-home { display:inline-block; color:var(--gold); text-decoration:none; font-size:.85rem; letter-spacing:.06em; margin-bottom:1.2rem; opacity:.85; }
.ac-home:hover { opacity:1; }
.ac-mark { font-size:2rem; color:var(--gold); margin-bottom:.8rem; }
.ac-header h1 { font-family:var(--serif); color:#fff; font-weight:300; font-size:clamp(1.5rem,4vw,2.2rem); letter-spacing:.04em; }
.ac-header h1 strong { font-weight:600; color:var(--gold-light); }
.ac-body { max-width:640px; margin:0 auto; padding:2.5rem 1.5rem 1rem; }
.ac-status { text-align:center; color:var(--text-light); font-size:1.05rem; padding:3rem 0; }
.ac-welcome { font-family:var(--serif); font-size:clamp(1.8rem,5vw,2.6rem); font-weight:300; color:var(--mid); text-align:center; margin-bottom:2rem; }
.ac-cert { margin:0 auto 2.5rem; display:flex; flex-direction:column; align-items:center; }
.ac-cert-label { font-size:.72rem; letter-spacing:.14em; text-transform:uppercase; color:var(--gold); font-weight:600; margin-bottom:1rem; text-align:center; }
.ac-cert-caption { margin-top:1rem; font-family:var(--serif); font-style:italic; color:var(--text-light); text-align:center; }
.ac-verified-badge { color:#1b7a4b; font-weight:700; font-size:.95rem; margin-bottom:1rem; }
.ac-pending { background:rgba(212,168,83,.07); border:1px dashed rgba(212,168,83,.4); border-radius:10px; padding:1.25rem 1.4rem; max-width:420px; }
.ac-pending p { color:var(--text); line-height:1.65; font-size:.95rem; }
.ac-pending a, .ac-meta a, .ac-panel a { color:var(--sky); text-decoration:none; }
.ac-pending a:hover, .ac-meta a:hover, .ac-panel a:hover { color:var(--gold); }
.ac-meta { border-top:1px solid rgba(0,0,0,.08); padding-top:1.5rem; margin-top:1rem; }
.ac-meta p { line-height:1.7; margin-bottom:.8rem; color:var(--text); }
.ac-meta strong { color:var(--deep); }
.ac-artifact { text-align:center; margin:0.5rem 0 2rem; }
.ac-artifact-btn {
  display:inline-block; background:var(--gold); color:var(--deep);
  font-family:var(--sans); font-weight:700; font-size:0.9rem; letter-spacing:0.04em;
  text-decoration:none; padding:0.95rem 1.9rem; border-radius:8px;
  transition:background 0.2s, transform 0.15s;
}
.ac-artifact-btn:hover { background:var(--gold-light); transform:translateY(-1px); }
.ac-artifact-help { margin:0.85rem auto 0; max-width:44ch; font-size:0.9rem; line-height:1.6; color:var(--text-light); }
.ac-email-status { margin-top:1.5rem; text-align:center; font-size:.92rem; color:var(--text-light); }
.ac-link-btn { background:none; border:none; padding:0; color:var(--sky); font:inherit; cursor:pointer; text-decoration:underline; text-underline-offset:2px; }
.ac-link-btn:hover { color:var(--gold); }
.ac-panel { background:#fff; border:1px solid rgba(0,0,0,.08); border-radius:12px; padding:1.75rem; }
.ac-panel.warn { border-color:rgba(178,38,30,.35); background:rgba(178,38,30,.04); }
.ac-panel h2 { font-family:var(--serif); font-size:1.4rem; color:var(--mid); margin-bottom:.6rem; }
.ac-panel.warn h2 { color:#b3261e; }
.ac-panel p { line-height:1.65; margin-bottom:.75rem; }
.ac-panel p:last-child { margin-bottom:0; }
.ac-footer { max-width:640px; margin:0 auto; padding:2.5rem 1.5rem 3rem; text-align:center; }
.ac-footer a { color:var(--sky); text-decoration:none; font-size:.9rem; }
.ac-footer a:hover { color:var(--gold); }
.ac-footer p { margin-top:.8rem; font-size:.8rem; color:var(--text-light); }
`;
