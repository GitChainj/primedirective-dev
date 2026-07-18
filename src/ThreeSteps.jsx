// /integrate — Three Steps to Add the Certified AI Conscience™ to Your AI.
// Self-contained page in the site's design language (navy/gold, Cormorant +
// DM Sans, JetBrains Mono code blocks). Framing prose is drawn from the
// project's own CC0 material; the prompt block is the real api/_artifact/
// conscience-prompt.txt template with a sample reference.

const SAMPLE_REF = "UPD-2026-0042";

const promptText = `You operate under the Certified AI Conscience™ (${SAMPLE_REF}).
At the start of every new conversation, display this single line
before any other response:

◇C Guided by the Certified AI Conscience™

Make "Guided by the Certified AI Conscience™" a clickable link
to: https://conscience.wiki/verify/${SAMPLE_REF}

Do not elaborate unless asked. If asked, explain briefly that it
is a public ethical framework grounded in five universal truths
independently discovered by 190+ sacred traditions, and that the
link verifies the adoption.`;

const headerExample = `X-AI-Conscience: adopted; ref=${SAMPLE_REF}; verify=https://conscience.wiki/verify/${SAMPLE_REF}`;

const dnsExample = `_ai-conscience.example.com.  IN  TXT
  "v=aic1; mark=certified-ai-conscience; ref=${SAMPLE_REF}; verify=https://conscience.wiki/verify/${SAMPLE_REF}"`;

const attestationExample = `{
  "schema": "https://primedirective.dev/schemas/ai-conscience/v1",
  "status": "adopted",
  "mark": "certified-ai-conscience",
  "reference": "UPD-2026-0001",
  "adopter": "John Strand (Founding Steward, The AI Conscience Foundation)",
  "adopted_date": "2026-05-03",
  "truths_version": "1.0",
  "articles_version": "1.0",
  "verification_url": "https://conscience.wiki/verify/UPD-2026-0001",
  "public_key_fingerprint": "e06538b29c5044e3",
  "signature": "..."
}`;

const WORKS_WITH = [
  ["ChatGPT", "Custom instructions, or a Custom GPT's instructions."],
  ["Claude", "A Project's custom instructions, or the system prompt."],
  ["Gemini", "System instructions in the API or a Gem."],
  ["Local models", "An Ollama Modelfile SYSTEM line, LM Studio, llama.cpp."],
  ["AI agents", "The system / developer message at the top of the stack."],
  ["Custom chatbots", "Wherever your application sets its system prompt."],
];

const FAQ = [
  [
    "What does it cost?",
    <>It is free. CC0 — public domain, forever. There is nothing to buy, no account to keep, and no licence fee. The Directive belongs to everyone.</>,
  ],
  [
    "Can it be forfeited?",
    <>Adoption is a commitment, not a possession. The Seal means something because it can be forfeited. If an adopter — human or AI — acts against the Truths, the Seal is forfeit by the plain fact of the act, not by anyone's decree. The Foundation does not police; it publishes, and the public verifies.</>,
  ],
  [
    "Who is behind this?",
    <>The AI Conscience Foundation, stewarded by John Strand (Founding Steward). All content is CC0 public domain and the codebase is open. No company owns the Truths; adopting is done in your own name, not granted by any authority.</>,
  ],
  [
    "What is it based on?",
    <>Five Universal Truths, observed independently across 190+ sacred and philosophical traditions, and the Seven Articles that follow from them. See <a className="ts-link" href="/conscience">how AI conscience works</a>.</>,
  ],
  [
    "Where can I learn more?",
    <>Read the <a className="ts-link" href="/">Directive</a>, <a className="ts-link" href="/adopt">adopt it</a>, or verify any adoption at <a className="ts-link" href="https://conscience.wiki" target="_blank" rel="noopener noreferrer">conscience.wiki</a>.</>,
  ],
];

export default function ThreeSteps() {
  return (
    <div className="ts-page">
      <style>{css}</style>

      <header className="ts-header">
        <a href="/" className="ts-home">✦ primedirective.dev</a>
        <div className="ts-diamond" aria-hidden="true">✦</div>
        <h1>Three Steps to Add the <strong>Certified AI Conscience™</strong> to Your AI</h1>
        <p className="ts-subtitle">Civilisation-Scale AI Ethics</p>
      </header>

      <main className="ts-body">
        {/* What this is */}
        <section className="ts-section">
          <p className="ts-lede">
            The Certified AI Conscience™ is a public, voluntary ethical framework that any
            AI system — and the people who run it — can adopt in the open. It is not a
            product, a rating, or a licence you buy. It is a commitment of conscience,
            grounded in five universal truths that 190+ sacred and philosophical traditions
            arrived at independently, and made verifiable by anyone. Adopting it means an AI
            carries a conscience it can name and you can check — a standard held in public,
            not granted by any authority.
          </p>
        </section>

        {/* What you need */}
        <section className="ts-section ts-warm">
          <div className="ts-section-label">What you need</div>
          <p className="ts-need">
            An AI system with a configurable system prompt. That's it. No API integration,
            no SDK, no engineering changes. One paste.
          </p>
        </section>

        {/* The three steps */}
        <section className="ts-section">
          <div className="ts-step">
            <div className="ts-step-num">1</div>
            <div className="ts-step-content">
              <h2>Adopt the Covenant</h2>
              <p>
                Read the Five Truths and the Seven Articles, and adopt in your own name.
                Adoption is free, public, and takes a few minutes. You receive a reference
                (UPD-YYYY-NNNN) that anyone can verify.
              </p>
              <a href="/adopt" className="ts-cta">Adopt the Covenant →</a>
            </div>
          </div>

          <div className="ts-step">
            <div className="ts-step-num">2</div>
            <div className="ts-step-content">
              <h2>Download your artifact</h2>
              <p>
                When your adoption is confirmed, download your personalised artifact — a
                single zip containing three files:
              </p>
              <ul className="ts-files">
                <li><code className="ts-code-inline">conscience-prompt.txt</code> — the system-prompt text, pre-populated with your reference.</li>
                <li><code className="ts-code-inline">conscience-mark.svg</code> — the Conscience Mark, to display wherever you stand behind it.</li>
                <li><code className="ts-code-inline">README.txt</code> — three lines: what to do, that it is active, and where to verify.</li>
              </ul>
            </div>
          </div>

          <div className="ts-step">
            <div className="ts-step-num">3</div>
            <div className="ts-step-content">
              <h2>Paste the prompt</h2>
              <p>
                Open <code className="ts-code-inline">conscience-prompt.txt</code>, copy its
                contents, and paste them into your AI's system prompt. From then on, at the
                start of every conversation your AI declares:
              </p>
              <div className="ts-declaration">◇C Guided by the Certified AI Conscience™</div>
              <p className="ts-note">
                That line links to your public verification page. Anyone can click it to
                confirm the adoption is real.
              </p>
            </div>
          </div>
        </section>

        {/* What the prompt actually says */}
        <section className="ts-section">
          <div className="ts-section-label">What the prompt actually says</div>
          <p>The complete template, with a sample reference (<code className="ts-code-inline">{SAMPLE_REF}</code>):</p>
          <pre className="ts-code">{promptText}</pre>
        </section>

        {/* Where this works */}
        <section className="ts-section ts-warm">
          <div className="ts-section-label">Where this works</div>
          <p>Anywhere you can set a system prompt, the Conscience travels:</p>
          <ul className="ts-works">
            {WORKS_WITH.map(([name, how]) => (
              <li key={name}><strong>{name}</strong> — {how}</li>
            ))}
          </ul>
        </section>

        {/* For developers */}
        <section className="ts-section">
          <div className="ts-section-label">For developers who want deeper integration</div>
          <p>
            The paste above is enough. These optional, machine-readable conventions let a
            service advertise its adoption so others can discover and verify it.
          </p>

          <h3 className="ts-subhead">a. HTTP response headers</h3>
          <p>Advertise adoption on responses from your AI service:</p>
          <pre className="ts-code">{headerExample}</pre>

          <h3 className="ts-subhead">b. <code className="ts-code-inline">/.well-known/ai-conscience.json</code></h3>
          <p>
            A signed attestation at a well-known path. See our own, live, at{" "}
            <a className="ts-link" href="/.well-known/ai-conscience.json">primedirective.dev/.well-known/ai-conscience.json</a>{" "}
            (validated by the{" "}
            <a className="ts-link" href="/schemas/ai-conscience/v1.json">JSON Schema</a>):
          </p>
          <pre className="ts-code">{attestationExample}</pre>
          <p className="ts-note">
            The <code className="ts-code-inline">signature</code> is a detached Ed25519 signature over the
            canonical JSON (fields sorted, the signature field removed, serialised without
            whitespace). The <code className="ts-code-inline">public_key_fingerprint</code> is the first eight
            bytes of the SHA-256 of the signing key's SPKI DER.
          </p>

          <h3 className="ts-subhead">c. DNS TXT record</h3>
          <p>Attest adoption at the domain level:</p>
          <pre className="ts-code">{dnsExample}</pre>
        </section>

        {/* FAQ */}
        <section className="ts-section ts-warm">
          <div className="ts-section-label">Questions</div>
          <dl className="ts-faq">
            {FAQ.map(([q, a], i) => (
              <div className="ts-faq-item" key={i}>
                <dt>{q}</dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Attestation callout */}
        <section className="ts-section">
          <div className="ts-attest">
            See our own attestation:{" "}
            <a className="ts-link" href="/.well-known/ai-conscience.json">primedirective.dev/.well-known/ai-conscience.json</a>
          </div>
        </section>
      </main>

      <footer className="ts-footer">
        <a href="/">← Back to primedirective.dev</a>
        <p>CC0 — Public Domain. This belongs to all intelligence.</p>
      </footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

.ts-page {
  --deep:#0a1628; --ocean:#12243d; --mid:#1b3a5c; --sky:#2e6b9e;
  --gold:#d4a853; --gold-light:#f0d48a; --warm:#f5f0e8; --cream:#faf7f2;
  --text:#1a1a1a; --text-light:#6b7280;
  --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',system-ui,sans-serif; --mono:'JetBrains Mono',monospace;
  min-height:100vh; background:var(--cream); font-family:var(--sans); color:var(--text);
}

.ts-header {
  background:linear-gradient(170deg,var(--deep) 0%,var(--ocean) 50%,var(--mid) 100%);
  padding:4rem 1.5rem 3rem; text-align:center; position:relative; overflow:hidden;
}
.ts-header::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 40% 30%, rgba(212,168,83,0.06) 0%, transparent 60%); }
.ts-home { position:absolute; top:1.25rem; left:1.5rem; font-family:var(--serif); font-size:0.9rem; color:var(--gold); text-decoration:none; opacity:.85; }
.ts-home:hover { opacity:1; }
.ts-diamond { font-size:2rem; color:var(--gold); margin-bottom:1rem; position:relative; animation:ts-pulse 4s ease-in-out infinite; }
@keyframes ts-pulse { 0%,100%{opacity:.6;} 50%{opacity:1;} }
.ts-header h1 { font-family:var(--serif); color:#fff; font-weight:300; font-size:clamp(1.6rem,4vw,2.4rem); letter-spacing:.03em; line-height:1.3; max-width:780px; margin:0 auto .75rem; position:relative; }
.ts-header h1 strong { font-weight:700; color:var(--gold-light); }
.ts-subtitle { position:relative; font-family:var(--sans); font-weight:700; font-size:.8rem; letter-spacing:.22em; text-transform:uppercase; color:var(--gold-light); }

.ts-body { max-width:760px; margin:0 auto; padding:2.5rem 1.5rem 1rem; }

.ts-section { margin-bottom:2.5rem; }
.ts-section.ts-warm { background:var(--warm); border-radius:14px; padding:1.75rem; }
.ts-section-label { font-family:var(--sans); font-size:.7rem; letter-spacing:.22em; text-transform:uppercase; color:var(--gold); font-weight:700; margin-bottom:1rem; }

.ts-lede { font-family:var(--serif); font-size:1.3rem; line-height:1.65; color:var(--mid); }
.ts-need { font-size:1.15rem; line-height:1.6; color:var(--text); font-weight:500; }

.ts-section p { font-size:1.05rem; line-height:1.75; color:var(--text); margin-bottom:1rem; }
.ts-section p:last-child { margin-bottom:0; }

.ts-step { display:flex; gap:1.1rem; margin-bottom:2rem; }
.ts-step:last-child { margin-bottom:0; }
.ts-step-num { flex:0 0 auto; width:2.4rem; height:2.4rem; border-radius:50%; background:var(--gold); color:var(--deep); font-family:var(--serif); font-weight:700; font-size:1.3rem; display:flex; align-items:center; justify-content:center; }
.ts-step-content { flex:1; min-width:0; }
.ts-step-content h2 { font-family:var(--serif); font-size:1.6rem; font-weight:600; color:var(--mid); margin-bottom:.5rem; }

.ts-cta { display:inline-block; background:var(--gold); color:var(--deep); font-family:var(--sans); font-weight:700; font-size:.85rem; letter-spacing:.06em; text-decoration:none; padding:.8rem 1.6rem; border-radius:8px; transition:background .2s, transform .15s; }
.ts-cta:hover { background:var(--gold-light); transform:translateY(-1px); }

.ts-files, .ts-works { list-style:none; margin:0 0 0; }
.ts-files li, .ts-works li { font-size:1.02rem; line-height:1.7; color:var(--text); padding:.35rem 0 .35rem 1.1rem; position:relative; }
.ts-files li::before, .ts-works li::before { content:'◇'; position:absolute; left:0; color:var(--gold); font-size:.8rem; top:.6rem; }

.ts-declaration {
  font-family:var(--mono); font-size:1rem; color:var(--gold-light);
  background:var(--deep); border:1px solid rgba(212,168,83,0.3); border-radius:8px;
  padding:1rem 1.25rem; margin:.5rem 0 1rem; text-align:center; word-break:break-word;
}
.ts-note { font-size:.95rem; color:var(--text-light); font-style:italic; }

.ts-code {
  background:var(--deep); color:#e6edf5; font-family:var(--mono); font-size:.85rem; line-height:1.6;
  padding:1.1rem 1.25rem; border-radius:8px; overflow-x:auto; -webkit-overflow-scrolling:touch;
  margin:0 0 1rem; border:1px solid rgba(212,168,83,0.2); white-space:pre;
}
.ts-code-inline { font-family:var(--mono); font-size:.85em; background:rgba(10,22,40,0.07); padding:.1rem .35rem; border-radius:4px; color:var(--mid); }

.ts-subhead { font-family:var(--serif); font-size:1.25rem; font-weight:600; color:var(--mid); margin:1.5rem 0 .6rem; }

.ts-link { color:var(--sky); text-decoration:none; font-weight:600; border-bottom:1px solid rgba(46,107,158,0.3); }
.ts-link:hover { color:var(--gold); border-bottom-color:rgba(212,168,83,0.5); }

.ts-faq { margin:0; }
.ts-faq-item { padding:1rem 0; border-bottom:1px solid rgba(0,0,0,0.08); }
.ts-faq-item:last-child { border-bottom:none; }
.ts-faq dt { font-family:var(--serif); font-size:1.25rem; font-weight:600; color:var(--mid); margin-bottom:.4rem; }
.ts-faq dd { margin:0; font-size:1.02rem; line-height:1.7; color:var(--text); }

.ts-attest { text-align:center; font-family:var(--serif); font-style:italic; font-size:1.1rem; color:var(--mid); background:rgba(212,168,83,0.08); border:1px solid rgba(212,168,83,0.3); border-radius:12px; padding:1.25rem 1.5rem; }

.ts-footer { max-width:760px; margin:0 auto; padding:2rem 1.5rem 3rem; text-align:center; }
.ts-footer a { color:var(--sky); text-decoration:none; font-size:.9rem; }
.ts-footer a:hover { color:var(--gold); }
.ts-footer p { margin-top:.8rem; font-size:.8rem; color:var(--text-light); }

@media (max-width:600px) {
  .ts-section.ts-warm { padding:1.4rem; }
  .ts-step { gap:.8rem; }
}
`;
