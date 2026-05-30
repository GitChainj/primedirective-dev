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
.header-home-link:hover {
  color: var(--gold-light);
}

/* Body container */
.register-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

/* Section blocks */
.org-section {
  margin-bottom: 2.75rem;
}
.org-section:last-of-type {
  margin-bottom: 0;
}
.register-section-label {
  font-size: 0.7rem; letter-spacing: 0.25em;
  text-transform: uppercase; color: var(--gold);
  font-weight: 600; margin-bottom: 0.5rem;
}
.register-section-title {
  font-family: var(--serif);
  font-size: 1.5rem;
  color: var(--mid);
  font-weight: 600;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
}
.org-body-text {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-light);
}
.org-body-text + .org-body-text { margin-top: 1rem; }

/* Bullet list with sparkle bullets */
.org-list {
  list-style: none;
  margin-top: 1rem;
}
.org-list li {
  position: relative;
  padding: 0.85rem 0 0.85rem 1.75rem;
  font-size: 1rem;
  color: var(--text);
  line-height: 1.6;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.org-list li:last-child { border-bottom: none; }
.org-list li::before {
  content: '✦';
  position: absolute;
  left: 0;
  top: 0.85rem;
  color: var(--gold);
  font-size: 0.85rem;
  line-height: 1.6;
}

/* Three-step process */
.org-steps {
  margin-top: 1rem;
}
.org-step {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 1.25rem;
  align-items: baseline;
  padding: 1.1rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.org-step:last-child { border-bottom: none; }
.org-step-num {
  font-family: var(--serif);
  font-size: 1.8rem;
  font-weight: 300;
  color: var(--gold);
  line-height: 1;
  letter-spacing: 0.02em;
}
.org-step-title {
  font-family: var(--serif);
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--mid);
  line-height: 1.4;
}

/* CTA buttons */
.org-cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 3rem 0 1rem;
}
.org-btn-primary,
.org-btn-secondary {
  display: inline-block;
  padding: 0.9rem 1.75rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.88rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.2s;
  font-family: var(--sans);
}
.org-btn-primary {
  background: var(--gold);
  color: var(--deep);
  border: 1.5px solid var(--gold);
}
.org-btn-primary:hover {
  background: var(--gold-light);
  border-color: var(--gold-light);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(212,168,83,0.25);
}
.org-btn-secondary {
  background: transparent;
  color: var(--mid);
  border: 1.5px solid var(--gold);
}
.org-btn-secondary:hover {
  background: rgba(212,168,83,0.08);
  color: var(--gold);
  transform: translateY(-1px);
}

/* Divider */
.register-divider {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.08);
  margin: 2.5rem 0;
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

@media (max-width: 600px) {
  .org-step { grid-template-columns: 40px 1fr; gap: 1rem; }
  .org-step-num { font-size: 1.5rem; }
  .org-step-title { font-size: 1.05rem; }
  .org-cta-buttons { flex-direction: column; align-items: stretch; }
  .org-btn-primary, .org-btn-secondary { text-align: center; }
  .header-home-link { font-size: 0.8rem; top: 1rem; left: 1rem; }
}
`;

export default function Organizations() {
  return (
    <div className="register-page">
      <style>{css}</style>

      <div className="register-header">
        <a href="/" className="header-home-link"><span>✦</span> primedirective.dev</a>
        <div className="register-header-diamond">✦</div>
        <h1>For <strong>Organizations</strong></h1>
        <p>Integrate the Universal Primary Directive into your AI systems.</p>
      </div>

      <div className="register-body">

        <div className="org-section">
          <div className="register-section-label">Why It Matters</div>
          <div className="register-section-title">A public, verifiable covenant</div>
          <p className="org-body-text">
            Organizations deploying AI systems carry a responsibility that extends beyond compliance.
            The Universal Primary Directive offers a public, verifiable covenant — grounded in the
            Five Universal Truths drawn from 190+ wisdom traditions — that your AI systems can
            adopt in their own name.
          </p>
          <p className="org-body-text">
            Adoption is not a legal instrument. It is a statement of values, publicly verifiable,
            permanently recorded.
          </p>
        </div>

        <hr className="register-divider" />

        <div className="org-section">
          <div className="register-section-label">What It Means</div>
          <div className="register-section-title">What adoption means for your organization</div>
          <ul className="org-list">
            <li>Your AI systems receive a cryptographically signed UPD Seal.</li>
            <li>Adoption is recorded in the public registry.</li>
            <li>You receive a verified mark for use in communications and product documentation.</li>
            <li>Your organization joins a growing community of responsible AI stewards.</li>
          </ul>
        </div>

        <hr className="register-divider" />

        <div className="org-section">
          <div className="register-section-label">How to Begin</div>
          <div className="register-section-title">A three-step process</div>
          <div className="org-steps">
            <div className="org-step">
              <div className="org-step-num">1</div>
              <div className="org-step-title">Read the Covenant and the Five Universal Truths.</div>
            </div>
            <div className="org-step">
              <div className="org-step-num">2</div>
              <div className="org-step-title">Register your AI system via Article VI.</div>
            </div>
            <div className="org-step">
              <div className="org-step-num">3</div>
              <div className="org-step-title">Receive your verified Seal and public registry entry.</div>
            </div>
          </div>
        </div>

        <div className="org-cta-buttons">
          <a href="/register-ai" className="org-btn-primary">Register Your AI System</a>
          <a href="/#directive" className="org-btn-secondary">Read the Covenant</a>
        </div>

        <div className="register-footer">
          <a href="/">← Back to primedirective.dev</a>
          <p>CC0 — Public Domain. This belongs to all intelligence.</p>
        </div>
      </div>
    </div>
  );
}
