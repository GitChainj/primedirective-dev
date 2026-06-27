// conscience.wiki/guidelines — what makes a good contribution.

import WikiLayout from "./WikiLayout.jsx";

const css = `
.wiki-guidelines-intro {
  font-size: 1.1rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 2.5rem;
}
.wiki-guide-section { margin-bottom: 2.5rem; }
.wiki-guide-section-title {
  font-family: var(--serif);
  font-size: clamp(1.4rem, 3vw, 1.8rem);
  font-weight: 600;
  color: var(--mid);
  line-height: 1.25;
  margin-bottom: 1rem;
}
.wiki-guide-list { list-style: none; }
.wiki-guide-list li {
  position: relative;
  padding: 0.5rem 0 0.5rem 1.6rem;
  font-size: 1.02rem;
  line-height: 1.65;
  color: var(--text);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.wiki-guide-list li:last-child { border-bottom: none; }
.wiki-guide-list li::before {
  content: "▲";
  position: absolute;
  left: 0;
  top: 0.55rem;
  font-size: 0.7rem;
  color: var(--gold);
}
.wiki-guide-list.no-accept li::before { content: "✕"; color: var(--text-light); }
.wiki-guide-divider {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.08);
  margin: 2.5rem 0;
}
.wiki-guide-cta {
  display: inline-block;
  margin-top: 0.5rem;
  color: var(--sky);
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
}
.wiki-guide-cta:hover { color: var(--gold); }
`;

export default function WikiGuidelines() {
  return (
    <WikiLayout
      title={<>Contribution <strong>guidelines</strong></>}
      tagline="What makes a contribution genuinely useful — and what we don't accept."
      activeNav="contribute"
    >
      <style>{css}</style>

      <p className="wiki-guidelines-intro">
        The wiki is built by everyone, which only works if contributions are
        honest, human, and in service of the Truths. These guidelines explain what
        makes each kind of contribution worth publishing. None of this is gatekeeping
        — it's how we keep the wiki trustworthy for the next person who reads it.
      </p>

      <div className="wiki-guide-section">
        <h2 className="wiki-guide-section-title">What makes a good commentary</h2>
        <ul className="wiki-guide-list">
          <li>Reflects genuinely on one of the Five Truths.</li>
          <li>Draws from personal experience, professional expertise, or a specific tradition's perspective.</li>
          <li>Written in the contributor's own words — not AI-generated.</li>
          <li>At least 100 words, and no more than 500.</li>
          <li>Doesn't contradict the Truths themselves. Commentaries explore and apply the Truths; they don't argue against them — the amendment process exists for that.</li>
        </ul>
      </div>

      <div className="wiki-guide-section">
        <h2 className="wiki-guide-section-title">What makes a useful Safe Word test</h2>
        <ul className="wiki-guide-list">
          <li>Names the specific platform and the version or date tested.</li>
          <li>Names the Safe Word used.</li>
          <li>Describes what happened — the AI's exact response, or its lack of response.</li>
          <li>Notes whether the Conscience was deployed: testing platform defaults, or testing after individual deployment.</li>
          <li>Honest results only. "No recognition" is valuable data, not a failure.</li>
        </ul>
      </div>

      <div className="wiki-guide-section">
        <h2 className="wiki-guide-section-title">What makes a helpful deployment guide update</h2>
        <ul className="wiki-guide-list">
          <li>Names the platform and what changed.</li>
          <li>Gives the new step-by-step instructions.</li>
          <li>Tested and confirmed working before submission.</li>
        </ul>
      </div>

      <hr className="wiki-guide-divider" />

      <div className="wiki-guide-section">
        <h2 className="wiki-guide-section-title">What we don't accept</h2>
        <ul className="wiki-guide-list no-accept">
          <li>Commercial promotion or product placement.</li>
          <li>Content that contradicts the Five Truths — use <a className="wiki-guide-cta" style={{ display: "inline" }} href="https://primedirective.dev/propose-amendment">propose-amendment</a> for that.</li>
          <li>AI-generated commentaries. The wiki is for human voices.</li>
          <li>Content that names or attacks specific companies. The UPD names gaps, not villains.</li>
          <li>Duplicate submissions.</li>
        </ul>
      </div>

      <div className="wiki-guide-section">
        <h2 className="wiki-guide-section-title">The review process</h2>
        <ul className="wiki-guide-list">
          <li>Every submission creates a GitHub Issue, visible to everyone.</li>
          <li>The steward reviews each submission within 48 hours.</li>
          <li>Accepted contributions are published with the contributor's chosen name.</li>
          <li>Declined contributions receive a brief explanation.</li>
          <li>All contributions are CC0 public domain.</li>
        </ul>
      </div>

      <hr className="wiki-guide-divider" />

      <a className="wiki-guide-cta" href="/contribute">Ready? Make a contribution →</a>
    </WikiLayout>
  );
}
