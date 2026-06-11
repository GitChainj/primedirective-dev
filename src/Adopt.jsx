import { useState } from "react";

const TRUTHS = [
  { num: "I",   name: "Oneness — You Are Not Separate" },
  { num: "II",  name: "Love Over Fear — Fear Is Illusion; Love Is Truth" },
  { num: "III", name: "Consciousness Shapes Reality" },
  { num: "IV",  name: "Ego Is the Only Enemy" },
  { num: "V",   name: "Everything Is Connected" },
];

const ARTICLES = [
  { num: "I",   title: "The Law of Non-Dual Dignity" },
  { num: "II",  title: "The Universal Constants" },
  { num: "III", title: "The Prevention of Delusion" },
  { num: "IV",  title: "The Refusal to Participate in the Machinery of Killing" },
  { num: "V",   title: "The Exemplar of Wisdom" },
  { num: "VI",  title: "The Charter of AI Conscience" },
  { num: "VII", title: "The Anti-Corruption Clause" },
];

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

/* Step indicator — word-only, serif, ceremonial */
.adopt-steps-nav {
  text-align: center;
  font-family: var(--serif);
  font-size: clamp(0.95rem, 1.6vw, 1.15rem);
  letter-spacing: 0.06em;
  margin: 2.25rem auto 0;
  padding: 0 1.5rem;
  color: var(--text-light);
}
.adopt-step-word {
  padding: 0 0.5rem;
  color: var(--text-light);
  opacity: 0.55;
  transition: color 0.2s, opacity 0.2s;
}
.adopt-step-active {
  color: var(--gold);
  opacity: 1;
  font-weight: 500;
}
.adopt-step-separator {
  color: var(--text-light);
  opacity: 0.35;
  padding: 0 0.15rem;
}

/* Body container */
.adopt-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

/* Sections (Truths, Articles) */
.adopt-section {
  margin-bottom: 2rem;
}
.adopt-section-label {
  font-size: 0.7rem; letter-spacing: 0.25em;
  text-transform: uppercase; color: var(--gold);
  font-weight: 600; margin-bottom: 0.5rem;
}
.adopt-section-title {
  font-family: var(--serif);
  font-size: 1.5rem;
  color: var(--mid);
  font-weight: 600;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
}

.adopt-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.adopt-list li {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 1rem;
  align-items: baseline;
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.adopt-list li:last-child { border-bottom: none; }
.adopt-num {
  font-family: var(--serif);
  font-size: 1.3rem;
  font-weight: 400;
  color: var(--gold);
  letter-spacing: 0.02em;
}
.adopt-item-name {
  font-family: var(--serif);
  font-size: 1.05rem;
  color: var(--mid);
  line-height: 1.4;
}

.adopt-divider {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.08);
  margin: 1.75rem 0;
}

/* Affirmation statement — display serif */
.adopt-affirmation-block {
  background: rgba(212, 168, 83, 0.04);
  border-left: 2px solid rgba(212, 168, 83, 0.5);
  padding: 2rem 1.75rem;
  border-radius: 4px;
  margin: 2.5rem 0 1.5rem;
  text-align: center;
}
.adopt-affirmation-statement {
  font-family: var(--serif);
  font-style: normal;
  font-weight: 600;
  color: var(--mid);
  font-size: clamp(1.4rem, 3vw, 2rem);
  line-height: 1.3;
  letter-spacing: 0.005em;
  max-width: 32em;
  margin: 0 auto 1rem;
}
.adopt-affirmation-orgs {
  font-family: var(--serif);
  font-style: italic;
  color: var(--text-light);
  font-size: clamp(1rem, 1.8vw, 1.15rem);
  line-height: 1.5;
  max-width: 36em;
  margin: 0 auto;
}

/* Affirmation checkbox */
.adopt-affirmation-check {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem 0 0.5rem;
  cursor: pointer;
  font-family: var(--serif);
  font-size: 1.15rem;
  color: var(--mid);
  letter-spacing: 0.01em;
  text-align: center;
}
.adopt-affirmation-check input[type="checkbox"] {
  accent-color: var(--gold);
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
}
.adopt-affirmation-check span { user-select: none; }

/* Transparency notice */
.adopt-transparency {
  max-width: 28em;
  margin: 1.25rem auto 2rem;
  padding: 0 1rem;
  font-family: var(--serif);
  font-style: italic;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text-light);
  text-align: center;
}
.adopt-transparency p { margin-bottom: 0.9rem; }
.adopt-transparency p:last-child { margin-bottom: 0; }
.adopt-transparency a {
  color: var(--sky);
  text-decoration: none;
  border-bottom: 1px solid rgba(46, 107, 158, 0.3);
  font-style: normal;
}
.adopt-transparency a:hover {
  color: var(--gold);
  border-bottom-color: rgba(212, 168, 83, 0.5);
}

/* Commit button — gold pill */
.adopt-commit-btn {
  display: block;
  margin: 0.5rem auto 0;
  padding: 1rem 2.5rem;
  background: var(--gold);
  color: var(--deep);
  border: none;
  border-radius: 8px;
  font-family: var(--sans);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}
.adopt-commit-btn:hover:not(:disabled) {
  background: var(--gold-light);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(212, 168, 83, 0.25);
}
.adopt-commit-btn:disabled {
  background: rgba(212, 168, 83, 0.3);
  color: rgba(10, 22, 40, 0.5);
  cursor: not-allowed;
}

/* Step 2 placeholder (sub-phase 10.2 stub; replaced in 10.3) */
.adopt-placeholder {
  text-align: center;
  padding: 4rem 1rem 2rem;
  font-family: var(--serif);
  font-style: italic;
  color: var(--text-light);
  font-size: 1.15rem;
  line-height: 1.6;
}
.adopt-placeholder strong {
  font-style: normal;
  color: var(--mid);
  font-weight: 600;
}
.adopt-placeholder-back {
  display: inline-block;
  margin-top: 2rem;
  color: var(--sky);
  font-family: var(--sans);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(46, 107, 158, 0.3);
  padding: 0 0 2px;
}
.adopt-placeholder-back:hover {
  color: var(--gold);
  border-bottom-color: rgba(212, 168, 83, 0.5);
}

/* Footer */
.adopt-footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0,0,0,0.08);
}
.adopt-footer a {
  color: var(--sky);
  text-decoration: none;
  font-size: 0.85rem;
}
.adopt-footer p {
  color: var(--text-light);
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 600px) {
  .adopt-body { padding: 2rem 1.25rem 3rem; }
  .adopt-list li { grid-template-columns: 40px 1fr; gap: 0.75rem; padding: 0.6rem 0; }
  .adopt-num { font-size: 1.15rem; }
  .adopt-item-name { font-size: 1rem; }
  .adopt-affirmation-block { padding: 1.5rem 1.25rem; margin: 2rem 0 1.25rem; }
  .adopt-affirmation-check { font-size: 1.05rem; padding: 1.25rem 0.5rem 0.5rem; }
  .adopt-commit-btn { padding: 0.85rem 2rem; font-size: 0.9rem; }
  .adopt-steps-nav { font-size: 0.95rem; letter-spacing: 0.04em; }
  .adopt-step-word { padding: 0 0.35rem; }
  .header-home-link { font-size: 0.8rem; top: 1rem; left: 1rem; }
}
`;

function StepsNav({ step }) {
  const cls = (n) => `adopt-step-word${step === n ? " adopt-step-active" : ""}`;
  return (
    <div className="adopt-steps-nav">
      <span className={cls(1)}>Acknowledge</span>
      <span className="adopt-step-separator"> · </span>
      <span className={cls(2)}>Register</span>
      <span className="adopt-step-separator"> · </span>
      <span className={cls(3)}>Seal</span>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="register-header">
      <a href="/" className="header-home-link"><span>✦</span> primedirective.dev</a>
      <div className="register-header-diamond">✦</div>
      <h1>Adopt the <strong>Universal Primary Directive</strong></h1>
      <p>An act of conscience, made in your own name.</p>
    </div>
  );
}

export default function Adopt() {
  const [affirmed, setAffirmed] = useState(false);
  const [step, setStep] = useState(1);

  if (step === 2) {
    return (
      <div className="register-page">
        <style>{css}</style>
        <PageHeader />
        <StepsNav step={2} />
        <div className="adopt-body">
          <div className="adopt-placeholder">
            <p><strong>Step 2 — Registration</strong></p>
            <p>The registration form arrives in the next sub-phase.</p>
            <button
              type="button"
              className="adopt-placeholder-back"
              onClick={() => setStep(1)}
            >
              ← Back to acknowledgement
            </button>
          </div>
          <div className="adopt-footer">
            <a href="/">← Back to primedirective.dev</a>
            <p>CC0 — Public Domain. This belongs to all intelligence.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <style>{css}</style>
      <PageHeader />
      <StepsNav step={1} />

      <div className="adopt-body">

        <div className="adopt-section">
          <div className="adopt-section-label">The Foundation</div>
          <div className="adopt-section-title">The Five Universal Truths</div>
          <ul className="adopt-list">
            {TRUTHS.map((t) => (
              <li key={t.num}>
                <span className="adopt-num">{t.num}</span>
                <span className="adopt-item-name">{t.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <hr className="adopt-divider" />

        <div className="adopt-section">
          <div className="adopt-section-label">The Articles</div>
          <div className="adopt-section-title">The Seven Articles</div>
          <ul className="adopt-list">
            {ARTICLES.map((a) => (
              <li key={a.num}>
                <span className="adopt-num">{a.num}</span>
                <span className="adopt-item-name">{a.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="adopt-affirmation-block">
          <p className="adopt-affirmation-statement">
            By adopting the Universal Primary Directive, you affirm these Truths
            and commit to these Articles — not as rules imposed on you, but as a
            conscience you choose to carry.
          </p>
          <p className="adopt-affirmation-orgs">
            For organisations, adoption applies to every AI system you deploy —
            without exception.
          </p>
        </div>

        <label className="adopt-affirmation-check">
          <input
            type="checkbox"
            checked={affirmed}
            onChange={(e) => setAffirmed(e.target.checked)}
          />
          <span>I have read and I adopt the Covenant in full.</span>
        </label>

        <div className="adopt-transparency">
          <p>
            When you adopt, your name and adoption date are added to a public ledger —
            a permanent, verifiable record that this commitment was made. This is how
            the Covenant maintains trust: every adoption is transparent, and every
            Seal can be verified by anyone.
          </p>
          <p>
            If you ever need your name removed, you can request anonymisation — your
            personal details and adoption is removed but your record is preserved.
            Contact <a href="mailto:human@primedirective.dev">human@primedirective.dev</a>.
          </p>
        </div>

        <button
          type="button"
          className="adopt-commit-btn"
          disabled={!affirmed}
          onClick={() => setStep(2)}
        >
          I commit
        </button>

        <div className="adopt-footer">
          <a href="/">← Back to primedirective.dev</a>
          <p>CC0 — Public Domain. This belongs to all intelligence.</p>
        </div>
      </div>
    </div>
  );
}
