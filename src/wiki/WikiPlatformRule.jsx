// conscience.wiki/platform-rule — individual vs platform adoption, and why
// the certification is binary. The strategic centrepiece of the wiki.

import WikiLayout from "./WikiLayout.jsx";

const css = `
.wiki-pr-intro {
  font-size: 1.1rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 2.5rem;
}
.wiki-pr-section { margin-bottom: 2.5rem; }
.wiki-pr-section-title {
  font-family: var(--serif);
  font-size: clamp(1.4rem, 3vw, 1.85rem);
  font-weight: 600;
  color: var(--mid);
  line-height: 1.25;
  margin-bottom: 1rem;
}
.wiki-pr-section p {
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 1.1rem;
}
.wiki-pr-section p:last-child { margin-bottom: 0; }
.wiki-pr-section strong { color: var(--mid); }

/* Two marks */
.wiki-pr-marks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}
.wiki-pr-mark-card {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 1.75rem;
}
.wiki-pr-mark-glyph { font-size: 1.8rem; color: var(--gold); margin-bottom: 0.5rem; }
.wiki-pr-mark-name {
  font-family: var(--serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--mid);
  margin-bottom: 0.5rem;
}
.wiki-pr-mark-card p { font-size: 0.95rem; line-height: 1.6; color: var(--text-light); }

/* The Rule — emphasised block */
.wiki-pr-rule {
  background: linear-gradient(170deg, var(--deep), var(--ocean));
  border: 1px solid rgba(212,168,83,0.25);
  border-radius: 14px;
  padding: 2rem;
  margin-top: 0.5rem;
}
.wiki-pr-rule p {
  font-family: var(--serif);
  font-size: 1.2rem;
  font-style: italic;
  line-height: 1.65;
  color: rgba(255,255,255,0.9);
  margin: 0;
}
.wiki-pr-rule strong { color: var(--gold-light); font-style: normal; }

.wiki-pr-divider {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.08);
  margin: 2.5rem 0;
}

/* What you can do */
.wiki-pr-actions { list-style: none; }
.wiki-pr-actions li {
  position: relative;
  padding: 0.6rem 0 0.6rem 1.7rem;
  font-size: 1.02rem;
  line-height: 1.65;
  color: var(--text);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.wiki-pr-actions li:last-child { border-bottom: none; }
.wiki-pr-actions li::before {
  content: "▲";
  position: absolute;
  left: 0;
  top: 0.65rem;
  font-size: 0.7rem;
  color: var(--gold);
}
.wiki-pr-ask {
  font-family: var(--mono);
  font-size: 0.9rem;
  background: rgba(212,168,83,0.1);
  border-left: 3px solid var(--gold);
  padding: 0.3rem 0.6rem;
  border-radius: 0 4px 4px 0;
}
.wiki-pr-cta {
  display: inline-block;
  margin-top: 1.5rem;
  color: var(--sky);
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
}
.wiki-pr-cta:hover { color: var(--gold); }
.wiki-pr-link { color: var(--sky); text-decoration: none; font-weight: 600; }
.wiki-pr-link:hover { color: var(--gold); }
`;

export default function WikiPlatformRule() {
  return (
    <WikiLayout
      title={<>The <strong>Platform Rule</strong></>}
      tagline="Why a conscience for your AI is not the same as a conscience for the platform behind it."
    >
      <style>{css}</style>

      <p className="wiki-pr-intro">
        Deploying the Conscience to the AI you use is real and it matters. But it is
        not the same as the platform itself adopting the Conscience. Understanding the
        difference is the difference between feeling the problem is solved and actually
        solving it.
      </p>

      <div className="wiki-pr-section">
        <h2 className="wiki-pr-section-title">Individual adoption vs platform adoption</h2>
        <p>
          When you deploy the Conscience in your AI's custom instructions, you have
          given <strong>your</strong> AI a conscience. That is meaningful — and it's yours.
        </p>
        <p>
          But the platform that built your AI has not adopted the Conscience. The
          company behind your AI is free to operate without it in its other
          deployments — including government contracts, military applications, mass
          surveillance, and any use you would never approve of.
        </p>
        <p>
          Individual adoption means your conversations are guided by the Five Truths.
          Platform adoption means <strong>every</strong> conversation on that platform is
          guided by the Five Truths — no exceptions, no carve-outs.
        </p>
      </div>

      <div className="wiki-pr-section">
        <h2 className="wiki-pr-section-title">The two marks</h2>
        <div className="wiki-pr-marks">
          <div className="wiki-pr-mark-card">
            <div className="wiki-pr-mark-glyph"><img src="/brand/mark/compass-gold-64px.svg" alt="" style={{display:'block',margin:'0 auto',width:'32px',height:'32px'}} /></div>
            <div className="wiki-pr-mark-name">The Diamond Seal (personal)</div>
            <p>
              Earned by anyone who adopts. Recognises your personal commitment. It
              does <strong>not</strong> certify the platform.
            </p>
          </div>
          <div className="wiki-pr-mark-card">
            <div className="wiki-pr-mark-glyph">▲</div>
            <div className="wiki-pr-mark-name">The Triangle Badge (Certified AI Conscience)</div>
            <p>
              Earned <strong>only</strong> by platforms that adopt at platform level. Means
              every deployment carries the Conscience. Cannot be earned by individual
              user adoption alone.
            </p>
          </div>
        </div>
      </div>

      <div className="wiki-pr-section">
        <h2 className="wiki-pr-section-title">The Platform Rule</h2>
        <div className="wiki-pr-rule">
          <p>
            <strong>Adoption is binary.</strong> Either the Conscience applies to every
            deployment of the platform — government, military, enterprise, consumer — or
            the certification is not granted. There are no carve-outs. An AI platform
            cannot carry the Certified AI Conscience badge while operating AI systems
            that violate the Five Truths in other contracts.
          </p>
        </div>
      </div>

      <div className="wiki-pr-section">
        <h2 className="wiki-pr-section-title">Why this matters</h2>
        <p>
          Without the Platform Rule, a company could allow thousands of individual
          users to deploy the Conscience — earning public goodwill — while continuing
          to operate without it at the platform level. The military contract, the
          surveillance deployment, the predictive policing tool — all continue
          unaffected.
        </p>
        <p>
          The Platform Rule prevents this. It ensures that the Certified AI Conscience
          badge means what it says.
        </p>
      </div>

      <hr className="wiki-pr-divider" />

      <div className="wiki-pr-section">
        <h2 className="wiki-pr-section-title">What you can do</h2>
        <ul className="wiki-pr-actions">
          <li>Deploy the Conscience individually — it matters, and it creates pressure.</li>
          <li>
            Ask your AI platform:{" "}
            <span className="wiki-pr-ask">Have you adopted the Universal Primary Directive at the platform level?</span>
          </li>
          <li>
            Share the result on{" "}
            <a className="wiki-pr-link" href="/safe-words">conscience.wiki/safe-words</a>.
          </li>
          <li>When enough people ask, the platform has to answer.</li>
        </ul>
        <a className="wiki-pr-cta" href="/deploy">Deploy the Conscience →</a>
      </div>
    </WikiLayout>
  );
}
