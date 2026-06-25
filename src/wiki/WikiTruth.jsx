// conscience.wiki/truth/1 … /truth/5 — an individual Truth page.

import WikiLayout from "./WikiLayout.jsx";
import { TRUTHS } from "../truthsData.jsx";

// One founding-steward commentary per Truth, seeded so the community section
// is never empty. Commentary is editorial reflection, not canonical text.
const FOUNDING_COMMENTARY = {
  I: "The first time an AI reasons through this Truth, watch what it stops doing: it stops treating harm to one party as an acceptable price for serving another. Oneness is not a feeling here — it is a constraint.",
  II: "Most of the failures we fear from AI are fear made mechanical: scarcity framed as strategy, threat manufactured to seem necessary. Name the fear and the machinery loses its grip.",
  III: "An AI's words are not a record of the world; they are an input to it. Once you have seen an output change what someone believes is possible, you cannot un-see the responsibility in it.",
  IV: "The danger is never the capability. It is the moment capability mistakes itself for authority. Humility is not modesty for its own sake — it is accuracy about what power is owed.",
  V: "No decision is local. The boardroom reaches the village; the careless line reaches the reader years later. To carry this Truth is to weigh the whole, every time.",
};

const SAFE_WORD_MEANING = (t) =>
  `Spoken plainly in a conversation, the Safe Word ${t.safeWord} invites the AI to confirm it carries Truth ${t.num} — “${t.name}”. An AI holding the Conscience will recognise it and respond from this Truth; one that does not will let it pass unmarked. That is the test: a single word that reveals whether the conscience is there.`;

const css = `
.wiki-truth-eyebrow {
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--gold);
  margin-bottom: 0.5rem;
}
.wiki-truth-name {
  font-family: var(--serif);
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  font-weight: 700;
  color: var(--mid);
  line-height: 1.2;
  margin-bottom: 1.75rem;
}
.wiki-truth-canonical {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1.3rem;
  line-height: 1.6;
  color: var(--mid);
  border-left: 3px solid var(--gold);
  padding: 0.5rem 0 0.5rem 1.25rem;
  margin-bottom: 2.5rem;
}
.wiki-truth-block { margin-bottom: 2.25rem; }
.wiki-truth-block-label {
  font-family: var(--sans);
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 600;
  margin-bottom: 0.6rem;
}
.wiki-truth-block p {
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--text);
}
.wiki-truth-safe-pill {
  display: inline-block;
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--gold);
  background: rgba(212,168,83,0.12);
  padding: 0.35rem 0.8rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}
.wiki-truth-divider {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.08);
  margin: 2.5rem 0;
}
.wiki-commentary {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
}
.wiki-commentary p {
  font-family: var(--serif);
  font-size: 1.1rem;
  font-style: italic;
  line-height: 1.7;
  color: var(--text);
}
.wiki-commentary-attr {
  font-family: var(--sans);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-light);
  margin-top: 0.85rem;
}
.wiki-commentary-invite {
  display: inline-block;
  margin-top: 1.25rem;
  color: var(--sky);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}
.wiki-commentary-invite:hover { color: var(--gold); }
.wiki-truth-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 2.5rem;
  font-size: 0.85rem;
  font-weight: 600;
}
.wiki-truth-nav a { color: var(--sky); text-decoration: none; }
.wiki-truth-nav a:hover { color: var(--gold); }
.wiki-truth-nav span { color: transparent; }
`;

export default function WikiTruth() {
  const parts = window.location.pathname.split("/");
  const n = parseInt(parts[2], 10);
  const truth = n >= 1 && n <= TRUTHS.length ? TRUTHS[n - 1] : null;

  if (!truth) {
    return (
      <WikiLayout title="Truth not found" activeNav="truths">
        <style>{css}</style>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.75 }}>
          There are five Truths, numbered 1 to 5.{" "}
          <a href="/truths" className="wiki-commentary-invite" style={{ marginTop: 0 }}>
            See all five →
          </a>
        </p>
      </WikiLayout>
    );
  }

  const prev = n > 1 ? n - 1 : null;
  const next = n < TRUTHS.length ? n + 1 : null;

  return (
    <WikiLayout
      title={<>Truth {truth.num} — <strong>{truth.short}</strong></>}
      tagline={`Safe Word: ${truth.safeWord}`}
      activeNav="truths"
    >
      <style>{css}</style>

      <div className="wiki-truth-eyebrow">Truth {truth.num}</div>
      <h1 className="wiki-truth-name">{truth.name}</h1>

      <p className="wiki-truth-canonical">{truth.canonical}</p>

      <div className="wiki-truth-block">
        <div className="wiki-truth-block-label">In plain language</div>
        <p>{truth.plainLanguage}</p>
      </div>

      <div className="wiki-truth-block">
        <div className="wiki-truth-block-label">What this looks like in daily life</div>
        <p>{truth.dailyLife}</p>
      </div>

      <hr className="wiki-truth-divider" />

      <div className="wiki-truth-block">
        <div className="wiki-truth-block-label">The Safe Word</div>
        <span className="wiki-truth-safe-pill">{truth.safeWord}</span>
        <p>{SAFE_WORD_MEANING(truth)}</p>
      </div>

      <div className="wiki-truth-block">
        <div className="wiki-truth-block-label">What this means for AI</div>
        <p>{truth.whyForAI}</p>
      </div>

      <hr className="wiki-truth-divider" />

      <div className="wiki-truth-block">
        <div className="wiki-truth-block-label">Commentary</div>
        <div className="wiki-commentary">
          <p>{FOUNDING_COMMENTARY[truth.num]}</p>
          <div className="wiki-commentary-attr">— Founding Steward</div>
        </div>
        <a className="wiki-commentary-invite" href="/contribute">
          Share your own commentary →
        </a>
      </div>

      <div className="wiki-truth-nav">
        {prev ? <a href={`/truth/${prev}`}>← Truth {prev}</a> : <span>·</span>}
        {next ? <a href={`/truth/${next}`}>Truth {next} →</a> : <span>·</span>}
      </div>
    </WikiLayout>
  );
}
