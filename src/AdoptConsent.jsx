// Consent disclosure shown at the point of adoption, before submission.
//
// This is disclosure plus affirmative consent — it collects no new personal data.
// The four facts it names (name or pseudonym, date, reference, hash) are exactly
// what the public ledger already records, and the checkbox starts unticked so
// proceeding is an act rather than a default.
//
// ── The words are not here ──
// The disclosure text lives in src/consent/disclosure.js and is published for
// machines at the URL that module names. This component RENDERS that source and
// holds no copy of its own, so the human form and the machine artefact cannot
// drift apart. To change the wording, bump the version there — never edit text
// in this file.

import { DISCLOSURE, DISCLOSURE_VERSION, DISCLOSURE_URL } from "./consent/disclosure.js";

export { DISCLOSURE_VERSION, DISCLOSURE_URL };

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

// One segmented paragraph → JSX. Mirrors partsToText() in the canonical source:
// the same parts, rendered with emphasis and links instead of flattened.
function Parts({ parts }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.b !== undefined) return <strong key={i}>{p.b}</strong>;
        if (p.a !== undefined) return <a key={i} href={p.href}>{p.a}</a>;
        return <span key={i}>{p.t}</span>;
      })}
    </>
  );
}

export default function AdoptConsent({ checked, onChange }) {
  return (
    <div className="adopt-consent">
      <style>{css}</style>
      <h3>{DISCLOSURE.heading}</h3>
      <p>{DISCLOSURE.recordsIntro}</p>
      <ul>
        {DISCLOSURE.records.map((parts, i) => (
          <li key={i}><Parts parts={parts} /></li>
        ))}
      </ul>
      {DISCLOSURE.paragraphs.map((parts, i) => (
        <p key={i}><Parts parts={parts} /></p>
      ))}
      <label className="adopt-consent-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{DISCLOSURE.consentStatement}</span>
      </label>
    </div>
  );
}
