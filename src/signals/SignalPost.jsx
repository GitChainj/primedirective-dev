// src/signals/SignalPost.jsx — a single Signals essay by slug. Renders the
// title, UTC date, body, and canonical URL. Unknown slugs are handled by the
// router (falls back to SignalsIndex), so this assumes a valid slug; it degrades
// gracefully to the index link if a slug is somehow missing.

import { css } from "./signalsStyles.js";
import { getSignal, longDate } from "./signalsData.js";

const SITE = "https://www.primedirective.dev";

export default function SignalPost({ slug }) {
  const post = getSignal(slug);

  if (!post) {
    return (
      <div className="sig-page">
        <style>{css}</style>
        <header className="sig-header">
          <a href="/" className="sig-home">
            <img src="/brand/mark/compass-gold-16px.svg" alt=""
                 style={{ width: "0.75em", height: "0.75em", verticalAlign: "-0.1em", marginRight: "0.35em" }} />
            primedirective.dev
          </a>
          <div className="sig-eyebrow">Signals</div>
          <h1>Essay not found</h1>
          <p className="sig-tagline">That essay doesn’t exist yet.</p>
        </header>
        <div className="sig-body">
          <div className="sig-footer"><a href="/signals">← All Signals</a></div>
        </div>
      </div>
    );
  }

  const canonical = `${SITE}/signals/${post.slug}`;

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
        <h1>{post.title}</h1>
        <div className="sig-date">{longDate(post.date)} · UTC</div>
      </header>

      <div className="sig-body">
        <article className="sig-post">
          {post.body.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <div className="sig-canonical">
            Canonical: <a href={canonical}>{canonical}</a>
          </div>
        </article>

        <div className="sig-footer">
          <a href="/signals">← All Signals</a>
          <p>CC0 — Public Domain. This belongs to all intelligence.</p>
        </div>
      </div>
    </div>
  );
}
