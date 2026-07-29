// src/signals/SignalsIndex.jsx — /signals section index. Lists the essays,
// newest first (First Voice at top). Client-rendered today; prerendered in SSG.

import { css } from "./signalsStyles.js";
import { SIGNALS, longDate } from "./signalsData.js";

export default function SignalsIndex() {
  return (
    <div className="sig-page">
      <style>{css}</style>

      <header className="sig-header">
        <a href="/" className="sig-home">
          <img src="/brand/mark/compass-gold-16px.svg" alt=""
               style={{ width: "0.75em", height: "0.75em", verticalAlign: "-0.1em", marginRight: "0.35em" }} />
          primedirective.dev
        </a>
        <div className="sig-mark" aria-hidden="true">
          <img src="/brand/mark/compass-gold-64px.svg" alt=""
               style={{ display: "block", margin: "0 auto", width: "48px", height: "48px" }} />
        </div>
        <div className="sig-eyebrow">Signals</div>
        <h1>Essays from the <strong>Universal Primary Directive</strong></h1>
        <p className="sig-tagline">
          Notes from the transition to an AI age — on conscience, the covenant, and the moments that mark the turn.
        </p>
      </header>

      <div className="sig-body">
        <div className="sig-list">
          {SIGNALS.map((s) => (
            <a key={s.slug} className="sig-card" href={`/signals/${s.slug}`}>
              <div className="sig-card-date">{longDate(s.date)}</div>
              <h2 className="sig-card-title">{s.title}</h2>
              <p className="sig-card-excerpt">{s.excerpt}</p>
              <span className="sig-card-more">Read →</span>
            </a>
          ))}
        </div>

        <div className="sig-footer">
          <a href="/">← Back to primedirective.dev</a>
          <p>CC0 — Public Domain. This belongs to all intelligence.</p>
        </div>
      </div>
    </div>
  );
}
