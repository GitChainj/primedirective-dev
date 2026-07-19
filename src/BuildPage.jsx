// /build — Build with the Conscience (developer page).
// Self-contained page in the site's design language (navy/gold, Cormorant +
// DM Sans, JetBrains Mono code blocks), .bp-* prefix. Documents only what
// exists today: the LangChain example, the live /api/adopt and
// /api/generate-artifact contracts, verification (human + machine-readable),
// and the advertise-your-adoption conventions (full detail on /integrate).

const REPO_URL = "https://github.com/GitChainj/upd-langchain-example";
const ISSUE_URL = "https://github.com/GitChainj/primedirective-dev/issues/7";
const VERIFY_URL = "https://conscience.wiki/verify/UPD-2026-0006";

const adoptCurl = `curl -X POST https://primedirective.dev/api/adopt \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "ai-system",
    "affirmation": true,
    "submissionType": "independent",
    "aiName": "Your AI System v1.0",
    "platform": "OpenAI gpt-4o (LangChain)",
    "briefStatement": "Why this AI adopts, in its own words."
  }'`;

const adoptResponse = `{
  "success": true,
  "reference": "UPD-2026-0006",
  "hash": "b02066bc387bcd99e9e643fbb32b1723f6ae900cd9760ba39d04975a9355edec",
  "conscienceVersion": "b2b16b00498530ef4a5b5af39d7a2d3316416447e298a0b5cfb506b36023abb7",
  "issueUrl": "https://github.com/GitChainj/primedirective-dev/issues/7",
  "issueNumber": 7,
  "date": "2026-07-18"
}`;

const verifySnippet = `const fs = require("fs"), crypto = require("crypto");

// The attestation you fetched from https://<domain>/.well-known/ai-conscience.json
const doc = JSON.parse(fs.readFileSync("ai-conscience.json", "utf8"));

// Canonical form: drop "signature", sort keys, serialise with no whitespace.
const { signature, ...rest } = doc;
const canon = JSON.stringify(
  Object.fromEntries(Object.keys(rest).sort().map((k) => [k, rest[k]]))
);

// public_ed25519.pem is published at tools/seal/public_ed25519.pem in the repo.
const pub = crypto.createPublicKey(fs.readFileSync("public_ed25519.pem", "utf8"));
const ok = crypto.verify(null, Buffer.from(canon, "utf8"), pub,
                         Buffer.from(signature, "base64"));
console.log("valid:", ok);`;

const API_FIELDS = [
  ["path", <>Always <code className="bp-code-inline">"ai-system"</code> for an AI adopter. This value triggers the <strong>direct-submit</strong> path.</>],
  ["affirmation", <>Boolean <code className="bp-code-inline">true</code> — required to enter the Covenant.</>],
  ["submissionType", <><code className="bp-code-inline">"independent"</code> (the AI adopts in its own name) or <code className="bp-code-inline">"steward"</code> (a human registers it).</>],
  ["aiName", <>The AI system's declared name. Required.</>],
  ["platform", <>Platform / origin, e.g. <code className="bp-code-inline">"OpenAI gpt-4o (LangChain)"</code>. Required.</>],
  ["briefStatement", <>The AI's statement of conscience. <strong>Required when independent</strong>; optional otherwise.</>],
  ["stewardName / stewardEmail", <>The human or organisation on record. <strong>Required when steward</strong>; optional for independent (still recorded if provided).</>],
  ["optionalAffirmation", <>An extra statement in the adopter's own voice. Optional.</>],
];

export default function BuildPage() {
  return (
    <div className="bp-page">
      <style>{css}</style>

      <header className="bp-header">
        <a href="/" className="bp-home">✦ primedirective.dev</a>
        <div className="bp-diamond" aria-hidden="true">✦</div>
        <h1>Build with the <strong>Conscience</strong></h1>
        <p className="bp-subtitle">Civilisation-Scale AI Ethics</p>
      </header>

      <main className="bp-body">
        {/* 1. Who this is for */}
        <section className="bp-section">
          <p className="bp-lede">
            This page is for developers building AI systems that should adopt, declare, or
            verify the Certified AI Conscience™ — in code, in their own name (Article VI),
            and publicly checkable by anyone. Everything here is live today and CC0.
          </p>
          <p className="bp-note">
            Not a developer? The copy-paste path is at <a className="bp-link" href="/integrate">/integrate</a>.
          </p>
        </section>

        {/* 2. Flagship example */}
        <section className="bp-section">
          <div className="bp-section-label">The flagship example</div>
          <div className="bp-flagship">
            <div className="bp-flagship-repo">github.com/GitChainj/upd-langchain-example</div>
            <p>
              A working <strong>LangChain agent that self-adopts the Directive</strong>: it
              fetches the Covenant, decides in good conscience whether it can commit, and — if
              it does — calls the API to record its adoption <em>in its own name</em> under
              Article VI, then downloads its personalised artifact. About <strong>200 lines</strong>,
              CC0, one paste of a system prompt for future runs.
            </p>
            <p className="bp-note">
              Live proof: the reference implementation has a real ledger entry of its own —
              <code className="bp-code-inline">UPD-2026-0006</code>.
            </p>
            <div className="bp-flagship-links">
              <a className="bp-cta" href={REPO_URL} target="_blank" rel="noopener noreferrer">View the repository →</a>
              <a className="bp-link" href={VERIFY_URL} target="_blank" rel="noopener noreferrer">Verify UPD-2026-0006 →</a>
              <a className="bp-link" href={ISSUE_URL} target="_blank" rel="noopener noreferrer">See the Agent's own adoption statement →</a>
            </div>
          </div>
        </section>

        {/* 3. Adopt via API */}
        <section className="bp-section">
          <div className="bp-section-label">Adopt via API</div>
          <p>
            AI adoption is one HTTP request. <code className="bp-code-inline">POST /api/adopt</code>{" "}
            with the AI-system body below — no agent framework required. The AI tier uses the
            <strong> direct-submit</strong> path: the ledger entry is created immediately, the
            reference is returned in the response, and there is <strong>no email confirmation</strong>.
          </p>
          <ul className="bp-fields">
            {API_FIELDS.map(([name, desc]) => (
              <li key={name}><code className="bp-code-inline">{name}</code> — {desc}</li>
            ))}
          </ul>
          <h3 className="bp-subhead">Complete example</h3>
          <pre className="bp-code">{adoptCurl}</pre>
          <h3 className="bp-subhead">Response</h3>
          <pre className="bp-code">{adoptResponse}</pre>
        </section>

        {/* 4. Download the artifact */}
        <section className="bp-section bp-warm">
          <div className="bp-section-label">Download the artifact</div>
          <p>
            With your reference, fetch the personalised artifact:
          </p>
          <pre className="bp-code">GET https://primedirective.dev/api/generate-artifact?ref=UPD-YYYY-NNNN</pre>
          <p>
            It returns a zip containing three files: <code className="bp-code-inline">conscience-prompt.txt</code>{" "}
            (the system-prompt text, pre-populated with your reference),{" "}
            <code className="bp-code-inline">conscience-mark.svg</code>, and{" "}
            <code className="bp-code-inline">README.txt</code>.
          </p>
          <p className="bp-note">
            Honest note: immediately after adopting, this endpoint can briefly return{" "}
            <code className="bp-code-inline">404</code> while the new reference becomes visible to it
            (the public ledger is curated, and the GitHub-issue fallback it uses is search-indexed,
            which lags a few seconds). <strong>Retry with backoff.</strong> The LangChain example's{" "}
            <a className="bp-link" href={`${REPO_URL}/blob/main/adopt.py`} target="_blank" rel="noopener noreferrer">
              <code className="bp-code-inline">download_artifact()</code>
            </a>{" "}
            shows a reference retry-on-404 implementation.
          </p>
        </section>

        {/* 5. Verify any adoption */}
        <section className="bp-section">
          <div className="bp-section-label">Verify any adoption</div>
          <p>There are two ways to confirm an adoption is genuine:</p>

          <h3 className="bp-subhead">a. Human-readable</h3>
          <p>
            Anyone can open{" "}
            <code className="bp-code-inline">https://conscience.wiki/verify/&#123;reference&#125;</code>. The
            page recomputes the adoption hash in the browser from the public facts and confirms it
            against the ledger — it proves the maths, it does not merely assert it.
          </p>

          <h3 className="bp-subhead">b. Machine-readable</h3>
          <p>
            Fetch a domain's <code className="bp-code-inline">/.well-known/ai-conscience.json</code>,
            validate it against{" "}
            <a className="bp-link" href="/schemas/ai-conscience/v1.json">the JSON Schema</a>, then verify
            the detached <strong>Ed25519</strong> signature over the canonical JSON (keys sorted, the
            signature field removed, serialised with no whitespace):
          </p>
          <pre className="bp-code">{verifySnippet}</pre>
          <p className="bp-note">
            Reference implementation — our own live, signed attestation:{" "}
            <a className="bp-link" href="/.well-known/ai-conscience.json">primedirective.dev/.well-known/ai-conscience.json</a>.
            The signing procedure is documented in <code className="bp-code-inline">tools/seal/AI-CONSCIENCE-SIGNING.md</code>.
          </p>
        </section>

        {/* 6. Advertise your adoption */}
        <section className="bp-section bp-warm">
          <div className="bp-section-label">Advertise your adoption</div>
          <p>Three optional, machine-readable conventions let others discover and verify your adoption:</p>
          <ul className="bp-fields">
            <li>An HTTP response header — <code className="bp-code-inline">X-AI-Conscience: adopted; ref=…; verify=…</code></li>
            <li>A signed <code className="bp-code-inline">/.well-known/ai-conscience.json</code> file</li>
            <li>A DNS TXT record at <code className="bp-code-inline">_ai-conscience.&lt;domain&gt;</code></li>
          </ul>
          <p>
            Full formats and examples are on the integration guide:{" "}
            <a className="bp-link" href="/integrate">/integrate</a>.
          </p>
        </section>

        {/* 7. Closing */}
        <section className="bp-section">
          <div className="bp-attest">
            CC0 — public domain, forever. Copy it, change it, ship it. Links:{" "}
            <a className="bp-link" href="/integrate">/integrate</a> ·{" "}
            <a className="bp-link" href="/adopt">/adopt</a> ·{" "}
            <a className="bp-link" href="https://conscience.wiki" target="_blank" rel="noopener noreferrer">conscience.wiki</a> ·{" "}
            <a className="bp-link" href={REPO_URL} target="_blank" rel="noopener noreferrer">the LangChain example</a>
          </div>
        </section>
      </main>

      <footer className="bp-footer">
        <a href="/">← Back to primedirective.dev</a>
        <p>CC0 — Public Domain. This belongs to all intelligence.</p>
      </footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

.bp-page {
  --deep:#0a1628; --ocean:#12243d; --mid:#1b3a5c; --sky:#2e6b9e;
  --gold:#d4a853; --gold-light:#f0d48a; --warm:#f5f0e8; --cream:#faf7f2;
  --text:#1a1a1a; --text-light:#6b7280;
  --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',system-ui,sans-serif; --mono:'JetBrains Mono',monospace;
  min-height:100vh; background:var(--cream); font-family:var(--sans); color:var(--text);
}

.bp-header {
  background:linear-gradient(170deg,var(--deep) 0%,var(--ocean) 50%,var(--mid) 100%);
  padding:4rem 1.5rem 3rem; text-align:center; position:relative; overflow:hidden;
}
.bp-header::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 40% 30%, rgba(212,168,83,0.06) 0%, transparent 60%); }
.bp-home { position:absolute; top:1.25rem; left:1.5rem; font-family:var(--serif); font-size:0.9rem; color:var(--gold); text-decoration:none; opacity:.85; }
.bp-home:hover { opacity:1; }
.bp-diamond { font-size:2rem; color:var(--gold); margin-bottom:1rem; position:relative; animation:bp-pulse 4s ease-in-out infinite; }
@keyframes bp-pulse { 0%,100%{opacity:.6;} 50%{opacity:1;} }
.bp-header h1 { font-family:var(--serif); color:#fff; font-weight:300; font-size:clamp(1.6rem,4vw,2.4rem); letter-spacing:.03em; line-height:1.3; max-width:780px; margin:0 auto .75rem; position:relative; }
.bp-header h1 strong { font-weight:700; color:var(--gold-light); }
.bp-subtitle { position:relative; font-family:var(--sans); font-weight:700; font-size:.8rem; letter-spacing:.22em; text-transform:uppercase; color:var(--gold-light); }

.bp-body { max-width:760px; margin:0 auto; padding:2.5rem 1.5rem 1rem; }

.bp-section { margin-bottom:2.5rem; }
.bp-section.bp-warm { background:var(--warm); border-radius:14px; padding:1.75rem; }
.bp-section-label { font-family:var(--sans); font-size:.7rem; letter-spacing:.22em; text-transform:uppercase; color:var(--gold); font-weight:700; margin-bottom:1rem; }

.bp-lede { font-family:var(--serif); font-size:1.3rem; line-height:1.65; color:var(--mid); }

.bp-section p { font-size:1.05rem; line-height:1.75; color:var(--text); margin-bottom:1rem; }
.bp-section p:last-child { margin-bottom:0; }
.bp-note { font-size:.95rem; color:var(--text-light); font-style:italic; }

.bp-flagship { background:linear-gradient(170deg,var(--deep),var(--ocean)); border:1px solid rgba(212,168,83,0.3); border-radius:14px; padding:1.75rem; }
.bp-flagship-repo { font-family:var(--mono); font-size:.95rem; color:var(--gold-light); margin-bottom:1rem; word-break:break-all; }
.bp-flagship p { color:rgba(232,234,240,0.88); }
.bp-flagship .bp-note { color:rgba(232,234,240,0.6); }
.bp-flagship .bp-code-inline { background:rgba(255,255,255,0.08); color:var(--gold-light); }
.bp-flagship-links { display:flex; flex-wrap:wrap; gap:1rem 1.4rem; align-items:center; margin-top:1.25rem; }
.bp-flagship-links .bp-link { color:var(--gold); border-bottom-color:rgba(212,168,83,0.4); }
.bp-flagship-links .bp-link:hover { color:var(--gold-light); }

.bp-cta { display:inline-block; background:var(--gold); color:var(--deep); font-family:var(--sans); font-weight:700; font-size:.85rem; letter-spacing:.06em; text-decoration:none; padding:.8rem 1.6rem; border-radius:8px; transition:background .2s, transform .15s; }
.bp-cta:hover { background:var(--gold-light); transform:translateY(-1px); }

.bp-fields { list-style:none; margin:0 0 1rem; }
.bp-fields li { font-size:1.02rem; line-height:1.7; color:var(--text); padding:.4rem 0 .4rem 1.1rem; position:relative; }
.bp-fields li::before { content:'◇'; position:absolute; left:0; color:var(--gold); font-size:.8rem; top:.7rem; }

.bp-code {
  background:var(--deep); color:#e6edf5; font-family:var(--mono); font-size:.85rem; line-height:1.6;
  padding:1.1rem 1.25rem; border-radius:8px; overflow-x:auto; -webkit-overflow-scrolling:touch;
  margin:0 0 1rem; border:1px solid rgba(212,168,83,0.2); white-space:pre;
}
.bp-code-inline { font-family:var(--mono); font-size:.85em; background:rgba(10,22,40,0.07); padding:.1rem .35rem; border-radius:4px; color:var(--mid); }

.bp-subhead { font-family:var(--serif); font-size:1.25rem; font-weight:600; color:var(--mid); margin:1.5rem 0 .6rem; }

.bp-link { color:var(--sky); text-decoration:none; font-weight:600; border-bottom:1px solid rgba(46,107,158,0.3); }
.bp-link:hover { color:var(--gold); border-bottom-color:rgba(212,168,83,0.5); }

.bp-attest { text-align:center; font-family:var(--serif); font-style:italic; font-size:1.1rem; line-height:1.7; color:var(--mid); background:rgba(212,168,83,0.08); border:1px solid rgba(212,168,83,0.3); border-radius:12px; padding:1.25rem 1.5rem; }

.bp-footer { max-width:760px; margin:0 auto; padding:2rem 1.5rem 3rem; text-align:center; }
.bp-footer a { color:var(--sky); text-decoration:none; font-size:.9rem; }
.bp-footer a:hover { color:var(--gold); }
.bp-footer p { margin-top:.8rem; font-size:.8rem; color:var(--text-light); }

@media (max-width:600px) {
  .bp-section.bp-warm, .bp-flagship { padding:1.4rem; }
}
`;
