// conscience.wiki/contributors — recognition for accepted contributions.

import { useState, useEffect } from "react";
import WikiLayout from "./WikiLayout.jsx";

const css = `
.wiki-contributors-intro {
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
.wiki-contrib-list { list-style: none; margin-bottom: 2.5rem; }
.wiki-contrib-row {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
  padding: 0.9rem 0.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.wiki-contrib-row:last-child { border-bottom: none; }
.wiki-contrib-mark { color: var(--gold); font-size: 0.8rem; }
.wiki-contrib-name { font-weight: 600; font-size: 1.02rem; }
.wiki-contrib-role {
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  color: var(--gold);
  background: rgba(212,168,83,0.12);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
.wiki-contrib-meta {
  margin-left: auto;
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-light);
  line-height: 1.4;
  white-space: nowrap;
}
.wiki-contrib-empty {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  font-size: 0.98rem;
  line-height: 1.65;
  color: var(--text-light);
}
.wiki-contrib-empty a { color: var(--sky); text-decoration: none; font-weight: 600; }
.wiki-contrib-empty a:hover { color: var(--gold); }
`;

function ContributorRow({ c }) {
  const plural = c.contributions === 1 ? "contribution" : "contributions";
  return (
    <li className="wiki-contrib-row">
      <span className="wiki-contrib-mark" aria-hidden="true">▲</span>
      <span className="wiki-contrib-name">{c.name}</span>
      {c.role && <span className="wiki-contrib-role">{c.role}</span>}
      <span className="wiki-contrib-meta">
        {c.contributions} {plural}
        {c.firstContribution ? <> · since {c.firstContribution}</> : null}
      </span>
    </li>
  );
}

export default function WikiContributors() {
  const [contributors, setContributors] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/wiki-contributors.json")
      .then((r) => r.json())
      .then((d) => setContributors(Array.isArray(d.contributors) ? d.contributors : []))
      .catch(() => setContributors([]))
      .finally(() => setLoaded(true));
  }, []);

  const founding = contributors.filter((c) => c.founding);
  const community = contributors.filter((c) => !c.founding);

  return (
    <WikiLayout
      title={<>The <strong>contributors</strong></>}
      tagline="Everyone whose accepted contribution helped build this wiki."
      activeNav="contribute"
    >
      <style>{css}</style>

      <p className="wiki-contributors-intro">
        The wiki belongs to no one and is built by everyone. This page records
        every person whose contribution has been reviewed, verified, and published.
        There are no accounts and no rankings — only recognition.
      </p>

      <p className="wiki-section-label">Founding contributors</p>
      {founding.length === 0 ? (
        <p className="wiki-contrib-empty">To be recorded.</p>
      ) : (
        <ul className="wiki-contrib-list">
          {founding.map((c, i) => <ContributorRow key={i} c={c} />)}
        </ul>
      )}

      <p className="wiki-section-label">Community contributors</p>
      {community.length === 0 ? (
        <div className="wiki-contrib-empty">
          {loaded
            ? <>The first community contributions are being reviewed. Your name could be here — visit <a href="/contribute">conscience.wiki/contribute</a>.</>
            : "Loading…"}
        </div>
      ) : (
        <ul className="wiki-contrib-list">
          {community.map((c, i) => <ContributorRow key={i} c={c} />)}
        </ul>
      )}
    </WikiLayout>
  );
}
