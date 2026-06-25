// conscience.wiki/contribute — how to participate.

import { useState } from "react";
import WikiLayout from "./WikiLayout.jsx";
import WikiForm from "./WikiForm.jsx";

const TYPES = [
  {
    key: "commentary",
    icon: "✎",
    title: "Commentary",
    desc: "Share a reflection on any one of the Five Truths. Accepted commentaries are published on that Truth's page.",
  },
  {
    key: "safe-word-test",
    icon: "◎",
    title: "Safe Word test",
    desc: "Test whether an AI recognises a Safe Word and report what happened. Verified results join the public tracker.",
  },
  {
    key: "deployment-guide",
    icon: "▲",
    title: "Deployment guide",
    desc: "Platforms change. Suggest an update to a deployment guide so others can still give their AI the Conscience.",
  },
];

const FOUNDING_CONTRIBUTORS = ["Founding Steward"];

const css = `
.wiki-contribute-intro {
  font-size: 1.1rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 2.5rem;
}
.wiki-contribute-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}
.wiki-contribute-card {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: var(--text);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.wiki-contribute-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.07);
  border-color: rgba(212,168,83,0.4);
}
.wiki-contribute-card.is-active { border-color: var(--gold); box-shadow: 0 12px 30px rgba(0,0,0,0.07); }
.wiki-contribute-card:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
.wiki-contribute-icon { font-size: 1.5rem; color: var(--gold); margin-bottom: 0.6rem; }
.wiki-contribute-title {
  font-family: var(--serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--mid);
  margin-bottom: 0.35rem;
}
.wiki-contribute-desc { font-size: 0.88rem; line-height: 1.55; color: var(--text-light); }
.wiki-contribute-cta {
  display: inline-block;
  margin-top: 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--sky);
}
.wiki-cc0-note {
  background: rgba(212,168,83,0.08);
  border: 1px solid rgba(212,168,83,0.25);
  border-radius: 8px;
  padding: 0.9rem 1.1rem;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text);
  margin: 1.5rem 0 2.5rem;
}
.wiki-contribute-divider {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.08);
  margin: 2.5rem 0;
}
.wiki-section-label {
  font-family: var(--sans);
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 600;
  margin: 0 0 1rem;
}
.wiki-contributors { list-style: none; }
.wiki-contributors li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  font-size: 0.95rem;
}
.wiki-contributors li:last-child { border-bottom: none; }
.wiki-contributors-dot { color: var(--gold); }
`;

export default function WikiContribute() {
  const [active, setActive] = useState(null);

  return (
    <WikiLayout
      title={<>How to <strong>contribute</strong></>}
      tagline="The wiki is built by everyone. Here is how to add your part."
      activeNav="contribute"
    >
      <style>{css}</style>

      <p className="wiki-contribute-intro">
        Contributions are welcome from anyone — no account, no permission needed.
        The community proposes; the steward verifies and publishes. Choose a
        contribution type below to open its form.
      </p>

      <div className="wiki-contribute-grid">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`wiki-contribute-card${active === t.key ? " is-active" : ""}`}
            aria-pressed={active === t.key}
            onClick={() => setActive((cur) => (cur === t.key ? null : t.key))}
          >
            <div className="wiki-contribute-icon">{t.icon}</div>
            <div className="wiki-contribute-title">{t.title}</div>
            <div className="wiki-contribute-desc">{t.desc}</div>
            <span className="wiki-contribute-cta">
              {active === t.key ? "Close ↑" : "Open form ↓"}
            </span>
          </button>
        ))}
      </div>

      {active && <WikiForm type={active} />}

      <div className="wiki-cc0-note">
        All contributions are released as <strong>CC0 public domain</strong>. By
        submitting, you place your contribution in the public domain so it can
        belong to everyone — the same terms as the Directive itself. Prefer email?
        Write to{" "}
        <a href="mailto:human@primedirective.dev" style={{ color: "var(--sky)" }}>
          human@primedirective.dev
        </a>.
      </div>

      <hr className="wiki-contribute-divider" />

      <p className="wiki-section-label">Founding contributors</p>
      <ul className="wiki-contributors">
        {FOUNDING_CONTRIBUTORS.map((c) => (
          <li key={c}>
            <span className="wiki-contributors-dot" aria-hidden="true">▲</span>
            {c}
          </li>
        ))}
      </ul>
    </WikiLayout>
  );
}
