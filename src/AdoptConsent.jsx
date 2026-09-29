// Consent disclosure shown at the point of adoption, before submission.
//
// This is disclosure plus affirmative consent — it collects no new personal data.
// The four facts it names (name or pseudonym, date, reference, hash) are exactly
// what the public ledger already records, and the checkbox starts unticked so
// proceeding is an act rather than a default.
//
// DISCLOSURE_VERSION is recorded with each consent so we can always say which
// words a given adopter actually agreed to. Bump it whenever the text below
// changes in substance — never silently.

export const DISCLOSURE_VERSION = "consent-disclosure-1.0";

// Derived from the chosen path, not collected as a new field: the site does not
// yet ask adopters to declare an identity class, and asking would be new
// collection. A person who wishes to be pseudonymous simply gives the name they
// want on the ledger, which is why "public_name" is the honest default here.
export function identityClassFor(path) {
  return path === "organisation" ? "organizational" : "public_name";
}

const css = `
.adopt-consent {
  margin: 2rem 0 1.25rem;
  padding: 1.5rem 1.6rem;
  background: rgba(46,107,158,0.06);
  border: 1px solid rgba(46,107,158,0.28);
  border-left: 3px solid var(--sky, #2e6b9e);
  border-radius: 10px;
  text-align: left;
}
.adopt-consent h3 {
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mid, #1b3a5c);
  margin-bottom: 0.75rem;
}
.adopt-consent p {
  font-size: 0.95rem;
  line-height: 1.65;
  margin-bottom: 0.75rem;
}
.adopt-consent ul { margin: 0 0 0.75rem 1.1rem; }
.adopt-consent li { font-size: 0.95rem; line-height: 1.6; margin-bottom: 0.3rem; }
.adopt-consent strong { font-weight: 700; }
.adopt-consent a { color: var(--sky, #2e6b9e); font-weight: 600; }
.adopt-consent-check {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0,0,0,0.08);
  font-size: 1rem;
  line-height: 1.55;
  cursor: pointer;
}
.adopt-consent-check input[type="checkbox"] {
  flex: 0 0 auto;
  width: 1.15rem;
  height: 1.15rem;
  margin-top: 0.15rem;
  cursor: pointer;
}
`;

export default function AdoptConsent({ checked, onChange }) {
  return (
    <div className="adopt-consent">
      <style>{css}</style>
      <h3>Before you adopt — what this records</h3>
      <p>Your adoption creates a public record containing:</p>
      <ul>
        <li>the <strong>name or pseudonym</strong> you give us;</li>
        <li>the <strong>date</strong> of adoption;</li>
        <li>a public <strong>reference number</strong> (for example UPD-2026-0001);</li>
        <li>a <strong>cryptographic hash</strong> of those facts, so anyone can verify them.</li>
      </ul>
      <p>
        That record is <strong>permanent and public</strong>. It is the point of the ledger:
        anyone can check that your adoption is real and has not been altered. Because the
        record is cryptographically signed, copies may be held by others, and we cannot
        recall them — so please read{" "}
        <a href="/privacy">what erasure means here</a> before you continue.
      </p>
      <p>
        <strong>You may adopt under a pseudonym.</strong> Give the name you wish to appear on
        the ledger; it does not have to be your legal name. If we hold any link between a
        pseudonym and a real identity, we keep it privately and never publish it.
      </p>
      <p>
        Full detail is in our <a href="/privacy">Privacy Notice</a>. For access, correction,
        erasure, or to withdraw consent:{" "}
        <a href="mailto:privacy@primedirective.dev">privacy@primedirective.dev</a>.
      </p>
      <label className="adopt-consent-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          I have read the above. I consent to my adoption being recorded permanently and
          publicly on the ledger as described.
        </span>
      </label>
    </div>
  );
}
