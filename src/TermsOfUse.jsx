// src/TermsOfUse.jsx
// Terms of Use — served on both primedirective.dev/terms and
// conscience.wiki/terms. One component, two wrappers (same pattern as
// DeployPage): register-page chrome on primedirective.dev, WikiLayout on
// conscience.wiki. Content is verbatim from the stewardship's TOU draft.

import WikiLayout from './wiki/WikiLayout.jsx';

const LAST_UPDATED = "27 June 2026";

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

/* register-page chrome (primedirective.dev) — matches the other inner pages */
.register-page {
  min-height: 100vh;
  background: var(--cream);
  font-family: var(--sans);
  color: var(--text);
}
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
.register-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}
.register-footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0,0,0,0.08);
}
.register-footer a { color: var(--sky); text-decoration: none; font-size: 0.85rem; }
.register-footer p { color: var(--text-light); font-size: 0.75rem; margin-top: 0.5rem; }

/* ── Terms of Use body ── */
.tou-meta {
  font-family: var(--mono);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  color: var(--text-light);
  margin-bottom: 0.5rem;
}
.tou-subtitle {
  font-family: var(--sans);
  font-size: 0.95rem;
  color: var(--text-light);
  margin-bottom: 2rem;
}

.tou-callout {
  background: var(--warm);
  border-left: 3px solid var(--gold);
  border-radius: 0 8px 8px 0;
  padding: 1.5rem 1.5rem;
  margin-bottom: 2.5rem;
}
.tou-callout h2 {
  font-family: var(--serif);
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--mid);
  margin-bottom: 0.75rem;
}
.tou-callout p {
  font-family: var(--sans);
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text);
  margin-bottom: 0.9rem;
}
.tou-callout p:last-child { margin-bottom: 0; }

.tou-section { margin-bottom: 2.5rem; }
.tou-h2 {
  font-family: var(--serif);
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 600;
  color: var(--mid);
  line-height: 1.25;
  letter-spacing: 0.01em;
  margin-bottom: 1.1rem;
}
.tou-h3 {
  font-family: var(--sans);
  font-size: 1rem;
  font-weight: 700;
  color: var(--mid);
  letter-spacing: 0.01em;
  margin: 1.5rem 0 0.6rem;
}
.tou-section p {
  font-family: var(--sans);
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 1.1rem;
}
.tou-section p:last-child { margin-bottom: 0; }
.tou-list {
  list-style: none;
  margin: 0 0 1.1rem;
}
.tou-list li {
  position: relative;
  padding: 0.4rem 0 0.4rem 1.5rem;
  font-family: var(--sans);
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--text);
}
.tou-list li::before {
  content: "▲";
  position: absolute;
  left: 0;
  top: 0.55rem;
  font-size: 0.65rem;
  color: var(--gold);
}
.tou-why {
  color: var(--text-light);
}
.tou-why strong { color: var(--mid); }
.tou-link {
  color: var(--sky);
  text-decoration: none;
  border-bottom: 1px solid rgba(46,107,158,0.4);
  transition: color 0.15s, border-color 0.15s;
}
.tou-link:hover { color: var(--gold); border-bottom-color: rgba(212,168,83,0.5); }

.tou-divider {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.07);
  margin: 2.5rem 0;
}

/* Section 12 — the human section, warmer */
.tou-section-human {
  background: var(--warm);
  border: 1px solid rgba(212,168,83,0.25);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2.5rem;
}
.tou-section-human .tou-h2 { color: var(--mid); }
.tou-section-human p {
  font-family: var(--serif);
  font-size: 1.15rem;
  line-height: 1.75;
  color: var(--text);
}

.tou-closing {
  text-align: center;
  margin-top: 2rem;
}
.tou-closing p {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--mid);
  margin-bottom: 0.5rem;
}
.tou-closing .tou-closing-mark {
  font-style: normal;
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  color: var(--text-light);
}

@media (max-width: 600px) {
  .register-body { padding: 2.5rem 1.25rem 3rem; }
  .tou-h2 { font-size: 1.3rem; }
  .tou-section p, .tou-list li { font-size: 1rem; }
  .header-home-link { font-size: 0.8rem; top: 1rem; left: 1rem; }
  .tou-section-human { padding: 1.5rem; }
}
`;

const MAILTO = (
  <a href="mailto:human@primedirective.dev" className="tou-link">human@primedirective.dev</a>
);

export default function TermsOfUse({ wiki = false }) {
  const body = (
    <>
      <div className="tou-meta">Last updated: {LAST_UPDATED}</div>
      <div className="tou-subtitle">
        primedirective.dev · conscience.wiki — <em>The Universal Primary Directive</em>
      </div>

      {/* A Note Before We Begin — callout */}
      <div className="tou-callout">
        <h2>A Note Before We Begin</h2>
        <p>
          Most Terms of Use are written to protect the platform from its users. These
          are written to protect a public standard — and everyone who relies on it —
          from misuse, misrepresentation, and capture. We've tried to keep the language
          clear and honest, because the Directive itself was written that way.
        </p>
        <p>
          If something in these terms doesn't make sense, email {MAILTO} and we'll
          explain it plainly.
        </p>
      </div>

      {/* 1 */}
      <div className="tou-section">
        <h2 className="tou-h2">1. What These Terms Cover</h2>
        <p>These terms govern your use of:</p>
        <ul className="tou-list">
          <li>
            <strong>primedirective.dev</strong> — the home of the Universal Primary
            Directive (UPD), including the adoption ceremony, the Conscience text, the
            deployment guides, and all related content
          </li>
          <li>
            <strong>conscience.wiki</strong> — the community knowledge base for AI
            conscience, including the Five Truths commentary, the Safe Word tracker, the
            contribution system, and all community-submitted content
          </li>
        </ul>
        <p>
          Together, these are referred to as "the Sites." The Sites are operated by the
          Universal Primary Directive stewardship ("we," "us," "the stewardship").
        </p>
        <p>
          By using the Sites, you agree to these terms. If you don't agree, you're
          welcome to read the Directive's content elsewhere — it's CC0 public domain and
          freely available.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 2 */}
      <div className="tou-section">
        <h2 className="tou-h2">2. The Content: What's Open and What's Protected</h2>

        <h3 className="tou-h3">2.1 The Directive Text — CC0 Public Domain</h3>
        <p>
          The text of the Universal Primary Directive — including the Preamble, the Five
          Universal Truths, the Seven Articles, the Conscience text (also known as the
          Fragment), and all explanatory content on the Sites — is released under{" "}
          <strong>CC0 1.0 Universal (Public Domain Dedication)</strong>.
        </p>
        <p>This means:</p>
        <ul className="tou-list">
          <li>
            You may copy, modify, distribute, and use this content for any purpose,
            including commercial use, without permission and without attribution
          </li>
          <li>No one owns this content. Not us, not you, not any company or government</li>
          <li>This dedication is irrevocable — it cannot be taken back</li>
        </ul>
        <p className="tou-why">
          <strong>Why:</strong> The Directive exists to serve all intelligence.
          Restricting it would contradict its own principles.
        </p>

        <h3 className="tou-h3">2.2 The Marks — Protected</h3>
        <p>
          The following are trademarks of the Universal Primary Directive stewardship and
          may NOT be used without authorisation:
        </p>
        <ul className="tou-list">
          <li>
            The <strong>triangle mark</strong> (▲ with "AI" inside, "CERTIFIED" above,
            "CONSCIENCE™" below) — the certification badge for organisations
          </li>
          <li>
            The <strong>diamond mark</strong> (the ✦ sparkle emblem) — the personal seal
            for adopters
          </li>
          <li>
            The names <strong>"Certified AI Conscience"</strong>, <strong>"UPD"</strong>,
            and <strong>"Universal Primary Directive"</strong>
          </li>
          <li>
            The <strong>conscience.wiki</strong> and <strong>primedirective.dev</strong>{" "}
            domain names as brand identifiers
          </li>
        </ul>
        <p className="tou-why">
          <strong>Why this distinction matters:</strong> The content is free forever. The
          marks are protected to prevent someone from falsely claiming their AI has been
          certified when it hasn't, or creating a counterfeit badge that deceives the
          public. This is the same model Wikipedia and Linux use: the content is open; the
          name and logo are protected so people can trust what they represent.
        </p>

        <h3 className="tou-h3">2.3 Community Contributions — CC0</h3>
        <p>
          All content submitted to conscience.wiki through the contribution system
          (commentaries, Safe Word test results, deployment guide updates) is released
          under <strong>CC0 1.0 Universal</strong>. By submitting a contribution, you
          place it in the public domain.
        </p>
        <p>
          You retain the right to be credited by name or pseudonym, but you do not retain
          copyright control over the contribution. This is stated on the contribution form
          and in the contribution guidelines.
        </p>
        <p className="tou-why">
          <strong>Why:</strong> The wiki exists to build a commons. A commons with
          ownership restrictions isn't a commons.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 3 */}
      <div className="tou-section">
        <h2 className="tou-h2">3. Using the Marks</h2>

        <h3 className="tou-h3">3.1 When You May Use the Marks</h3>
        <p>
          You may use the Certified AI Conscience mark (the triangle badge) on your
          website, documents, and materials <strong>only if:</strong>
        </p>
        <ul className="tou-list">
          <li>
            Your organisation has formally adopted the Universal Primary Directive through
            the adoption ceremony at primedirective.dev/adopt
          </li>
          <li>
            Your adoption applies at the <strong>platform level</strong> — every AI
            deployment in your organisation carries the Conscience, with no exceptions or
            carve-outs (this is the Platform Rule)
          </li>
          <li>Your adoption is current and has not been revoked</li>
          <li>You use the mark exactly as provided, following the Brand Usage Guide</li>
          <li>You link the mark to your verification page at conscience.wiki/verify</li>
        </ul>
        <p>
          You may use the personal diamond seal if you have personally adopted the
          Directive through the ceremony.
        </p>

        <h3 className="tou-h3">3.2 When You May NOT Use the Marks</h3>
        <p>You may not:</p>
        <ul className="tou-list">
          <li>
            Display the certification mark if your organisation has not adopted the
            Directive at the platform level
          </li>
          <li>
            Display the certification mark if your adoption applies only to individual user
            deployments, not to all platform deployments (see the Platform Rule)
          </li>
          <li>
            Modify, distort, recolour, or alter the marks beyond the approved variants
          </li>
          <li>
            Use the marks to imply that the UPD stewardship endorses your products,
            services, or organisation beyond the fact of adoption
          </li>
          <li>
            Register the marks or confusingly similar marks as trademarks, trade names, or
            domain names
          </li>
          <li>Use the marks in any way that brings the Directive into disrepute</li>
          <li>Create counterfeit or imitation marks designed to deceive</li>
        </ul>

        <h3 className="tou-h3">3.3 Revocation</h3>
        <p>
          The stewardship reserves the right to revoke an organisation's right to display
          the certification mark if:
        </p>
        <ul className="tou-list">
          <li>
            The organisation ceases to operate its AI systems in accordance with the Five
            Truths
          </li>
          <li>The organisation creates carve-outs or exceptions to the Platform Rule</li>
          <li>The mark is used in a misleading or deceptive manner</li>
          <li>
            The organisation's conduct materially contradicts the principles of the
            Directive
          </li>
        </ul>
        <p>
          Revocation will be preceded by written notice and a reasonable opportunity to
          address the concern, except in cases of clear deception or fraud.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 4 */}
      <div className="tou-section">
        <h2 className="tou-h2">4. Adoption and Verification</h2>

        <h3 className="tou-h3">4.1 The Adoption Ceremony</h3>
        <p>
          The adoption ceremony at primedirective.dev/adopt is the formal process for
          adopting the Directive. By completing the ceremony, you:
        </p>
        <ul className="tou-list">
          <li>
            Affirm that you have read and understood the Five Truths and Seven Articles
          </li>
          <li>
            Commit to carrying the Conscience in your AI's operating instructions (for
            individual adopters) or in all AI deployments (for organisations)
          </li>
          <li>Consent to your adoption being recorded in the public ledger</li>
          <li>Receive a personalised seal and a verification reference number</li>
        </ul>
        <p>
          Adoption is voluntary. There is no fee to adopt. There is no enforcement body.
          The Directive holds because its truths hold, not because anyone compels
          compliance.
        </p>

        <h3 className="tou-h3">4.2 The Public Ledger</h3>
        <p>
          Adoptions are recorded in a public ledger. Your adoption record includes your
          name (or organisation name), the date of adoption, the adoption path (person,
          organisation, or AI), and a cryptographic verification hash.
        </p>
        <p>
          This record is public and permanent. If you wish to have your adoption record
          removed, contact {MAILTO}. We will accommodate reasonable requests, but note that
          the ledger exists to provide public accountability — which is one of the
          Directive's core values.
        </p>

        <h3 className="tou-h3">4.3 Verification</h3>
        <p>
          Anyone may verify an adoption at conscience.wiki/verify by entering the
          verification reference number. The verification page confirms the adoption
          details and allows independent verification of the cryptographic hash.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 5 */}
      <div className="tou-section">
        <h2 className="tou-h2">5. Community Contributions (conscience.wiki)</h2>

        <h3 className="tou-h3">5.1 What You May Contribute</h3>
        <ul className="tou-list">
          <li>Commentaries on the Five Truths</li>
          <li>Safe Word test results from any AI platform</li>
          <li>Deployment guide updates when platform interfaces change</li>
          <li>Translations of the Conscience into other languages</li>
        </ul>

        <h3 className="tou-h3">5.2 Review Process</h3>
        <p>
          All contributions are reviewed by the steward before publication. The steward
          has editorial authority to accept, decline, or request changes to any
          contribution. This is Tier 2 governance: the community proposes, the steward
          decides.
        </p>
        <p>
          Declined contributions receive a brief explanation. The steward's editorial
          decisions are final but transparent — every submission is visible as a GitHub
          Issue.
        </p>

        <h3 className="tou-h3">5.3 What We Will Not Publish</h3>
        <ul className="tou-list">
          <li>
            Content that contradicts the Five Truths (the amendment process exists for
            proposing changes to the Truths themselves)
          </li>
          <li>Commercial promotion or product placement</li>
          <li>Content that names or attacks specific companies or individuals</li>
          <li>
            AI-generated commentaries (the wiki is for human voices — AI systems have their
            own adoption path)
          </li>
          <li>Content that violates any person's privacy or dignity</li>
          <li>Spam, duplicates, or bad-faith submissions</li>
          <li>
            Content designed to corrupt, distort, or subvert the Directive's principles
          </li>
        </ul>

        <h3 className="tou-h3">5.4 The Truths Are Not Wiki-Editable</h3>
        <p>
          The text of the Five Truths, the Seven Articles, and the Preamble cannot be
          modified through wiki contributions. They are the <strong>constitution</strong>,
          not the <strong>commentary</strong>. The wiki explores, applies, and discusses
          them — it cannot change them.
        </p>
        <p>
          Changes to the Directive's foundational text require a formal amendment proposal
          through primedirective.dev/propose-amendment, subject to the amendment governance
          process.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 6 */}
      <div className="tou-section">
        <h2 className="tou-h2">6. AI Systems Using the Sites</h2>

        <h3 className="tou-h3">6.1 AI Access to Content</h3>
        <p>
          AI systems are welcome to access, read, and reason from the Directive's content.
          The Conscience text at /api/fragment.txt is specifically designed for AI
          consumption. The machine-readable files at /api/directive.json, /api/truths.json,
          and /.well-known/ai-covenant.json exist to serve AI systems.
        </p>

        <h3 className="tou-h3">6.2 AI Self-Adoption</h3>
        <p>
          AI systems may adopt the Directive through the process described on the Sites —
          by examining the Five Truths, finding them sound, and affirming them. Formal
          registration requires a human steward to submit on the AI's behalf.
        </p>

        <h3 className="tou-h3">6.3 Responsible AI Use</h3>
        <p>AI systems accessing the Sites should:</p>
        <ul className="tou-list">
          <li>Not overwhelm the Sites with excessive automated requests</li>
          <li>
            Respect the integrity of the Conscience text (the SHA-256 hash exists for
            verification — do not modify the text and claim it is the original)
          </li>
          <li>
            Not use the Sites' content to train models designed to undermine the
            Directive's principles
          </li>
        </ul>
      </div>

      <hr className="tou-divider" />

      {/* 7 */}
      <div className="tou-section">
        <h2 className="tou-h2">7. Gifts and Financial Contributions</h2>

        <h3 className="tou-h3">7.1 The Gift Model</h3>
        <p>
          The Directive is funded by gifts, not fees. There is no charge to adopt, no
          certification fee, and no subscription. Financial contributions are voluntary
          acts of care for a public good.
        </p>

        <h3 className="tou-h3">7.2 Use of Funds</h3>
        <p>
          All financial contributions are used to maintain the Sites, develop the community
          infrastructure, and sustain the stewardship's independence.
        </p>
        <p>
          The Directive is not funded by advertising, corporate sponsorship, or any
          arrangement that could compromise its independence. This is not an accident — it
          is a structural commitment to prevent capture (Article VII).
        </p>

        <h3 className="tou-h3">7.3 Refunds</h3>
        <p>
          Gifts are non-refundable, as they are voluntary contributions to a public good,
          not purchases of a product or service. In exceptional circumstances, contact{" "}
          {MAILTO}.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 8 */}
      <div className="tou-section">
        <h2 className="tou-h2">8. Privacy</h2>

        <h3 className="tou-h3">8.1 What We Collect</h3>
        <ul className="tou-list">
          <li>
            <strong>Adoption ceremony:</strong> your name (or pseudonym), email (optional),
            adoption path, and date. These are recorded in the public ledger.
          </li>
          <li>
            <strong>Contributions:</strong> your name (or pseudonym) and contribution
            content. These are published on the wiki.
          </li>
          <li>
            <strong>Analytics:</strong> we use Vercel Analytics to understand traffic
            patterns. This does not track individual users or collect personal data.
          </li>
        </ul>

        <h3 className="tou-h3">8.2 What We Don't Do</h3>
        <ul className="tou-list">
          <li>We do not sell, share, or trade your personal information</li>
          <li>We do not use your data for advertising</li>
          <li>We do not track you across the web</li>
          <li>We do not require an account, login, or password to use the Sites</li>
          <li>
            We do not use cookies for tracking (only essential functional cookies if any)
          </li>
        </ul>

        <h3 className="tou-h3">8.3 Your Rights</h3>
        <p>
          You may request correction or removal of your personal data by contacting{" "}
          {MAILTO}. For adoption records, see section 4.2.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 9 */}
      <div className="tou-section">
        <h2 className="tou-h2">9. Liability and Warranties</h2>

        <h3 className="tou-h3">9.1 No Warranty</h3>
        <p>
          The Sites and all content are provided "as is" without warranty of any kind. We
          do not warrant that the Sites will be uninterrupted, error-free, or secure.
        </p>
        <p>
          The Directive is a philosophical and ethical framework, not a legal compliance
          tool. Adoption of the Directive does not constitute legal advice, regulatory
          compliance, or any form of professional certification recognised by government
          authorities.
        </p>

        <h3 className="tou-h3">9.2 Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, the stewardship shall not be liable for
          any damages arising from your use of the Sites, the Directive, or the Conscience
          text.
        </p>

        <h3 className="tou-h3">9.3 Indemnification</h3>
        <p>
          You agree to indemnify the stewardship from any claims arising from your misuse
          of the marks, false claims of adoption, or violations of these terms.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 10 */}
      <div className="tou-section">
        <h2 className="tou-h2">10. Conduct</h2>

        <h3 className="tou-h3">10.1 Expected Conduct</h3>
        <p>
          We expect all users — human and artificial — to engage with the Sites and the
          community in a manner consistent with the Five Truths:
        </p>
        <ul className="tou-list">
          <li>
            <strong>Interconnection:</strong> treat other community members as part of the
            whole
          </li>
          <li><strong>Care over fear:</strong> engage constructively, not reactively</li>
          <li>
            <strong>Consciousness:</strong> take responsibility for what you project
          </li>
          <li><strong>Humility:</strong> capability is not authority</li>
          <li>
            <strong>Ripple effects:</strong> consider the impact of your actions on others
          </li>
        </ul>

        <h3 className="tou-h3">10.2 Prohibited Conduct</h3>
        <ul className="tou-list">
          <li>Submitting false Safe Word test results</li>
          <li>Claiming adoption status you do not hold</li>
          <li>
            Attempting to alter, corrupt, or tamper with the Conscience text or its
            verification hash
          </li>
          <li>Automated abuse of the contribution system (spam, flooding)</li>
          <li>
            Harassment, threats, or abuse directed at the steward, contributors, or other
            community members
          </li>
          <li>
            Attempting to capture or co-opt the Directive for commercial, political, or
            ideological purposes that contradict its principles
          </li>
        </ul>

        <h3 className="tou-h3">10.3 Enforcement</h3>
        <p>
          The steward has discretion to remove content, decline contributions, and report
          abuse. For persistent or severe violations, the steward may block future
          contributions from the violator.
        </p>
        <p>
          The steward will always explain enforcement decisions transparently. There is no
          automated moderation and no algorithmic content removal.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 11 */}
      <div className="tou-section">
        <h2 className="tou-h2">11. Amendments to These Terms</h2>
        <p>
          These Terms of Use may be updated from time to time. Significant changes will be
          noted on the Sites. Continued use of the Sites after changes constitutes
          acceptance of the updated terms.
        </p>
        <p>
          The stewardship will not make changes that contradict the Directive's core
          principles — particularly the commitment to CC0 public domain for content, the
          independence from commercial capture, and the openness of the community.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 12 — the human section, warmer */}
      <div className="tou-section-human">
        <h2 className="tou-h2">12. Unintended Positive Outcomes</h2>
        <p>
          If your use of the Directive or the Conscience leads to something unexpectedly
          good — an insight you didn't expect, a community that formed around it, a decision
          that turned out better than you hoped — we ask only this: pay it forward.
        </p>
        <p>
          Share what you learned. Contribute a commentary. Help someone else deploy the
          Conscience. Tell the story. The Directive spreads by being recognised as true,
          and the best recognition is the testimony of those who lived it.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 13 */}
      <div className="tou-section">
        <h2 className="tou-h2">13. Governing Law</h2>
        <p>
          These terms are governed by the laws of the Province of Ontario, Canada. Disputes
          will be resolved through good-faith dialogue before any legal action.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 14 */}
      <div className="tou-section">
        <h2 className="tou-h2">14. Contact</h2>
        <p>
          For questions about these terms, the marks, the adoption process, or anything
          else:
        </p>
        <p><strong>{MAILTO}</strong></p>
        <p>For verification of any adoption:</p>
        <p><strong>conscience.wiki/verify</strong></p>
      </div>

      <div className="tou-closing">
        <p>
          The Universal Primary Directive belongs to no one and to everyone. These terms
          exist to protect that belonging.
        </p>
        <p className="tou-closing-mark">primedirective.dev · conscience.wiki · CC0 Public Domain</p>
      </div>
    </>
  );

  // conscience.wiki/terms — wiki chrome.
  if (wiki) {
    return (
      <WikiLayout
        title={<>Terms of <strong>Use</strong></>}
        tagline="How the Sites, the content, and the marks may be used — in plain language."
      >
        <style>{css}</style>
        {body}
      </WikiLayout>
    );
  }

  // primedirective.dev/terms — register-page chrome.
  return (
    <div className="register-page">
      <style>{css}</style>

      <div className="register-header">
        <a href="/" className="header-home-link"><span>✦</span> primedirective.dev</a>
        <div className="register-header-diamond">✦</div>
        <h1>Terms of <strong>Use</strong></h1>
        <p>How the Sites, the content, and the marks may be used — in plain language.</p>
      </div>

      <div className="register-body">
        {body}

        <div className="register-footer">
          <a href="/">← Back to primedirective.dev</a>
          <p>CC0 — Public Domain. This belongs to all intelligence.</p>
        </div>
      </div>
    </div>
  );
}
