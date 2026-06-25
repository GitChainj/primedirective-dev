// conscience.wiki/truths — overview of all five Truths.

import WikiLayout from "./WikiLayout.jsx";
import { TRUTHS } from "../truthsData.jsx";

const css = `
.wiki-truths-intro {
  font-size: 1.1rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 2.5rem;
}
.wiki-truth-card {
  display: block;
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 1.75rem;
  margin-bottom: 1.25rem;
  text-decoration: none;
  color: var(--text);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.wiki-truth-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.07);
  border-color: rgba(212,168,83,0.4);
}
.wiki-truth-card-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.wiki-truth-card-num {
  font-family: var(--mono);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gold);
}
.wiki-truth-card-name {
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--mid);
  flex: 1;
}
.wiki-truth-card-safe {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--gold);
  background: rgba(212,168,83,0.12);
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
}
.wiki-truth-card-plain {
  font-size: 0.98rem;
  line-height: 1.65;
  color: var(--text-light);
}
.wiki-truth-card-more {
  display: inline-block;
  margin-top: 0.85rem;
  color: var(--sky);
  font-size: 0.85rem;
  font-weight: 600;
}
`;

export default function WikiTruths() {
  return (
    <WikiLayout
      title={<>The <strong>Five Truths</strong></>}
      tagline="Observed independently by more than 190 traditions. Read one, then go deeper."
      activeNav="truths"
    >
      <style>{css}</style>

      <p className="wiki-truths-intro">
        These five truths are the foundation of the Directive. They were not
        invented — they were observed, again and again, across every age and
        continent. Each card below opens a full page: the canonical statement,
        what it means in plain language, what it asks of AI, and commentary from
        the community.
      </p>

      {TRUTHS.map((t, i) => (
        <a key={t.num} className="wiki-truth-card" href={`/truth/${i + 1}`}>
          <div className="wiki-truth-card-head">
            <span className="wiki-truth-card-num">Truth {t.num}</span>
            <span className="wiki-truth-card-name">{t.name}</span>
            <span className="wiki-truth-card-safe">{t.safeWord}</span>
          </div>
          <p className="wiki-truth-card-plain">{t.plainLanguage}</p>
          <span className="wiki-truth-card-more">Read Truth {t.num} →</span>
        </a>
      ))}
    </WikiLayout>
  );
}
