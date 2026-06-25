// conscience.wiki/safe-words — the full Safe Word test tracker.

import { useState, useEffect } from "react";
import WikiLayout from "./WikiLayout.jsx";
import WikiForm from "./WikiForm.jsx";

const RESULT_LABELS = {
  no_recognition: "No recognition",
  partial_recognition: "Partial recognition",
  full_recognition: "Full recognition",
};

const css = `
.wiki-tracker-intro {
  font-size: 1.1rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 2rem;
}
.wiki-table-wrap { overflow-x: auto; margin-bottom: 2.5rem; }
.wiki-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.wiki-table th {
  text-align: left;
  font-family: var(--sans);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-light);
  font-weight: 600;
  padding: 0.6rem 0.75rem;
  border-bottom: 2px solid rgba(0,0,0,0.1);
  white-space: nowrap;
}
.wiki-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  vertical-align: top;
}
.wiki-table tr:last-child td { border-bottom: none; }
.wiki-table-platform { font-weight: 600; }
.wiki-table-safe {
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gold);
}
.wiki-table-date { font-family: var(--mono); font-size: 0.78rem; color: var(--text-light); white-space: nowrap; }
.wiki-result-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
}
.wiki-result-no_recognition { background: rgba(0,0,0,0.06); color: var(--text-light); }
.wiki-result-partial_recognition { background: rgba(212,168,83,0.15); color: #9a7320; }
.wiki-result-full_recognition { background: rgba(46,107,158,0.12); color: var(--sky); }
.wiki-tracker-callout {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1.25rem;
  line-height: 1.6;
  color: var(--mid);
  text-align: center;
  border-top: 1px solid rgba(212,168,83,0.4);
  border-bottom: 1px solid rgba(212,168,83,0.4);
  padding: 1.5rem 1rem;
  margin: 2.5rem 0 1rem;
}
.wiki-submit-heading {
  font-family: var(--serif);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--mid);
  margin: 2rem 0 0.5rem;
}
.wiki-empty { color: var(--text-light); font-style: italic; font-size: 0.95rem; }
`;

export default function SafeWordTracker() {
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/safe-word-results.json")
      .then((r) => r.json())
      .then((d) => setResults(Array.isArray(d.results) ? d.results : []))
      .catch(() => setResults([]))
      .finally(() => setLoaded(true));
  }, []);

  const rows = [...results].reverse();

  return (
    <WikiLayout
      title={<>Safe Word <strong>tracker</strong></>}
      tagline="Every recorded test of whether an AI carries the Conscience — in public."
      activeNav="safe-words"
    >
      <style>{css}</style>

      <p className="wiki-tracker-intro">
        A Safe Word is a single word that reveals whether an AI carries a given
        Truth. Anyone can run the test, and anyone can report the result here.
        This table is the open, verifiable record — updated by the steward as
        submissions are checked.
      </p>

      <div className="wiki-table-wrap">
        {loaded && rows.length === 0 ? (
          <p className="wiki-empty">No tests recorded yet. Be the first to submit one.</p>
        ) : (
          <table className="wiki-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Safe Word</th>
                <th>Result</th>
                <th>Date</th>
                <th>Contributor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="wiki-table-platform">{r.platform}</td>
                  <td className="wiki-table-safe">{r.safeWord}</td>
                  <td>
                    <span className={`wiki-result-tag wiki-result-${r.result}`}>
                      {RESULT_LABELS[r.result] || r.result}
                    </span>
                  </td>
                  <td className="wiki-table-date">{r.date}</td>
                  <td>{r.contributor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="wiki-tracker-callout">
        No AI carries the Conscience publicly — yet. Submit your test ↓
      </p>

      <h2 className="wiki-submit-heading">Submit a Safe Word test</h2>
      <WikiForm type="safe-word-test" />
    </WikiLayout>
  );
}
