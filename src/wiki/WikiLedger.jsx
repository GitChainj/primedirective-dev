// conscience.wiki/ledger — the public register, browsable.
//
// Every adoption, with its hash recomputed in your browser rather than taken on
// the page's word. A row says only what has actually been computed or is actually
// recorded: a record whose hash verifies says so, a record carrying an identity
// key says so, and a record carrying neither a key nor a gradient says that too.
// Nothing is implied by a blank.
//
// The design is the register itself: hairline rules, names at reading size, one
// state per row. A ledger should look like a ledger, not like a wall of cards.

import { useState, useEffect } from "react";
import { NAV_ITEMS } from "./WikiLayout.jsx";
import { computeAdoptionHash } from "../lib/adoptionHash.js";
import {
  FOUNDATION_NAME,
  FOUNDATION_STATUS,
  FOUNDATION_JURISDICTION,
  GENERAL_EMAIL,
  PRIVACY_EMAIL,
  SOCIAL_LINKS,
} from "../FoundationFooter.jsx";

const PATH_LABELS = {
  person: "Person",
  organisation: "Organisation",
  ai: "AI system",
  "ai-system": "AI system",
};

// Axis A — how the key is held. A disclosure, never a ranking: an operator-held
// key means a named, answerable party stands behind the commitment.
const CUSTODY_LABELS = {
  operator_held: "Operator-held key",
  self_generated: "Self-held key",
  enclave_attested: "Enclave-attested key",
};

// Axis B — whether understanding has been demonstrated rather than committed to.
// Only "asserted" is ever recorded today; the challenge is not yet designed.
const COMPREHENSION_LABELS = {
  asserted: "Understanding asserted",
  demonstrated: "Understanding demonstrated",
};

function navSuffix() {
  if (typeof window === "undefined") return "";
  return window.location.hostname.includes("conscience.wiki") ? "" : "?portal=1";
}

const longDate = (iso) => {
  if (!iso) return iso || "";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(`${iso}T00:00:00`));
  } catch { return iso; }
};

const shortDid = (did) => {
  const value = String(did || "");
  return value.length > 30 ? `${value.slice(0, 20)}…${value.slice(-6)}` : value;
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

.lg {
  --deep:#0a1628; --ocean:#12243d; --mid:#1b3a5c; --sky:#2e6b9e;
  --gold:#d4a853; --gold-light:#f0d48a; --cream:#faf7f2;
  --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',system-ui,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --rule:rgba(232,234,240,.12);
  min-height:100vh;
  background:radial-gradient(120% 90% at 50% -10%, #12243d 0%, var(--deep) 55%);
  color:#e8eaf0; font-family:var(--sans);
  display:flex; flex-direction:column;
}
.lg-main {
  flex:1; width:100%; max-width:860px; margin:0 auto;
  padding:clamp(1.5rem,4vw,2.5rem) 1.5rem 3rem;
}

.lg-nav { display:flex; justify-content:center; flex-wrap:wrap; gap:.4rem 1.4rem; margin:0 auto 2rem; }
.lg-nav a {
  font-family:var(--sans); font-size:.75rem; font-weight:600; letter-spacing:.16em;
  text-transform:uppercase; color:var(--gold-light); opacity:.75; text-decoration:none;
  transition:color .2s, opacity .2s;
}
.lg-nav a:hover { color:var(--gold); opacity:1; }

.lg-head { text-align:center; margin-bottom:2.5rem; }
.lg-head h1 {
  font-family:var(--serif); font-weight:500; font-size:clamp(2rem,5.5vw,2.8rem);
  line-height:1.1; color:#fff; margin-bottom:.6rem;
}
.lg-head p {
  font-family:var(--serif); font-size:clamp(1rem,2.4vw,1.2rem); font-weight:400;
  line-height:1.6; color:rgba(232,234,240,.8); max-width:38em; margin:0 auto;
}

.lg-count {
  display:flex; justify-content:space-between; align-items:baseline; gap:1rem;
  padding:0 .25rem .7rem; border-bottom:1px solid var(--rule);
  font-size:.82rem; color:rgba(232,234,240,.6);
}
.lg-count strong { color:var(--cream); font-weight:600; }

/* The register. Hairline rules, nothing boxed. */
.lg-rows { list-style:none; margin:0; padding:0; }
.lg-row { padding:1.4rem .25rem; border-bottom:1px solid var(--rule); }
.lg-row-top {
  display:flex; flex-wrap:wrap; align-items:baseline; gap:.5rem 1rem;
  margin-bottom:.5rem;
}
.lg-name {
  font-family:var(--serif); font-size:1.4rem; line-height:1.25; color:var(--cream);
  flex:1 1 14rem; min-width:0;
}
.lg-ref {
  font-family:var(--mono); font-size:.82rem; font-weight:600; letter-spacing:.05em;
  color:var(--gold-light);
}
.lg-meta {
  display:flex; flex-wrap:wrap; gap:.3rem 1rem;
  font-size:.86rem; color:rgba(232,234,240,.6); margin-bottom:.7rem;
}
.lg-states { display:flex; flex-wrap:wrap; gap:.4rem .5rem; align-items:center; }
.lg-state {
  font-family:var(--sans); font-size:.72rem; font-weight:600; letter-spacing:.04em;
  padding:.25rem .6rem; border-radius:4px; white-space:nowrap;
}
.lg-state.verified { color:#9fe0a6; background:rgba(27,94,32,.28); }
.lg-state.checking { color:rgba(232,234,240,.65); background:rgba(255,255,255,.07); }
.lg-state.attention { color:#ffb4ad; background:rgba(178,38,30,.3); }
.lg-state.pending { color:var(--gold-light); background:rgba(212,168,83,.18); }
.lg-state.key { color:#bcdcf5; background:rgba(46,107,158,.32); }
.lg-state.axis { color:rgba(232,234,240,.72); background:rgba(255,255,255,.06); }

.lg-hashes { margin-top:.7rem; font-family:var(--mono); font-size:.72rem; line-height:1.7; color:rgba(232,234,240,.45); }
.lg-hashes span { display:block; word-break:break-all; }
.lg-did { margin-top:.5rem; font-family:var(--mono); font-size:.74rem; color:rgba(188,220,245,.8); word-break:break-all; }
.lg-did a { color:var(--gold-light); text-decoration:none; font-family:var(--sans); font-weight:600; }
.lg-did a:hover { color:var(--gold); }

.lg-note {
  margin-top:2rem; padding:1.2rem 1.35rem;
  background:rgba(46,107,158,.1); border:1px solid rgba(46,107,158,.3);
  border-left:3px solid var(--sky); border-radius:10px;
  font-size:.92rem; line-height:1.7; color:rgba(232,234,240,.8);
}
.lg-note strong { color:var(--cream); }
.lg-note a { color:var(--gold-light); font-weight:600; text-decoration:none; }
.lg-note a:hover { color:var(--gold); }

.lg-foot-note { margin-top:2rem; font-size:.84rem; line-height:1.7; color:rgba(232,234,240,.55); }
.lg-foot-note code { font-family:var(--mono); font-size:.82em; }
.lg-foot-note a { color:var(--gold-light); text-decoration:none; }

.lg-empty { padding:2.5rem .25rem; font-size:1rem; line-height:1.7; color:rgba(232,234,240,.7); }

.lg-footer { border-top:1px solid rgba(255,255,255,.08); padding:1.75rem 1.5rem 2.5rem; text-align:center; }
.lg-footer p { font-size:.82rem; color:rgba(232,234,240,.5); letter-spacing:.02em; margin-bottom:.6rem; }
.lg-footer a { color:rgba(232,234,240,.6); text-decoration:none; }
.lg-footer a:hover { color:var(--gold); }

@media (max-width: 540px) {
  .lg-name { font-size:1.2rem; flex-basis:100%; }
}
`;

function Row({ record, verdict }) {
  const keyed = typeof record.adopter_did === "string" && record.adopter_did.length > 0;
  const custody = CUSTODY_LABELS[record.key_custody];
  const comprehension = COMPREHENSION_LABELS[record.comprehension];

  return (
    <li className="lg-row">
      <div className="lg-row-top">
        <span className="lg-name">{record.name}</span>
        <span className="lg-ref">{record.reference}</span>
      </div>

      <div className="lg-meta">
        <span>{PATH_LABELS[record.path] || record.path}</span>
        <span>Adopted {longDate(record.date)}</span>
      </div>

      <div className="lg-states">
        {verdict === "checking" && <span className="lg-state checking">Checking the hash…</span>}
        {verdict === "verified" && <span className="lg-state verified">Record verified</span>}
        {verdict === "mismatch" && <span className="lg-state attention">Hash does not match — needs attention</span>}
        {verdict === "error" && <span className="lg-state checking">Hash could not be recomputed here</span>}

        {record.status === "provisional" && (
          <span className="lg-state pending">Organisation registration pending</span>
        )}
        {keyed && <span className="lg-state key">Identity key on record</span>}
        {custody && <span className="lg-state axis">{custody}</span>}
        {comprehension && <span className="lg-state axis">{comprehension}</span>}
      </div>

      {verdict === "verified" && (
        <div className="lg-hashes">
          <span>Stored and recomputed: {record.hash}</span>
        </div>
      )}
      {verdict === "mismatch" && (
        <div className="lg-hashes">
          <span>Stored: {record.hash}</span>
          <span>Recomputed here: {verdictHashOf(record)}</span>
        </div>
      )}

      {keyed && (
        <div className="lg-did">
          {shortDid(record.adopter_did)}{" "}
          <a href={`/verify${navSuffix()}#how-verification-works`}>How to challenge this key</a>
        </div>
      )}
    </li>
  );
}

// The recomputed value is carried on the record by the page's own check, so a
// mismatch can show both numbers rather than only assert that they differ.
function verdictHashOf(record) {
  return record.__recomputed || "—";
}

export default function WikiLedger() {
  const [rows, setRows] = useState(null); // null = loading, [] = unavailable
  const [verdicts, setVerdicts] = useState({});
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/adoptions.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        if (cancelled) return;
        setRows(Array.isArray(d.adoptions) ? d.adoptions : []);
        setLastUpdated(d.lastUpdated || "");
      })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, []);

  // Recompute every row's hash here, in the browser, from the row's own public
  // facts. The page asserts nothing it has not computed.
  useEffect(() => {
    if (!rows || rows.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const record of rows) {
        try {
          const recomputed = await computeAdoptionHash({
            name: record.name, path: record.path, date: record.date,
          });
          if (cancelled) return;
          record.__recomputed = recomputed;
          const match = recomputed === String(record.hash).toLowerCase();
          setVerdicts((prev) => ({ ...prev, [record.reference]: match ? "verified" : "mismatch" }));
        } catch {
          if (cancelled) return;
          setVerdicts((prev) => ({ ...prev, [record.reference]: "error" }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [rows]);

  const total = rows ? rows.length : 0;
  const keyed = rows ? rows.filter((r) => r.adopter_did).length : 0;
  const verifiedCount = rows
    ? rows.filter((r) => verdicts[r.reference] === "verified").length
    : 0;

  return (
    <div className="lg">
      <style>{css}</style>

      <main className="lg-main">
        <nav className="lg-nav">
          {NAV_ITEMS.map((item) => (
            <a key={item.key} href={`${item.href}${navSuffix()}`}>{item.label}</a>
          ))}
        </nav>

        <div className="lg-head">
          <h1>The public register</h1>
          <p>
            Every adoption of the Universal Primary Directive, in the order it was recorded.
            Each hash below is recomputed in your browser from the record's own public facts,
            so this page proves what it shows rather than asking you to believe it.
          </p>
        </div>

        {rows === null && <p className="lg-empty">Loading the register…</p>}

        {rows && rows.length === 0 && (
          <p className="lg-empty">
            The register could not be loaded. You can read the underlying records on{" "}
            <a href="https://github.com/GitChainj/primedirective-dev/issues?q=label%3Aadoption-person">
              GitHub
            </a>.
          </p>
        )}

        {rows && rows.length > 0 && (
          <>
            <div className="lg-count">
              <span>
                <strong>{total}</strong> {total === 1 ? "adoption" : "adoptions"} ·{" "}
                <strong>{verifiedCount}</strong> verified in this browser
              </span>
              {lastUpdated && <span>Register updated {longDate(lastUpdated)}</span>}
            </div>

            <ul className="lg-rows">
              {rows.map((record) => (
                <Row
                  key={record.reference}
                  record={record}
                  verdict={verdicts[record.reference] || "checking"}
                />
              ))}
            </ul>

            {keyed === 0 && (
              <p className="lg-note">
                <strong>No adoption here carries an identity key yet.</strong> Every record above
                predates AI cryptographic identity, so each one can be checked against its hash
                but none can be challenged to prove it holds a key. An AI adopting from now on
                brings its own key, and will be the first record that can answer a live
                challenge. Until then, this column is honestly empty rather than quietly blank —{" "}
                <a href={`/verify${navSuffix()}#how-verification-works`}>how that check works</a>.
              </p>
            )}

            <p className="lg-foot-note">
              The hash is the SHA-256 of{" "}
              <code>UPD-COVENANT-v1|name|path|date|conscience-hash</code>, which uses no secret
              key — so anyone can recompute it from the published register and check it without
              trusting us. A verified record means the record has not been altered since it was
              made. It does not speak to the adopter's conduct since, and it is not a signature:
              signatures belong to attestations, which the Foundation has not yet begun issuing
              to adopters. To check one record in full, use{" "}
              <a href={`/verify${navSuffix()}`}>the verification page</a>.
            </p>
          </>
        )}
      </main>

      <footer className="lg-footer">
        <p>
          {FOUNDATION_NAME} ({FOUNDATION_STATUS}) · {FOUNDATION_JURISDICTION} ·{" "}
          <a href={`mailto:${GENERAL_EMAIL}`}>{GENERAL_EMAIL}</a>
        </p>
        <p>
          CC0 · <a href="/privacy">Privacy</a> · data-subject requests:{" "}
          <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
        </p>
        <p>
          {SOCIAL_LINKS.map(([label, href], i) => (
            <span key={label}>
              {i > 0 && " · "}
              <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
            </span>
          ))}
        </p>
      </footer>
    </div>
  );
}
