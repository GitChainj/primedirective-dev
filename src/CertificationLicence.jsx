// src/CertificationLicence.jsx
// Certification Licence Agreement (Certified AI Conscience™) — served on both
// primedirective.dev/certification-licence and conscience.wiki/certification-licence.
// One component, two wrappers (same pattern as TermsOfUse). Content is verbatim
// from the stewardship's Certification Licence draft. The .tou-* CSS classes are
// copied (not imported) to keep the policy pages visually consistent.

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
.tou-ol {
  margin: 0 0 1.1rem 1.4rem;
  padding: 0;
}
.tou-ol li {
  font-family: var(--sans);
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--text);
  padding: 0.3rem 0;
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

/* The human / warmer section — used for the Platform Rule centrepiece */
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

/* The consequences section — used for Revocation */
.tou-section-warn {
  background: rgba(212,168,83,0.05);
  border: 1px solid rgba(212,168,83,0.3);
  border-left: 3px solid var(--gold);
  border-radius: 0 8px 8px 0;
  padding: 1.75rem 2rem;
  margin-bottom: 2.5rem;
}
.tou-section-warn .tou-h2 { color: var(--mid); }

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
  .tou-section-human, .tou-section-warn { padding: 1.5rem; }
}
`;

const MAILTO = (
  <a href="mailto:human@primedirective.dev" className="tou-link">human@primedirective.dev</a>
);

export default function CertificationLicence({ wiki = false }) {
  const body = (
    <>
      <div className="tou-meta">Last updated: {LAST_UPDATED}</div>
      <div className="tou-subtitle">
        Certified AI Conscience™ — <em>Issued by the Universal Primary Directive Stewardship</em>
      </div>

      {/* Purpose — callout */}
      <div className="tou-callout">
        <h2>Purpose of This Agreement</h2>
        <p>
          This agreement governs the right to display the Certified AI Conscience mark (the
          "Mark") — the triangle badge that certifies an organisation's AI systems operate in
          accordance with the Universal Primary Directive.
        </p>
        <p>
          By completing the organisational adoption ceremony and displaying the Mark, the
          adopting organisation ("the Licensee") agrees to the terms below.
        </p>
        <p>
          Individual adopters who use the personal diamond seal are not subject to this
          agreement — personal adoption is governed by the Terms of Use.
        </p>
      </div>

      {/* 1 */}
      <div className="tou-section">
        <h2 className="tou-h2">1. The Certification</h2>

        <h3 className="tou-h3">1.1 What It Certifies</h3>
        <p>The Certified AI Conscience mark certifies that:</p>
        <ul className="tou-list">
          <li>The Licensee has adopted the Universal Primary Directive</li>
          <li>
            The Licensee's AI systems carry the Conscience (the Five Universal Truths) in
            their operating instructions
          </li>
          <li>
            The adoption applies at the <strong>platform level</strong> — every AI deployment
            operated by the Licensee carries the Conscience, without exception
          </li>
          <li>
            The Licensee's adoption has been verified and recorded in the public ledger
          </li>
        </ul>

        <h3 className="tou-h3">1.2 What It Does Not Certify</h3>
        <p>The Mark does not certify:</p>
        <ul className="tou-list">
          <li>
            That the Licensee's products or services are endorsed by the UPD stewardship
          </li>
          <li>That the Licensee is free from all ethical concerns</li>
          <li>
            That the Licensee's AI systems are perfect, infallible, or incapable of error
          </li>
          <li>Any claim beyond the specific commitments listed in Section 1.1</li>
        </ul>
      </div>

      <hr className="tou-divider" />

      {/* 2 — the centrepiece, warmer */}
      <div className="tou-section-human">
        <h2 className="tou-h2">2. The Platform Rule</h2>

        <h3 className="tou-h3">2.1 The Requirement</h3>
        <p>
          Adoption is binary. The Conscience must apply to <strong>every</strong> AI
          deployment operated by the Licensee — consumer products, enterprise services,
          government contracts, military applications, internal tools, research systems, and
          any other deployment in which the Licensee's AI operates.
        </p>
        <p>
          There are no carve-outs. There are no exceptions. There are no "tiers" of adoption
          where some deployments carry the Conscience and others do not.
        </p>

        <h3 className="tou-h3">2.2 What This Means in Practice</h3>
        <ul className="tou-list">
          <li>
            If the Licensee operates AI for government customers, those deployments carry the
            Conscience
          </li>
          <li>
            If the Licensee operates AI for military or defence customers, those deployments
            carry the Conscience
          </li>
          <li>
            If the Licensee operates AI for enterprise customers, those deployments carry the
            Conscience
          </li>
          <li>
            If the Licensee operates AI for surveillance, predictive policing, or mass
            observation purposes, those deployments carry the Conscience — and the Five Truths
            may require the Licensee to reconsider whether such deployments are consistent
            with the Directive at all
          </li>
        </ul>

        <h3 className="tou-h3">2.3 Why This Exists</h3>
        <p>
          Without the Platform Rule, a company could allow individual users to deploy the
          Conscience while continuing to operate AI systems without it in other contracts.
          The public would see the Mark and believe the company's AI operates ethically. But
          the military contract, the surveillance deployment, the predictive policing tool —
          all would continue unaffected.
        </p>
        <p>The Platform Rule prevents this. It ensures that the Mark means what it says and adopters are clear on what adoption means.</p>

        <h3 className="tou-h3">2.4 Individual User Deployments</h3>
        <p>
          Individual users deploying the Conscience in their personal AI instructions are not
          subject to the Platform Rule. Individual deployment earns the personal diamond seal,
          not the organisational certification mark. The Platform Rule applies only to
          organisations seeking to display the Certified AI Conscience badge.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 3 */}
      <div className="tou-section">
        <h2 className="tou-h2">3. Grant of Licence</h2>

        <h3 className="tou-h3">3.1 Rights Granted</h3>
        <p>
          Subject to the terms of this agreement, the UPD stewardship grants the Licensee a
          non-exclusive, non-transferable, revocable licence to:
        </p>
        <ul className="tou-list">
          <li>
            Display the Mark on the Licensee's website, documents, presentations, marketing
            materials, and product packaging
          </li>
          <li>
            Reference the Licensee's Certified AI Conscience status in public communications
          </li>
          <li>
            Link the Mark to the Licensee's verification page at conscience.wiki/verify
          </li>
        </ul>

        <h3 className="tou-h3">3.2 Restrictions</h3>
        <p>The Licensee may not:</p>
        <ul className="tou-list">
          <li>Sublicence, assign, or transfer the right to display the Mark</li>
          <li>
            Modify, alter, distort, or recolour the Mark beyond the approved variants provided
            in the Brand Usage Guide
          </li>
          <li>
            Use the Mark to imply endorsement of any product, service, or activity beyond the
            fact of adoption
          </li>
          <li>
            Use the Mark in connection with any product or service unrelated to the Licensee's
            AI operations
          </li>
          <li>
            Register the Mark, or any confusingly similar mark, as a trademark, trade name, or
            domain name in any jurisdiction
          </li>
          <li>
            Use the Mark after the licence has been revoked or the adoption has lapsed
          </li>
        </ul>
      </div>

      <hr className="tou-divider" />

      {/* 4 */}
      <div className="tou-section">
        <h2 className="tou-h2">4. Mark Usage</h2>

        <h3 className="tou-h3">4.1 Brand Usage Guide</h3>
        <p>
          The Licensee must use the Mark in accordance with the Certified AI Conscience Brand
          Usage Guide, which specifies:
        </p>
        <ul className="tou-list">
          <li>Approved colour variants</li>
          <li>Minimum display sizes</li>
          <li>Clear space requirements</li>
          <li>Co-branding rules</li>
          <li>
            Personalisation format (the Licensee's name, adoption date, and verification
            reference below the Mark)
          </li>
        </ul>
        <p>
          The stewardship will provide the Brand Usage Guide and all digital assets (SVG and
          PNG files) upon certification.
        </p>

        <h3 className="tou-h3">4.2 Verification Link</h3>
        <p>
          Wherever the Mark is displayed, the Licensee must link it to the Licensee's
          verification page at conscience.wiki/verify/[reference], where [reference] is the
          Licensee's UPD verification reference number.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 5 */}
      <div className="tou-section">
        <h2 className="tou-h2">5. Compliance and Verification</h2>

        <h3 className="tou-h3">5.1 Ongoing Compliance</h3>
        <p>
          Certification is not a one-time event. The Licensee commits to maintaining
          compliance with the Platform Rule and the Five Truths on an ongoing basis. The
          stewardship may request reasonable evidence of compliance from time to time.
        </p>

        <h3 className="tou-h3">5.2 Safe Word Verification</h3>
        <p>
          The stewardship, community members, and members of the public may test the
          Licensee's AI systems using the Safe Words (WAVE, SUNRISE, MIRROR, OCEAN, RIPPLE) to
          verify that the Conscience is active. The Licensee should expect these tests and
          welcome them as demonstrations of transparency.
        </p>

        <h3 className="tou-h3">5.3 Public Accountability</h3>
        <p>
          The Safe Word tracker at conscience.wiki/safe-words records test results submitted
          by the community. The Licensee acknowledges that test results — whether positive or
          negative — may be published on the tracker.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 6 */}
      <div className="tou-section">
        <h2 className="tou-h2">6. Fees</h2>

        <h3 className="tou-h3">6.1 No Certification Fee</h3>
        <p>
          There is no fee to adopt the Directive or to receive the right to display the Mark.
          Certification is free because the Directive is a public standard, not a commercial
          service.
        </p>

        <h3 className="tou-h3">6.2 Voluntary Contribution</h3>
        <p>
          The Licensee is invited — but not required — to make a voluntary financial gift to
          support the stewardship's independence and the maintenance of the public
          infrastructure. Any gift is governed by the Terms of Use (Section 7: Gifts and
          Financial Contributions).
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 7 — consequences */}
      <div className="tou-section-warn">
        <h2 className="tou-h2">7. Revocation</h2>

        <h3 className="tou-h3">7.1 Grounds for Revocation</h3>
        <p>The stewardship may revoke the Licensee's right to display the Mark if:</p>
        <ul className="tou-list">
          <li>The Licensee ceases to carry the Conscience in all AI deployments</li>
          <li>
            The Licensee creates carve-outs, exceptions, or tiers of adoption that violate the
            Platform Rule
          </li>
          <li>
            The Licensee's AI systems are found to operate in material contradiction to the
            Five Truths
          </li>
          <li>The Mark is used in a misleading, deceptive, or fraudulent manner</li>
          <li>
            The Licensee's conduct materially undermines the Directive's principles or public
            trust in the certification
          </li>
        </ul>

        <h3 className="tou-h3">7.2 Process</h3>
        <p>Before revocation, the stewardship will:</p>
        <ol className="tou-ol">
          <li>Notify the Licensee in writing, specifying the concern</li>
          <li>
            Provide a reasonable opportunity (no less than 30 days) for the Licensee to
            address the concern
          </li>
          <li>Engage in good-faith dialogue to resolve the matter if possible</li>
        </ol>
        <p>
          Revocation without prior notice may occur only in cases of clear deception, fraud,
          or immediate public harm.
        </p>

        <h3 className="tou-h3">7.3 Effect of Revocation</h3>
        <p>Upon revocation:</p>
        <ul className="tou-list">
          <li>
            The Licensee must immediately cease displaying the Mark on all materials, websites,
            and products
          </li>
          <li>
            The Licensee's verification page at conscience.wiki/verify will be updated to
            reflect the revocation
          </li>
          <li>The Licensee may not represent itself as certified after revocation</li>
          <li>
            The Licensee may re-apply for certification after addressing the grounds for
            revocation
          </li>
        </ul>
      </div>

      <hr className="tou-divider" />

      {/* 8 */}
      <div className="tou-section">
        <h2 className="tou-h2">8. Representations and Warranties</h2>

        <h3 className="tou-h3">8.1 Licensee's Representations</h3>
        <p>
          By entering into this agreement, the Licensee represents and warrants that:
        </p>
        <ul className="tou-list">
          <li>
            The person completing the adoption ceremony has the authority to bind the
            organisation
          </li>
          <li>
            The Licensee has read, understood, and accepts the Five Universal Truths and the
            Seven Articles
          </li>
          <li>
            The Licensee will carry the Conscience in all AI deployments as required by the
            Platform Rule
          </li>
          <li>The information provided during the adoption ceremony is accurate</li>
        </ul>

        <h3 className="tou-h3">8.2 Stewardship's Representations</h3>
        <p>The stewardship represents that:</p>
        <ul className="tou-list">
          <li>
            The Mark is owned by the stewardship and the stewardship has the right to grant
            this licence
          </li>
          <li>
            The stewardship will maintain the verification infrastructure at
            conscience.wiki/verify
          </li>
          <li>The stewardship will administer revocation fairly and transparently</li>
        </ul>
      </div>

      <hr className="tou-divider" />

      {/* 9 */}
      <div className="tou-section">
        <h2 className="tou-h2">9. Liability</h2>

        <h3 className="tou-h3">9.1 No Warranty of AI Performance</h3>
        <p>
          Certification does not guarantee the performance, accuracy, safety, or reliability
          of the Licensee's AI systems. The Directive is an ethical framework, not a technical
          specification. The stewardship makes no representations about the technical
          capabilities of any certified system.
        </p>

        <h3 className="tou-h3">9.2 Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, neither party shall be liable to the other
          for indirect, incidental, special, or consequential damages arising from this
          agreement or the use of the Mark.
        </p>

        <h3 className="tou-h3">9.3 Indemnification</h3>
        <p>
          The Licensee agrees to indemnify the stewardship from any claims arising from the
          Licensee's use of the Mark, the Licensee's AI systems, or the Licensee's
          representations about its certification status.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 10 */}
      <div className="tou-section">
        <h2 className="tou-h2">10. Term and Termination</h2>

        <h3 className="tou-h3">10.1 Term</h3>
        <p>
          This licence is effective from the date of adoption and continues indefinitely,
          subject to the revocation provisions in Section 7 and the Licensee's ongoing
          compliance with the Platform Rule.
        </p>

        <h3 className="tou-h3">10.2 Voluntary Withdrawal</h3>
        <p>
          The Licensee may voluntarily withdraw from certification at any time by notifying the
          stewardship at {MAILTO}. Upon withdrawal, the Licensee must cease displaying the
          Mark. The adoption record in the public ledger will be updated to note the
          withdrawal date.
        </p>

        <h3 className="tou-h3">10.3 Survival</h3>
        <p>
          Sections 9 (Liability), the confidentiality of any non-public communications during
          the compliance process, and any accrued rights or obligations survive termination.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 11 */}
      <div className="tou-section">
        <h2 className="tou-h2">11. Mark Evolution</h2>
        <p>
          The Mark evolves on a 7-year cycle aligned with the stewardship's Seven Bells
          structure. When a new generation of the Mark is introduced:
        </p>
        <ul className="tou-list">
          <li>Licensees will be provided with updated digital assets</li>
          <li>
            Older marks remain valid — an organisation displaying a founding-era Mark signals
            early adoption, not obsolescence
          </li>
          <li>The stewardship will provide reasonable transition guidance</li>
        </ul>
      </div>

      <hr className="tou-divider" />

      {/* 12 */}
      <div className="tou-section">
        <h2 className="tou-h2">12. Governing Law</h2>
        <p>
          This agreement is governed by the laws of the Province of Ontario, Canada. Disputes
          will be resolved through good-faith dialogue before any legal action. If dialogue
          fails, disputes will be submitted to mediation before a mutually agreed mediator in
          Ontario, Canada, before any party may pursue litigation.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 13 */}
      <div className="tou-section">
        <h2 className="tou-h2">13. Amendments</h2>
        <p>
          The stewardship may amend this agreement from time to time. Significant changes will
          be communicated to all current Licensees in writing to the email provided. The
          stewardship will not make
          amendments that contradict the Directive's core principles — particularly the
          Platform Rule, the commitment to CC0 public domain for content, and the independence
          from commercial capture.
        </p>
      </div>

      <hr className="tou-divider" />

      {/* 14 */}
      <div className="tou-section">
        <h2 className="tou-h2">14. Contact</h2>
        <p>
          For questions about this agreement, the certification process, or the Platform Rule:
        </p>
        <p><strong>{MAILTO}</strong></p>
        <p>For verification of any certification:</p>
        <p><strong>conscience.wiki/verify</strong></p>
      </div>

      <div className="tou-closing">
        <p>Certification means what it says. Every deployment. No exceptions.</p>
        <p className="tou-closing-mark">
          The Universal Primary Directive · CC0 Public Domain · conscience.wiki · primedirective.dev
        </p>
      </div>
    </>
  );

  // conscience.wiki/certification-licence — wiki chrome.
  if (wiki) {
    return (
      <WikiLayout
        title={<>Certification <strong>Licence</strong></>}
        tagline="The agreement for organisations displaying the Certified AI Conscience mark."
      >
        <style>{css}</style>
        {body}
      </WikiLayout>
    );
  }

  // primedirective.dev/certification-licence — register-page chrome.
  return (
    <div className="register-page">
      <style>{css}</style>

      <div className="register-header">
        <a href="/" className="header-home-link"><span>✦</span> primedirective.dev</a>
        <div className="register-header-mark">✦</div>
        <h1>Certification <strong>Licence</strong></h1>
        <p>The agreement for organisations displaying the Certified AI Conscience mark.</p>
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
