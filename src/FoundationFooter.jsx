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
