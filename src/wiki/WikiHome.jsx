// conscience.wiki/ — the community landing page.

import { useState, useEffect } from "react";
import WikiLayout from "./WikiLayout.jsx";
import { TRUTHS } from "../truthsData.jsx";

const ENTRY_PATHS = [
  { icon: "❖", title: "Learn", desc: "Read the Five Truths in plain language, one page each.", href: "/truths" },
  { icon: "▲", title: "Deploy", desc: "Give the AI you use a conscience it can carry and you can test.", href: "/deploy" },
  { icon: "✶", title: "Contribute", desc: "Add commentary, report a Safe Word test, improve a guide.", href: "/contribute" },
];

const RESULT_LABELS = {
  no_recognition: "No recognition",
  partial_recognition: "Partial recognition",
  full_recognition: "Full recognition",
};

const css = `
.wiki-home-intro {
  font-size: 1.1rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 2.5rem;
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

.wiki-entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 3rem;
}
.wiki-entry-card {
  display: block;
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  color: var(--text);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.wiki-entry-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.07);
  border-color: rgba(212,168,83,0.4);
}
.wiki-entry-icon { font-size: 1.6rem; color: var(--gold); margin-bottom: 0.6rem; }
.wiki-entry-title {
  font-family: var(--serif);
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--mid);
  margin-bottom: 0.35rem;
}
.wiki-entry-desc { font-size: 0.9rem; line-height: 1.55; color: var(--text-light); }

.wiki-truth-rows { margin-bottom: 3rem; }
.wiki-truth-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 0.75rem;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  text-decoration: none;
  color: var(--text);
  border-radius: 6px;
  transition: background 0.15s;
}
.wiki-truth-row:hover { background: rgba(212,168,83,0.06); }
.wiki-truth-row-num {
  font-family: var(--mono);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gold);
  min-width: 2rem;
}
.wiki-truth-row-name { flex: 1; font-weight: 500; }
.wiki-truth-row-safe {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--gold);
  background: rgba(212,168,83,0.12);
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
}
.wiki-truth-row-chevron { color: var(--text-light); font-size: 1.1rem; }

.wiki-tracker-preview {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 3rem;
}
.wiki-tracker-item {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  font-size: 0.9rem;
}
.wiki-tracker-item:last-of-type { border-bottom: none; }
.wiki-tracker-platform { font-weight: 600; min-width: 6rem; }
.wiki-tracker-safe { font-family: var(--mono); font-size: 0.75rem; color: var(--gold); }
.wiki-tracker-result { color: var(--text-light); flex: 1; }
.wiki-tracker-date { font-family: var(--mono); font-size: 0.75rem; color: var(--text-light); }
.wiki-inline-link {
  display: inline-block;
  margin-top: 0.75rem;
  color: var(--sky);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
}
.wiki-inline-link:hover { color: var(--gold); }

.wiki-activity { list-style: none; }
.wiki-activity-item {
  display: flex;
  gap: 0.85rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  font-size: 0.9rem;
  line-height: 1.5;
}
.wiki-activity-item:last-child { border-bottom: none; }
.wiki-activity-dot { color: var(--gold); }
.wiki-activity-meta { color: var(--text-light); font-size: 0.8rem; }
.wiki-empty { color: var(--text-light); font-size: 0.9rem; font-style: italic; }
`;

export default function WikiHome() {
  const [results, setResults] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    fetch("/api/safe-word-results.json")
      .then((r) => r.json())
      .then((d) => setResults(Array.isArray(d.results) ? d.results : []))
      .catch(() => setResults([]));
    fetch("/api/wiki-activity.json")
      .then((r) => r.json())
      .then((d) => setActivity(Array.isArray(d.activity) ? d.activity : []))
      .catch(() => setActivity([]));
  }, []);

  const latestResults = results.slice(-3).reverse();
  const latestActivity = activity.slice(-5).reverse();

  return (
    <WikiLayout
      title={<>A community knowledge base for <strong>AI conscience</strong></>}
      tagline="The Five Universal Truths, the Safe Words that test them, and the people putting them to work."
    >
      <style>{css}</style>

      <p className="wiki-home-intro">
        conscience.wiki is the open, practical companion to the Universal Primary
        Directive. Learn the Truths, deploy the Conscience to the AI you use, test
        it with a Safe Word, and share what you find. Everything here is public
        domain and built by everyone.
      </p>

      {/* Entry paths */}
      <div className="wiki-entry-grid">
        {ENTRY_PATHS.map((p) => (
          <a key={p.title} className="wiki-entry-card" href={p.href}>
            <div className="wiki-entry-icon">{p.icon}</div>
            <div className="wiki-entry-title">{p.title}</div>
            <div className="wiki-entry-desc">{p.desc}</div>
          </a>
        ))}
      </div>

      {/* Five Truths */}
      <p className="wiki-section-label">The Five Truths</p>
      <div className="wiki-truth-rows">
        {TRUTHS.map((t, i) => (
          <a key={t.num} className="wiki-truth-row" href={`/truth/${i + 1}`}>
            <span className="wiki-truth-row-num">{t.num}</span>
            <span className="wiki-truth-row-name">{t.name}</span>
            <span className="wiki-truth-row-safe">{t.safeWord}</span>
            <span className="wiki-truth-row-chevron" aria-hidden="true">›</span>
          </a>
        ))}
      </div>

      {/* Safe Word tracker preview */}
      <p className="wiki-section-label">Safe Word tracker</p>
      <div className="wiki-tracker-preview">
        {latestResults.length === 0 ? (
          <p className="wiki-empty">No tests recorded yet.</p>
        ) : (
          latestResults.map((r, i) => (
            <div className="wiki-tracker-item" key={i}>
              <span className="wiki-tracker-platform">{r.platform}</span>
              <span className="wiki-tracker-safe">{r.safeWord}</span>
              <span className="wiki-tracker-result">
                {RESULT_LABELS[r.result] || r.result}
              </span>
              <span className="wiki-tracker-date">{r.date}</span>
            </div>
          ))
        )}
        <a className="wiki-inline-link" href="/safe-words">View all →</a>
      </div>

      {/* Recent activity */}
      <p className="wiki-section-label">Recent activity</p>
      {latestActivity.length === 0 ? (
        <p className="wiki-empty">No activity yet.</p>
      ) : (
        <ul className="wiki-activity">
          {latestActivity.map((a, i) => (
            <li className="wiki-activity-item" key={i}>
              <span className="wiki-activity-dot" aria-hidden="true">▲</span>
              <span>
                {a.description}
                <span className="wiki-activity-meta">
                  {" "}— {a.contributor}, {a.date}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </WikiLayout>
  );
}
