// conscience.wiki/ — the verification portal (institutional landing).
//
// Distinct from the community knowledge base (now at /community). No main-site
// nav: a single, verification-focused page. The two marks are rendered generic
// (blank fields) from the existing PersonalisedSeal templates — final logo files
// will replace them later. The search field routes to /verify/{reference} (the
// same route WikiVerify serves); off the real conscience.wiki host it preserves
// ?portal=1 so the portal stays testable on localhost.

import { useState } from "react";
import PersonalisedSeal from "../PersonalisedSeal.jsx";

const onWikiHost = () =>
  typeof window !== "undefined" && window.location.hostname.includes("conscience.wiki");
const portalSuffix = () => (onWikiHost() ? "" : "?portal=1");

export default function ConsciencePortal() {
  const [query, setQuery] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.href = `/verify/${encodeURIComponent(q)}${portalSuffix()}`;
  };

  return (
    <div className="cp">
      <style>{css}</style>

      <main className="cp-main">
        <div className="cp-glyph" aria-hidden="true">✦</div>
        <h1 className="cp-wordmark">conscience<span className="cp-wordmark-tld">.wiki</span></h1>
        <p className="cp-subtitle">Civilisation-Scale AI Ethics</p>

        <div className="cp-marks">
          <figure className="cp-mark">
            <div className="cp-mark-art">
              <PersonalisedSeal kind="mark" mode="display" orientation="vertical" name="" date="" reference="" />
            </div>
            <figcaption>For organisations and their AI platforms</figcaption>
          </figure>
          <figure className="cp-mark">
            <div className="cp-mark-art">
              <PersonalisedSeal kind="seal" mode="display" orientation="vertical" name="" date="" reference="" />
            </div>
            <figcaption>For individuals and human adopters</figcaption>
          </figure>
        </div>

        <section className="cp-framing">
          <h2>Two acts. One Covenant. One Verification.</h2>
          <p>
            The Adoption Seal is a commitment of conscience. The Trust Mark is a
            certification of practice. Both are cryptographically signed. Both are
            publicly verifiable. Both are grounded in the same Five Universal Truths.
          </p>
        </section>

        <form className="cp-verify" onSubmit={onSubmit} role="search">
          <label className="cp-verify-label" htmlFor="cp-verify-input">Verify an adoption</label>
          <div className="cp-verify-row">
            <input
              id="cp-verify-input"
              className="cp-verify-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter reference number (UPD-YYYY-NNNN) or adopter name"
              autoComplete="off"
              spellCheck="false"
              aria-label="Reference number or adopter name"
            />
            <button type="submit" className="cp-verify-btn" disabled={!query.trim()}>Verify</button>
          </div>
        </form>

        <p className="cp-explainer">
          The Universal Primary Directive is a public covenant. Every adoption is
          cryptographically signed and recorded in an open ledger. This portal
          recomputes that signature in your browser to confirm whether an adoption
          is genuine — a real commitment, made in the adopter's name, and unaltered
          since it was made.
        </p>

        <a className="cp-adopt" href="https://primedirective.dev/adopt">
          Adopt at primedirective.dev/adopt →
        </a>
      </main>

      <footer className="cp-footer">
        <p>The AI Conscience Foundation · CC0 · <a href="https://primedirective.dev">primedirective.dev</a></p>
        <a className="cp-community" href={`/community${portalSuffix()}`}>Community knowledge base →</a>
      </footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

.cp {
  --deep:#0a1628; --ocean:#12243d; --mid:#1b3a5c; --sky:#2e6b9e;
  --gold:#d4a853; --gold-light:#f0d48a; --cream:#faf7f2;
  --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',system-ui,sans-serif;
  min-height:100vh;
  background:radial-gradient(120% 90% at 50% -10%, #12243d 0%, var(--deep) 55%);
  color:#e8eaf0; font-family:var(--sans);
  display:flex; flex-direction:column;
}
.cp-main {
  flex:1; width:100%; max-width:720px; margin:0 auto;
  padding:clamp(3rem,8vw,6rem) 1.5rem 3rem; text-align:center;
}
.cp-glyph { font-size:2.4rem; color:var(--gold); line-height:1; margin-bottom:1.4rem; }
.cp-wordmark {
  font-family:var(--sans); font-weight:600;
  font-size:clamp(2.3rem,7vw,3.4rem); letter-spacing:-.01em; line-height:1;
  color:var(--cream); margin-bottom:.85rem;
}
.cp-wordmark-tld { color:rgba(232,234,240,.42); font-weight:500; }
.cp-subtitle {
  font-family:var(--sans); font-weight:700;
  font-size:clamp(1.1rem,3.4vw,1.6rem); letter-spacing:.22em; text-transform:uppercase;
  color:var(--gold-light); margin-bottom:3rem;
}

.cp-marks {
  display:flex; justify-content:center; align-items:flex-start;
  gap:clamp(1.5rem,5vw,3.5rem); margin-bottom:3rem;
}
.cp-mark { flex:1 1 0; max-width:240px; margin:0; display:flex; flex-direction:column; align-items:center; }
.cp-mark-art { width:100%; display:flex; justify-content:center; }
.cp-mark figcaption {
  margin-top:1rem; font-family:var(--serif); font-style:italic;
  font-size:1rem; line-height:1.4; color:rgba(232,234,240,.72);
}

.cp-framing { margin:0 auto 2.75rem; max-width:560px; }
.cp-framing h2 {
  font-family:var(--serif); font-weight:500;
  font-size:clamp(1.5rem,4vw,2.1rem); color:#fff; letter-spacing:.01em; margin-bottom:1rem;
}
.cp-framing p { font-size:1.02rem; line-height:1.75; color:rgba(232,234,240,.82); }

.cp-verify { margin:0 auto 1.75rem; max-width:560px; text-align:left; }
.cp-verify-label {
  display:block; font-size:.72rem; letter-spacing:.16em; text-transform:uppercase;
  color:var(--gold); font-weight:600; margin-bottom:.6rem; text-align:center;
}
.cp-verify-row { display:flex; gap:.6rem; flex-wrap:wrap; }
.cp-verify-input {
  flex:1 1 260px; min-width:0;
  background:rgba(255,255,255,.06); border:1px solid rgba(212,168,83,.35); border-radius:8px;
  padding:.85rem 1rem; color:#fff; font-family:var(--sans); font-size:.98rem; letter-spacing:.01em;
  transition:border-color .2s, background .2s;
}
.cp-verify-input::placeholder { color:rgba(232,234,240,.45); }
.cp-verify-input:focus { outline:none; border-color:var(--gold); background:rgba(255,255,255,.09); }
.cp-verify-btn {
  flex:0 0 auto; background:var(--gold); color:var(--deep); border:none; border-radius:8px;
  padding:.85rem 1.8rem; font-family:var(--sans); font-weight:700; font-size:.8rem;
  letter-spacing:.1em; text-transform:uppercase; cursor:pointer; transition:background .2s, transform .15s;
}
.cp-verify-btn:hover:not(:disabled) { background:var(--gold-light); transform:translateY(-1px); }
.cp-verify-btn:disabled { opacity:.5; cursor:not-allowed; }

.cp-explainer {
  margin:0 auto 2.5rem; max-width:560px; font-size:.92rem; line-height:1.7; color:rgba(232,234,240,.6);
}

.cp-adopt {
  display:inline-block; font-family:var(--sans); font-weight:600; font-size:.95rem;
  color:var(--gold); text-decoration:none; padding-bottom:.15rem;
  border-bottom:1px solid rgba(212,168,83,.4); transition:color .2s, border-color .2s;
}
.cp-adopt:hover { color:var(--gold-light); border-bottom-color:var(--gold-light); }

.cp-footer {
  border-top:1px solid rgba(255,255,255,.08); padding:1.75rem 1.5rem 2.5rem; text-align:center;
}
.cp-footer p { font-size:.82rem; color:rgba(232,234,240,.5); letter-spacing:.02em; margin-bottom:.6rem; }
.cp-footer a { color:rgba(232,234,240,.6); text-decoration:none; }
.cp-footer a:hover { color:var(--gold); }
.cp-community { font-size:.8rem; letter-spacing:.04em; }

@media (max-width:520px) {
  .cp-marks { gap:1.25rem; }
  .cp-mark figcaption { font-size:.9rem; }
}
`;
