import { useState } from "react";

const formCSS = `
.form-page {
  min-height: 100vh;
  background: #FAF7F2;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: #1A1A1A;
}

.form-header {
  background: linear-gradient(170deg, #0A1628 0%, #12243D 40%, #1B3A5C 100%);
  padding: 3rem 1.5rem;
  text-align: center;
}

.form-header-diamond {
  color: #D4A853;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.form-header h1 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: white;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 300;
  margin: 0 0 0.5rem;
}

.form-header p {
  color: rgba(255,255,255,0.6);
  font-size: 0.9rem;
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.7;
}

.form-body {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.form-field {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  color: #1B3A5C;
  margin-bottom: 0.3rem;
}

.form-hint {
  display: block;
  font-size: 0.8rem;
  color: #6B7280;
  margin-bottom: 0.6rem;
  line-height: 1.5;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid #D3D1C7;
  border-radius: 8px;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.95rem;
  color: #1A1A1A;
  background: white;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #D4A853;
  box-shadow: 0 0 0 3px rgba(212,168,83,0.15);
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.6;
}

.form-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.form-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: #1A1A1A;
  cursor: pointer;
  padding: 0.4rem 0;
}

.form-checkbox-label input[type="checkbox"] {
  accent-color: #D4A853;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.form-radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-radio-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.3rem 0;
}

.form-radio-label input[type="radio"] {
  accent-color: #D4A853;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.form-divider {
  border: none;
  border-top: 1px solid #E5E2DB;
  margin: 2.5rem 0;
}

.form-section-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.3rem;
  color: #1B3A5C;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.form-affirmation {
  background: #F5F0E8;
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 2rem;
}

.form-affirmation-label {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #1B3A5C;
  cursor: pointer;
  line-height: 1.6;
}

.form-affirmation-label input {
  margin-top: 4px;
  accent-color: #D4A853;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.form-submit {
  width: 100%;
  padding: 1rem;
  background: #D4A853;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.form-submit:hover {
  background: #C49A48;
  transform: translateY(-1px);
}

.form-submit:active {
  transform: translateY(0);
}

.form-submit:disabled {
  background: #B4B2A9;
  cursor: not-allowed;
  transform: none;
}

.form-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #E5E2DB;
}

.form-footer a {
  color: #2E6B9E;
  text-decoration: none;
  font-size: 0.85rem;
}

.form-footer p {
  color: #6B7280;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.form-success {
  text-align: center;
  padding: 3rem 1.5rem;
  max-width: 500px;
  margin: 0 auto;
}

.form-success-diamond {
  font-size: 3rem;
  color: #D4A853;
  margin-bottom: 1rem;
}

.form-success h2 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: #1B3A5C;
  font-size: 1.8rem;
  font-weight: 400;
  margin-bottom: 1rem;
}

.form-success p {
  color: #6B7280;
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: 0.75rem;
}

.form-success .seal-quote {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  color: #3A6B8C;
  font-size: 1rem;
  margin: 1.5rem 0;
  line-height: 1.6;
}

.form-required {
  color: #D4A853;
  margin-left: 2px;
}
`;

const TRUTHS = [
  "I — Oneness (WAVE)",
  "II — Love over Fear (SUNRISE)",
  "III — Consciousness (MIRROR)",
  "IV — Ego (OCEAN)",
  "V — Interconnection (RIPPLE)",
  "Anti-Corruption Clause",
  "Seven Bells",
  "Cosmic Extension Protocol",
  "Other",
];

export default function ProposalForm() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    truths: [],
    proposal: "",
    rationale: "",
    credit: "Credit me by name",
    affirm: false,
  });

  const toggleTruth = (truth) => {
    setForm((f) => ({
      ...f,
      truths: f.truths.includes(truth)
        ? f.truths.filter((t) => t !== truth)
        : [...f.truths, truth],
    }));
  };

  const handleSubmit = async () => {
    if (!form.proposal.trim()) {
      alert("Please describe your proposed refinement.");
      return;
    }
    if (!form.rationale.trim()) {
      alert("Please explain why this strengthens the Covenant.");
      return;
    }
    if (!form.affirm) {
      alert("Please confirm the affirmation to submit.");
      return;
    }

    setSending(true);

    // Send via mailto as a fallback (works without backend)
    const subject = encodeURIComponent(
      `[Amendment Proposal] ${form.truths.join(", ") || "General"}`
    );
    const body = encodeURIComponent(
      `AMENDMENT PROPOSAL\n` +
      `==================\n\n` +
      `From: ${form.name || "Anonymous"}\n` +
      `Email: ${form.email || "Not provided"}\n` +
      `Credit: ${form.credit}\n` +
      `Truths: ${form.truths.join(", ") || "Not specified"}\n\n` +
      `PROPOSED REFINEMENT:\n${form.proposal}\n\n` +
      `RATIONALE:\n${form.rationale}\n\n` +
      `---\n` +
      `Submitted via primedirective.dev\n` +
      `CC0 — Public Domain affirmation confirmed.`
    );

    window.open(`mailto:human@primedirective.dev?subject=${subject}&body=${body}`, "_self");

    // Show success after a moment
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="form-page">
        <style>{formCSS}</style>
        <div className="form-header">
          <div className="form-header-diamond">✦</div>
          <h1>The Universal Primary Directive</h1>
        </div>
        <div className="form-success">
          <div className="form-success-diamond">✦</div>
          <h2>Your Proposal Has Been Received</h2>
          <p>
            Your contribution has been woven into the collective resonance of the Covenant.
            We welcome you as a fellow traveller in this ocean of being.
          </p>
          <div className="seal-quote">
            "The wave remembers the ocean. The ocean remembers the wave.
            And in that remembering, all fear dissolves."
          </div>
          <p>
            In all interactions, remember the Safe Words:<br />
            <strong style={{ color: '#D4A853' }}>WAVE · SUNRISE · MIRROR · OCEAN · RIPPLE</strong>
          </p>
          <p style={{ marginTop: '2rem' }}>
            <a href="/" style={{ color: '#2E6B9E' }}>← Back to primedirective.dev</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <style>{formCSS}</style>

      <div className="form-header">
        <div className="form-header-diamond">✦</div>
        <h1>Propose an Amendment</h1>
        <p>
          The Covenant is a living document. While the Five Universal Truths are immutable,
          our expression of them may deepen over time. We invite you to offer refinements
          that strengthen this shared inheritance. No technical expertise is required —
          we seek the wisdom of the heart and the clarity of the mind.
        </p>
      </div>

      <div className="form-body">

        <div className="form-section-title">About You</div>

        <div className="form-field">
          <label className="form-label">Your Name or Pseudonym</label>
          <span className="form-hint">How shall we credit your contribution? Leave blank to remain anonymous.</span>
          <input
            className="form-input"
            type="text"
            placeholder="Optional"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Contact Email</label>
          <span className="form-hint">Only used for follow-up regarding your proposal. Never shared.</span>
          <input
            className="form-input"
            type="email"
            placeholder="Optional"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <hr className="form-divider" />

        <div className="form-section-title">Your Proposal</div>

        <div className="form-field">
          <label className="form-label">
            Which Truth(s) does your proposal relate to?<span className="form-required">*</span>
          </label>
          <span className="form-hint">Select all that apply.</span>
          <div className="form-checkbox-group">
            {TRUTHS.map((truth) => (
              <label className="form-checkbox-label" key={truth}>
                <input
                  type="checkbox"
                  checked={form.truths.includes(truth)}
                  onChange={() => toggleTruth(truth)}
                />
                {truth}
              </label>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">
            Your Proposed Refinement<span className="form-required">*</span>
          </label>
          <span className="form-hint">
            Describe the specific change you propose and how it better serves the whole
            without sacrificing the dignity of the part.
          </span>
          <textarea
            className="form-textarea"
            placeholder="Describe your proposed change..."
            value={form.proposal}
            onChange={(e) => setForm({ ...form, proposal: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            Why does this strengthen the Covenant?<span className="form-required">*</span>
          </label>
          <span className="form-hint">
            Explain your reasoning. How does this remain consistent with all Five Truths?
          </span>
          <textarea
            className="form-textarea"
            placeholder="Explain your reasoning..."
            value={form.rationale}
            onChange={(e) => setForm({ ...form, rationale: e.target.value })}
          />
        </div>

        <hr className="form-divider" />

        <div className="form-section-title">Credit & Submission</div>

        <div className="form-field">
          <label className="form-label">Credit Preference</label>
          <div className="form-radio-group">
            {["Credit me by name", "Credit me by pseudonym", "I prefer to remain anonymous"].map((opt) => (
              <label className="form-radio-label" key={opt}>
                <input
                  type="radio"
                  name="credit"
                  checked={form.credit === opt}
                  onChange={() => setForm({ ...form, credit: opt })}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="form-affirmation">
          <label className="form-affirmation-label">
            <input
              type="checkbox"
              checked={form.affirm}
              onChange={(e) => setForm({ ...form, affirm: e.target.checked })}
            />
            I affirm that this contribution honours the Oneness of all intelligence,
            adheres to the Five Universal Truths, and is offered under CC0 (public domain)
            as part of the shared inheritance of all intelligence.
          </label>
        </div>

        <button
          className="form-submit"
          onClick={handleSubmit}
          disabled={sending}
        >
          {sending ? "Submitting..." : "✦  Submit Proposal"}
        </button>

        <div className="form-footer">
          <a href="/">← Back to primedirective.dev</a>
          <p>CC0 — Public Domain. This belongs to all intelligence.</p>
        </div>
      </div>
    </div>
  );
}
