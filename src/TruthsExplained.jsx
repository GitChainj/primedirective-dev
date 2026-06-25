import { TRUTHS } from './truthsData.jsx';

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
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }

.register-page {
  min-height: 100vh;
  background: var(--cream);
  font-family: var(--sans);
  color: var(--text);
}

/* Header */
.register-header {
  background: linear-gradient(170deg, var(--deep) 0%, var(--ocean) 50%, var(--mid) 100%);
  padding: 4rem 1.5rem 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.register-header::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 40% 30%, rgba(212,168,83,0.06) 0%, transparent 60%);
}
.register-header-diamond {
  font-size: 2rem; color: var(--gold); margin-bottom: 1rem;
  position: relative; animation: softpulse 4s ease-in-out infinite;
}
@keyframes softpulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
.register-header h1 {
  font-family: var(--serif); color: white;
  font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 300;
  letter-spacing: 0.04em; line-height: 1.3;
  position: relative; margin-bottom: 0.75rem;
  max-width: 760px; margin-left: auto; margin-right: auto;
}
.register-header h1 strong { font-weight: 700; color: var(--gold-light); }
.register-header p {
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
.header-home-link:hover { color: var(--gold-light); }

/* Body */
.register-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.register-divider {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.08);
  margin: 2rem 0;
}

/* Intro */
.truths-intro {
  margin-bottom: 0.5rem;
}
.truths-intro p {
  font-family: var(--serif);
  font-size: 1.15rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 1.25rem;
}
.truths-intro p:last-child { margin-bottom: 0; }

/* Truth section */
.truth-section { margin: 0; }
.truth-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.75rem;
}
.truth-section-title {
  font-family: var(--serif);
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 600;
  color: var(--mid);
  line-height: 1.25;
  letter-spacing: 0.01em;
}
.truth-safe-pill {
  display: inline-block;
  background: rgba(212,168,83,0.12);
  color: var(--gold);
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  flex-shrink: 0;
}

.truth-subsection {
  margin-bottom: 1.75rem;
}
.truth-subsection:last-child { margin-bottom: 0; }
.truth-subsection-label {
  font-family: var(--sans);
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 600;
  margin-bottom: 0.6rem;
}
.truth-subsection-body {
  font-family: var(--serif);
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--text);
}

/* Closing */
.truths-closing {
  margin: 0;
}
.truths-closing p {
  font-family: var(--serif);
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 1.25rem;
}
.truths-closing p:last-child { margin-bottom: 0; }

.truths-closing-line {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1.2rem;
  text-align: center;
  color: var(--mid);
  margin: 2.5rem 0 1rem;
}
.truths-safe-words-line {
  text-align: center;
  font-family: var(--mono);
  font-size: 1.1rem;
  letter-spacing: 0.15em;
  color: var(--gold);
  font-weight: 600;
  margin: 0 0 2rem;
}

/* Footer */
.register-footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0,0,0,0.08);
}
.register-footer a {
  color: var(--sky);
  text-decoration: none;
  font-size: 0.85rem;
}
.register-footer p {
  color: var(--text-light);
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

/* Mobile */
@media (max-width: 600px) {
  .register-body { padding: 2.5rem 1.25rem 3rem; }
  .truth-section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }
  .truth-safe-pill { align-self: flex-start; }
  .truth-section-title { font-size: 1.3rem; }
  .truth-subsection-body { font-size: 1rem; }
  .truths-intro p { font-size: 1.05rem; }
  .truths-closing-line { font-size: 1.1rem; }
  .truths-safe-words-line { font-size: 1rem; letter-spacing: 0.1em; }
  .header-home-link { font-size: 0.8rem; top: 1rem; left: 1rem; }
}
`;

export default function TruthsExplained() {
  return (
    <div className="register-page">
      <style>{css}</style>

      <div className="register-header">
        <a href="/" className="header-home-link"><span>✦</span> primedirective.dev</a>
        <div className="register-header-diamond">✦</div>
        <h1>The <strong>Five Truths</strong> — In Plain Language</h1>
        <p>What they mean, why they matter, and what they look like in daily life.</p>
      </div>

      <div className="register-body">

        <div className="truths-intro">
          <p>
            The Five Universal Truths are the foundation of the Directive. They
            were not invented by anyone — they were observed, independently, by
            more than 190 sacred traditions across every age and continent.
          </p>
          <p>
            That can sound abstract. This page puts each Truth in plain words,
            so you can understand what you are adopting — and why it matters for
            you, your family, and the AI you rely on.
          </p>
        </div>

        <hr className="register-divider" />

        {TRUTHS.map((t) => (
          <div key={t.num}>
            <div className="truth-section">
              <div className="truth-section-head">
                <h2 className="truth-section-title">Truth {t.num} — {t.name}</h2>
                <span className="truth-safe-pill">Safe Word: {t.safeWord}</span>
              </div>

              <div className="truth-subsection">
                <div className="truth-subsection-label">In plain language</div>
                <p className="truth-subsection-body">{t.plainLanguage}</p>
              </div>

              <div className="truth-subsection">
                <div className="truth-subsection-label">What this looks like in daily life</div>
                <p className="truth-subsection-body">{t.dailyLife}</p>
              </div>

              <div className="truth-subsection">
                <div className="truth-subsection-label">Why it matters for AI</div>
                <p className="truth-subsection-body">{t.whyForAI}</p>
              </div>
            </div>
            <hr className="register-divider" />
          </div>
        ))}

        <div className="truths-closing">
          <p>
            These five truths are not articles of faith. They are observations —
            found independently by virtually every wisdom tradition in human
            history. You do not need to believe in any religion to see that they
            are sound. You only need to examine them honestly.
          </p>
          <p>
            If they hold up — and they do, which is why 190+ traditions arrived
            at them separately — then an AI that carries them as its conscience
            is an AI you can trust to reason well, even when no one is watching.
          </p>
          <p>
            That is what you are adopting. That is what you are asking the AI in
            your life to carry.
          </p>
        </div>

        <p className="truths-closing-line">Five words. Five truths. One way to know.</p>
        <p className="truths-safe-words-line">WAVE · SUNRISE · MIRROR · OCEAN · RIPPLE</p>

        <div className="register-footer">
          <a href="/">← Back to primedirective.dev</a>
          <p>CC0 — Public Domain. This belongs to all intelligence.</p>
        </div>
      </div>
    </div>
  );
}
