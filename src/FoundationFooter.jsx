// Shared footer identity for both hostnames.
//
// One source for the Foundation's contact line and the five social destinations,
// used by the primedirective.dev footer, the conscience.wiki layout footer, and
// the Conscience Portal footer — so a channel added or a mailbox changed is a
// one-line edit rather than three.
//
// Email and jurisdiction only: no phone number, no street address, no map.
// "(in formation)" is stated here because it is true until the CNCA filing
// completes; it deliberately does NOT appear in the JSON-LD entity name.

// ── Licensing ──
//
// ONE definition, imported everywhere. This line previously existed as ~20
// copy-pasted strings, so a licence change meant a twenty-file sweep and a
// guarantee that one of them would be missed. It is a constant now.
//
// The texts are CC BY 4.0 and the software is Apache 2.0. Neither is public
// domain, so no copy here may say "public domain", "no rights reserved" or
// "no one owns this" — under CC BY the Foundation holds copyright and licenses
// it on terms, and attribution is a condition rather than a courtesy.
//
// "This belongs to all intelligence" is the covenant's voice and still appears
// elsewhere on the site. It is deliberately NOT part of the licence line, where
// it would read as a grant of terms that have not been granted.
export const LICENCE_LINE =
  "Free to use, share, and adapt — with attribution. Texts CC BY 4.0 · Software Apache 2.0";

// The short form, for dense footers and closing marks.
export const LICENCE_SHORT = "Texts CC BY 4.0 · Software Apache 2.0";

// The canonical attribution string. A reuser who copies this satisfies CC BY's
// attribution condition; anything shorter risks not doing so.
export const ATTRIBUTION =
  "Universal Primary Directive Foundation — primedirective.dev — CC BY 4.0 (creativecommons.org/licenses/by/4.0/)";

export const TEXT_LICENCE = "CC BY 4.0";
export const TEXT_LICENCE_URL = "https://creativecommons.org/licenses/by/4.0/";
export const SOFTWARE_LICENCE = "Apache License 2.0";

export const FOUNDATION_NAME = "Universal Primary Directive Foundation";
export const FOUNDATION_STATUS = "in formation";
export const FOUNDATION_JURISDICTION = "Ontario, Canada";
export const GENERAL_EMAIL = "human@primedirective.dev";
export const PRIVACY_EMAIL = "privacy@primedirective.dev";

export const SOCIAL_LINKS = [
  ["GitHub", "https://github.com/GitChainj"],
  ["YouTube", "https://www.youtube.com/@UniversalPrimeDirective"],
  ["TikTok", "https://www.tiktok.com/@ai.conscience"],
  ["X", "https://x.com/primedirective_"],
  ["LinkedIn", "https://www.linkedin.com/in/primedirective"],
];

export function FoundationContact({ className }) {
  return (
    <p className={className} style={{ marginTop: "1rem" }}>
      {FOUNDATION_NAME} ({FOUNDATION_STATUS}) · {FOUNDATION_JURISDICTION} ·{" "}
      <a href={`mailto:${GENERAL_EMAIL}`}>{GENERAL_EMAIL}</a>
      <br />
      Privacy and data-subject requests:{" "}
      <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
    </p>
  );
}

export function SocialLinks({ className }) {
  return (
    <p className={className} style={{ marginTop: "1rem" }}>
      {SOCIAL_LINKS.map(([label, href], i) => (
        <span key={label}>
          {i > 0 && " · "}
          <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
        </span>
      ))}
    </p>
  );
}
