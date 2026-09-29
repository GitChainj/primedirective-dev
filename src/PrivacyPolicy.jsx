// src/PrivacyPolicy.jsx
// Privacy Policy — served on both primedirective.dev/privacy and
// conscience.wiki/privacy. One component, two wrappers (same pattern as
// TermsOfUse): register-page chrome on primedirective.dev, WikiLayout on
// conscience.wiki. Content is verbatim from the stewardship's Privacy draft.
// The .tou-* CSS classes are copied (not imported) to keep the two policy
// pages visually consistent.

import WikiLayout from './wiki/WikiLayout.jsx';

const LAST_UPDATED = "27 September 2026";

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
.register-header-mark {
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

/* ── Policy body (shared .tou-* styling) ── */
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
.tou-why { color: var(--text-light); }
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

/* Third-party services table — matches the deploy chart styling */
.tou-chart {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1.25rem 0;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px;
}
.tou-chart table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--sans);
  font-size: 0.9rem;
  min-width: 520px;
}
.tou-chart th {
  background: var(--gold);
  color: var(--deep);
  text-align: left;
  font-weight: 700;
  padding: 0.7rem 0.9rem;
  white-space: nowrap;
}
.tou-chart td {
  padding: 0.65rem 0.9rem;
  color: var(--text);
  border-top: 1px solid rgba(0,0,0,0.06);
  vertical-align: top;
}
.tou-chart tbody tr:nth-child(even) { background: rgba(212,168,83,0.07); }
.tou-chart td:first-child {
  font-weight: 600; color: var(--mid); white-space: nowrap;
}

/* The human / warmer section */
.tou-section-human {
  background: var(--warm);
  border: 1px solid rgba(212,168,83,0.25);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2.5rem;
}
.tou-section-human .tou-h2 { color: var(--mid); }
.tou-section-human p {
  font-family: var(--sans);
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--text);
}
.tou-section-human .tou-list li { font-size: 1.05rem; }

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

// Data-subject requests have their own channel so they are never lost in general
// correspondence, and so the one-month response clock starts at a known mailbox.
const PRIVACY_MAILTO = (
  <a href="mailto:privacy@primedirective.dev" className="tou-link">privacy@primedirective.dev</a>
);

export default function PrivacyPolicy({ wiki = false }) {
  const body = (
    <>
      <div className="tou-meta">Last updated: {LAST_UPDATED}</div>
      <div className="tou-subtitle">
        primedirective.dev · conscience.wiki — <em>The Universal Primary Directive</em>
      </div>

      {/* In short — plain-language opener, folded in from the Privacy Notice. Sits
          above the formal sections so the substance is readable without them. */}
      <div className="tou-section-human">
        <h2 className="tou-h2">In short</h2>
        <p>
          We publish a public covenant of ethical principles. If you choose to adopt it, we
          record that adoption on a public ledger so anyone can verify it. That record is
          permanent and public — that is the whole point of it.
        </p>
        <p>
          We collect very little: the name or pseudonym you give us, the date, and a
          cryptographic reference. We do not track you, profile you, sell your data, or send
          you marketing.
        </p>
        <p>
          You can adopt under a pseudonym. You can ask us to revoke your record. The rest of
          this notice sets out the detail.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* Our Commitment — callout */}
      <div className="tou-callout">
        <h2>Our Commitment</h2>
        <p>
          Privacy is a condition of trust. The Universal Primary Directive asks AI systems
          to operate with transparency and care. We hold ourselves to the same standard.
          This policy explains what data we collect, why, and what we do — and do not do —
          with it.
        </p>
      </div>

      {/* 1 */}
      <div className="tou-section">
        <h2 className="tou-h2">1. Who We Are</h2>
        <p>
          The Sites — primedirective.dev and conscience.wiki — are operated by the
          Universal Primary Directive stewardship, and the Directive is stewarded by the{" "}
          <strong>Universal Primary Directive Foundation</strong> (in formation; to be
          federally incorporated under the Canada Not-for-profit Corporations Act), with its
          registered office in Ontario, Canada.
        </p>
        <p>
          For data protection purposes we are the <strong>data controller</strong> for the
          information described in this notice.
        </p>
        <p>
          <strong>Privacy and data-subject requests:</strong> {PRIVACY_MAILTO}
          <br />
          <strong>General contact:</strong> {MAILTO}
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 2 */}
      <div className="tou-section">
        <h2 className="tou-h2">2. What We Collect and Why</h2>

        <h3 className="tou-h3">2.1 When You Adopt the Directive</h3>
        <p>
          If you complete the adoption ceremony at primedirective.dev/adopt, we collect:
        </p>
        <ul className="tou-list">
          <li>
            <strong>Your name</strong> (or pseudonym) — displayed in the public adoption
            ledger and on your personalised seal
          </li>
          <li>
            <strong>Your email address</strong> (optional) — used only to contact you about
            your adoption if necessary; never shared, never used for marketing
          </li>
          <li>
            <strong>Your adoption path</strong> (person, organisation, or AI) — recorded in
            the public ledger
          </li>
          <li><strong>Your adoption date</strong> — recorded in the public ledger</li>
        </ul>
        <p className="tou-why">
          <strong>Why:</strong> The public ledger exists for accountability and
          verification. Anyone can verify an adoption at conscience.wiki/verify. Your name
          and adoption date are public because transparency is one of the Directive's core
          values.
        </p>
        <p className="tou-why">
          <strong>Your choice:</strong> You may adopt under a pseudonym. The ledger records
          whatever name you provide. If you prefer not to have any public record, you may
          deploy the Conscience without completing the formal ceremony — the text is CC0
          public domain and freely available.
        </p>

        <h3 className="tou-h3">2.2 When You Contribute to the Wiki</h3>
        <p>
          If you submit a contribution to conscience.wiki (a commentary, a Safe Word test
          result, or a deployment guide update), we collect:
        </p>
        <ul className="tou-list">
          <li>
            <strong>Your name</strong> (or pseudonym) — credited on the contribution if
            published
          </li>
          <li>
            <strong>Your contribution content</strong> — reviewed by the steward and, if
            accepted, published on the wiki
          </li>
        </ul>
        <p className="tou-why">
          <strong>Why:</strong> Attribution matters. Contributors deserve credit for their
          work.
        </p>
        <p className="tou-why">
          <strong>Your choice:</strong> You may contribute under a pseudonym.
        </p>

        <h3 className="tou-h3">2.3 When You Visit the Sites</h3>
        <p>
          We use <strong>Vercel Analytics</strong> to understand how many people visit the
          Sites and which pages they view. Vercel Analytics is privacy-respecting:
        </p>
        <ul className="tou-list">
          <li>It does not use cookies</li>
          <li>It does not track individual users</li>
          <li>It does not collect personal data</li>
          <li>It does not follow you across the web</li>
          <li>It provides only aggregate data (total page views, visitor counts)</li>
        </ul>
        <p>
          We do not use Google Analytics, Facebook Pixel, or any other tracking service.
        </p>

        <h3 className="tou-h3">2.4 When You Make a Financial Gift</h3>
        <p>
          If you make a voluntary gift through our donation page, payment is processed by{" "}
          <strong>Stripe</strong>. We do not see or store your credit card number or payment
          details. Stripe handles payment processing under its own privacy policy
          (stripe.com/privacy). We receive only a confirmation that a gift was made and the
          amount.
        </p>

        <h3 className="tou-h3">2.5 Server Logs</h3>
        <p>
          The Sites are hosted on <strong>Vercel</strong>. Vercel may collect standard
          server logs (IP addresses, browser types, timestamps) as part of its hosting
          infrastructure. These logs are governed by Vercel's privacy policy and are not
          accessed by the stewardship for tracking or identification purposes.
        </p>

        {/* Pseudonymity, folded in from the Privacy Notice. Kept as a subsection of
            "What We Collect" rather than a new numbered section so the existing
            section numbers — cited elsewhere on the site — do not shift. */}
        <h3 className="tou-h3">2.6 Adopting Under a Pseudonym</h3>
        <p>You choose how you appear on the public record:</p>
        <ul className="tou-list">
          <li>
            <strong>Public name</strong> — your real name appears on the ledger.
          </li>
          <li>
            <strong>Pseudonymous</strong> — a name of your choosing appears on the ledger. If
            we hold any link between that pseudonym and your real identity, we keep it in
            private records and never publish it.
          </li>
          <li>
            <strong>Organisational</strong> — the record identifies an organisation rather
            than an individual.
          </li>
        </ul>
        <p>
          Please understand that <strong>pseudonymity is not anonymity</strong>. Someone
          determined to identify you might do so by combining your pseudonym with information
          available elsewhere. We publish nothing that would assist this — no IP addresses, no
          timestamps beyond the adoption date, no technical fingerprints — but we cannot
          prevent it entirely.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 3 — the section people care about most, warmer */}
      <div className="tou-section-human">
        <h2 className="tou-h2">3. What We Do Not Do</h2>
        <p>We make these commitments plainly:</p>
        <ul className="tou-list">
          <li><strong>We do not sell your data.</strong> Not now, not ever.</li>
          <li>
            <strong>We do not share your data</strong> with third parties for marketing,
            advertising, or profiling.
          </li>
          <li>
            <strong>We do not use your data for advertising.</strong> The Sites carry no
            advertisements and never will (Article VII).
          </li>
          <li>
            <strong>We do not track you across the web.</strong> We have no tracking
            cookies, no pixels, no retargeting.
          </li>
          <li>
            <strong>We do not require an account, login, or password.</strong> You can use
            every feature of both Sites without creating an account.
          </li>
          <li>
            <strong>We do not build profiles.</strong> We do not aggregate your activity
            across sessions, pages, or visits.
          </li>
          <li>
            <strong>We do not use your contributions to train AI models.</strong> Community
            contributions are published for human readers, not harvested for machine
            learning.
          </li>
          <li>
            <strong>We do not sell or licence access to the adoption ledger.</strong> The
            ledger is public for transparency, not for commercial exploitation.
          </li>
        </ul>
      </div>

      <hr className="tou-divider" />

      {/* 4 */}
      <div className="tou-section">
        <h2 className="tou-h2">4. Cookies</h2>
        <p>
          The Sites use no tracking cookies. If any essential functional cookies are used by
          the hosting infrastructure (Vercel), they are limited to technical necessity (such
          as load balancing) and contain no personal data.
        </p>
        <p>
          We do not display cookie consent banners because there are no non-essential
          cookies to consent to.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 5 */}
      <div className="tou-section">
        <h2 className="tou-h2">5. Data Retention</h2>
        <ul className="tou-list">
          <li>
            <strong>Adoption records</strong> are retained permanently in the public ledger.
            This is by design — the ledger is the public record of the Directive's adoption,
            and its permanence is part of its accountability function.
          </li>
          <li>
            <strong>Contribution content</strong> is retained permanently once published.
            Unpublished submissions (GitHub Issues) are retained for stewardship reference.
          </li>
          <li>
            <strong>Analytics data</strong> is retained according to Vercel's data retention
            policies. No personal data is included.
          </li>
          <li>
            <strong>Email correspondence</strong> (if you contact us) is retained for the
            purpose of responding and for stewardship records.
          </li>
          <li>
            <strong>Any pseudonym-to-identity mapping</strong> is retained until you ask us to
            erase it.
          </li>
          <li>
            <strong>Confirmation email addresses</strong> are discarded once the confirmation
            completes. They are never published on the ledger.
          </li>
          <li>
            <strong>Consent records</strong> (the timestamp, the version of the disclosure you
            were shown, and your chosen identity class) are kept privately as our
            accountability record for the lawful basis of processing. They are not published.
          </li>
        </ul>
      </div>

      <hr className="tou-divider" />

      {/* 6 */}
      <div className="tou-section">
        <h2 className="tou-h2">6. Your Rights</h2>
        <p>
          Under the GDPR and, where applicable, other data protection laws, you have the
          following rights:
        </p>
        <div className="tou-chart">
        <table>
          <thead>
            <tr>
              <th>Right</th>
              <th>What it means here</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Access</strong></td>
              <td>Ask us what information we hold about you, and receive a copy of it.</td>
            </tr>
            <tr>
              <td><strong>Correct</strong></td>
              <td>Ask us to fix information that is inaccurate.</td>
            </tr>
            <tr>
              <td><strong>Erase</strong></td>
              <td>Ask us to erase your information — see what erasure means here, below.</td>
            </tr>
            <tr>
              <td><strong>Restrict</strong></td>
              <td>Ask us to pause our use of your information while a question is resolved.</td>
            </tr>
            <tr>
              <td><strong>Portability</strong></td>
              <td>Receive a copy in a structured, machine-readable format.</td>
            </tr>
            <tr>
              <td><strong>Object</strong></td>
              <td>Object to our processing of your information.</td>
            </tr>
            <tr>
              <td><strong>Withdraw consent</strong></td>
              <td>Withdraw your consent at any time, for anything collected on that basis.</td>
            </tr>
            <tr>
              <td><strong>Complain</strong></td>
              <td>Complain to a data protection supervisory authority.</td>
            </tr>
          </tbody>
        </table>
        </div>
        <p>
          <strong>To exercise any of these:</strong> email {PRIVACY_MAILTO}. We will respond
          within one month. If your request is complex we may extend this by up to two further
          months, and we will tell you if we do.
        </p>

        {/* Revocation-as-erasure, folded in from the Privacy Notice. Stated before
            adoption, not after, so the choice is genuinely informed. */}
        <h3 className="tou-h3">
          What erasure means here — please read this before adopting
        </h3>
        <p>
          Adoption records are cryptographically signed. A signature, once published, is
          mathematically permanent and may have been copied by others.{" "}
          <strong>We cannot un-sign it, and we cannot recall copies held by third parties.</strong>
        </p>
        <p>When you ask us to erase your information, we will:</p>
        <ul className="tou-list">
          <li>
            <strong>Delete any private mapping</strong> between your pseudonym and your real
            identity. If you adopted pseudonymously, this severs the link between the public
            record and you as a person.
          </li>
          <li>
            <strong>Revoke your public record</strong>, so your adoption is no longer presented
            as active anywhere we control.
          </li>
          <li>
            <strong>Remove your record</strong> from listings, search surfaces, and directories
            we operate.
          </li>
          <li>
            <strong>Delete any other information</strong> about you that we hold.
          </li>
        </ul>
        <p>
          What we cannot do is reach into copies of the signed record held by others. We tell
          you this before you adopt so the choice is genuinely informed.
        </p>

        <h3 className="tou-h3">6.1 For European Visitors (GDPR)</h3>
        <p>
          If you are located in the European Economic Area, you have additional rights under
          the General Data Protection Regulation, including the right to lodge a complaint
          with your local data protection authority. Our lawful basis for processing is
          consent (for adoption and contributions) and legitimate interest (for analytics
          and site operation).
        </p>

        <h3 className="tou-h3">6.2 For Canadian Visitors (PIPEDA)</h3>
        <p>
          We comply with the Personal Information Protection and Electronic Documents Act.
          You have the right to access, correct, and challenge the accuracy of your personal
          information held by us.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 7 */}
      <div className="tou-section">
        <h2 className="tou-h2">7. Children</h2>
        <p>
          The Sites are not directed at children under 16. We do not knowingly collect
          personal data from children. If we learn that we have collected data from a child
          under 16, we will delete it promptly.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 8 */}
      <div className="tou-section">
        <h2 className="tou-h2">8. International Data Transfers</h2>
        <p>
          The Sites are hosted on Vercel's global infrastructure. If you access the Sites
          from outside Canada, your data may be processed in Canada or other jurisdictions
          where Vercel maintains servers. By using the Sites, you consent to this transfer.
          We ensure that any data processing complies with applicable privacy laws regardless
          of where it occurs.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 9 */}
      <div className="tou-section">
        <h2 className="tou-h2">9. Data Security</h2>
        <p>We implement reasonable measures to protect your data, including:</p>
        <ul className="tou-list">
          <li>HTTPS encryption on all pages</li>
          <li>Secure serverless functions for form submissions</li>
          <li>No storage of payment details (handled by Stripe)</li>
          <li>No user accounts or passwords to be compromised</li>
          <li>Minimal data collection as a fundamental principle</li>
        </ul>
        <p>
          No system is perfectly secure. If we become aware of a data breach that affects
          your personal information, we will notify you and any relevant authorities as
          required by law.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 10 */}
      <div className="tou-section">
        <h2 className="tou-h2">10. Third-Party Services</h2>
        <p>The Sites use the following third-party services:</p>
        <div className="tou-chart">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Purpose</th>
                <th>Their privacy policy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vercel</td>
                <td>Hosting and analytics</td>
                <td>vercel.com/legal/privacy-policy</td>
              </tr>
              <tr>
                <td>Stripe</td>
                <td>Payment processing</td>
                <td>stripe.com/privacy</td>
              </tr>
              <tr>
                <td>GitHub</td>
                <td>Contribution management</td>
                <td>docs.github.com/en/site-policy/privacy-policies</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We do not use social media tracking widgets, embedded advertising networks, or any
          service whose primary business model is surveillance or data brokerage.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 11 */}
      <div className="tou-section">
        <h2 className="tou-h2">11. Changes to This Policy</h2>
        <p>
          If we make significant changes to this policy, we will note the changes on the
          Sites and update the "Last updated" date. We will not make changes that contradict
          our core commitments — particularly the commitments in Section 3 ("What We Do Not
          Do").
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 12 */}
      <div className="tou-section">
        <h2 className="tou-h2">12. Contact</h2>
        <p>
          For a data-subject request — access, correction, erasure, restriction, portability,
          objection, or withdrawal of consent:
        </p>
        <p><strong>{PRIVACY_MAILTO}</strong></p>
        <p>For any other privacy question or concern:</p>
        <p><strong>{MAILTO}</strong></p>
        <p>
          We will respond within one month, and will tell you if a complex request needs
          longer.
        </p>
      </div>

      <div className="tou-closing">
        <p>
          The Universal Primary Directive belongs to no one and to everyone. Your privacy
          belongs to you.
        </p>
        <p className="tou-closing-mark">primedirective.dev · conscience.wiki · CC0 Public Domain</p>
      </div>
    </>
  );

  // conscience.wiki/privacy — wiki chrome.
  if (wiki) {
    return (
      <WikiLayout
        title={<>Privacy <strong>Policy</strong></>}
        tagline="What we collect, why, and what we never do."
      >
        <style>{css}</style>
        {body}
      </WikiLayout>
    );
  }

  // primedirective.dev/privacy — register-page chrome.
  return (
    <div className="register-page">
      <style>{css}</style>

      <div className="register-header">
        <a href="/" className="header-home-link"><img src="/brand/mark/compass-gold-16px.svg" alt="" style={{width:'0.75em',height:'0.75em',verticalAlign:'-0.1em',marginRight:'0.35em'}} />primedirective.dev</a>
        <div className="register-header-mark"><img src="/brand/mark/compass-gold-64px.svg" alt="" style={{display:'block',margin:'0 auto',width:'48px',height:'48px'}} /></div>
        <h1>Privacy <strong>Policy</strong></h1>
        <p>What we collect, why, and what we never do.</p>
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
