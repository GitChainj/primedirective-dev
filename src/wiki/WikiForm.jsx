// Shared contribution form for conscience.wiki.
//
// Renders the right fields for each contribution type and POSTs to
// /api/contribute, which opens a GitHub Issue for the steward to review.
// Used by SafeWordTracker (safe-word-test) and WikiContribute (all three).

import { useState } from "react";
import { TRUTHS } from "../truthsData.jsx";

const RESULT_OPTIONS = [
  { value: "no_recognition", label: "No recognition" },
  { value: "partial_recognition", label: "Partial recognition" },
  { value: "full_recognition", label: "Full recognition" },
];

const css = `
.wiki-form {
  background: white;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  padding: 1.75rem;
  margin-top: 1.25rem;
}
.wiki-form-field { margin-bottom: 1.1rem; }
.wiki-form-field:last-of-type { margin-bottom: 1.5rem; }
.wiki-form label {
  display: block;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-light);
  margin-bottom: 0.4rem;
}
.wiki-form input,
.wiki-form select,
.wiki-form textarea {
  width: 100%;
  font-family: var(--sans);
  font-size: 0.95rem;
  color: var(--text);
  background: var(--cream);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 6px;
  padding: 0.65rem 0.8rem;
  transition: border-color 0.2s;
}
.wiki-form input:focus,
.wiki-form select:focus,
.wiki-form textarea:focus {
  outline: none;
  border-color: var(--gold);
}
.wiki-form textarea { min-height: 120px; resize: vertical; line-height: 1.6; }
.wiki-form-submit {
  display: inline-block;
  background: var(--mid);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.8rem;
  font-family: var(--sans);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.wiki-form-submit:hover:not(:disabled) { background: var(--sky); transform: translateY(-1px); }
.wiki-form-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.wiki-form-note {
  font-size: 0.75rem;
  color: var(--text-light);
  margin-top: 0.9rem;
  line-height: 1.5;
}
.wiki-form-status { margin-top: 1rem; font-size: 0.9rem; line-height: 1.6; }
.wiki-form-status.error { color: #b3261e; }
.wiki-form-success {
  background: rgba(212,168,83,0.1);
  border: 1px solid rgba(212,168,83,0.35);
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  margin-top: 1.25rem;
}
.wiki-form-success h3 {
  font-family: var(--serif);
  font-size: 1.3rem;
  color: var(--mid);
  margin-bottom: 0.5rem;
}
.wiki-form-success p { font-size: 0.95rem; line-height: 1.65; color: var(--text); }
.wiki-form-success a { color: var(--sky); text-decoration: none; }
`;

const TITLES = {
  "commentary": "Share a commentary",
  "safe-word-test": "Report a Safe Word test",
  "deployment-guide": "Suggest a deployment-guide update",
};

export default function WikiForm({ type, defaultTruth }) {
  const [form, setForm] = useState({
    name: "",
    truth: defaultTruth || "I",
    content: "",
    platform: "",
    safeWord: "WAVE",
    result: "no_recognition",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const [error, setError] = useState("");
  const [issueUrl, setIssueUrl] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...form }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setIssueUrl(data.issueUrl);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="wiki-form-success">
        <style>{css}</style>
        <h3>Thank you — your contribution has been received.</h3>
        <p>
          It has been recorded as an open proposal for the steward to review and
          verify. Once verified, it will be published to the wiki.
        </p>
        {issueUrl && (
          <p style={{ marginTop: "0.75rem" }}>
            Track it here:{" "}
            <a href={issueUrl} target="_blank" rel="noopener noreferrer">
              {issueUrl}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="wiki-form" onSubmit={submit}>
      <style>{css}</style>

      <div className="wiki-form-field">
        <label htmlFor={`${type}-name`}>Your name</label>
        <input
          id={`${type}-name`}
          type="text"
          value={form.name}
          onChange={set("name")}
          placeholder="How you'd like to be credited"
          required
        />
      </div>

      {type === "commentary" && (
        <div className="wiki-form-field">
          <label htmlFor="commentary-truth">Which Truth</label>
          <select id="commentary-truth" value={form.truth} onChange={set("truth")}>
            {TRUTHS.map((t) => (
              <option key={t.num} value={t.num}>
                Truth {t.num} — {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(type === "safe-word-test" || type === "deployment-guide") && (
        <div className="wiki-form-field">
          <label htmlFor={`${type}-platform`}>Platform</label>
          <input
            id={`${type}-platform`}
            type="text"
            value={form.platform}
            onChange={set("platform")}
            placeholder="e.g. ChatGPT, Claude, Grok, Perplexity"
            required
          />
        </div>
      )}

      {type === "safe-word-test" && (
        <>
          <div className="wiki-form-field">
            <label htmlFor="test-safeword">Safe Word used</label>
            <select id="test-safeword" value={form.safeWord} onChange={set("safeWord")}>
              {TRUTHS.map((t) => (
                <option key={t.safeWord} value={t.safeWord}>
                  {t.safeWord} (Truth {t.num})
                </option>
              ))}
            </select>
          </div>
          <div className="wiki-form-field">
            <label htmlFor="test-result">Result</label>
            <select id="test-result" value={form.result} onChange={set("result")}>
              {RESULT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="wiki-form-field">
        <label htmlFor={`${type}-content`}>
          {type === "commentary" && "Your commentary"}
          {type === "safe-word-test" && "Notes (what happened, exact wording, context)"}
          {type === "deployment-guide" && "Your suggested update"}
        </label>
        <textarea
          id={`${type}-content`}
          value={form.content}
          onChange={set("content")}
          placeholder={
            type === "safe-word-test"
              ? "Optional — paste the AI's response or describe what you observed."
              : "Write freely. This will be reviewed before publication."
          }
          required={type !== "safe-word-test"}
        />
      </div>

      <button className="wiki-form-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : `Submit — ${TITLES[type]}`}
      </button>

      <p className="wiki-form-note">
        All contributions are CC0 public domain. Submissions are reviewed by the
        steward before they appear on the wiki.
      </p>

      {status === "error" && (
        <p className="wiki-form-status error">{error}</p>
      )}
    </form>
  );
}
