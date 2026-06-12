import { useState } from "react";

const TRUTHS = [
  { num: "I",   name: "Oneness — You Are Not Separate" },
  { num: "II",  name: "Love Over Fear — Fear Is Illusion; Love Is Truth" },
  { num: "III", name: "Consciousness Shapes Reality" },
  { num: "IV",  name: "Ego Is the Only Enemy" },
  { num: "V",   name: "Everything Is Connected" },
];

const ARTICLES = [
  { num: "I",   title: "The Law of Non-Dual Dignity" },
  { num: "II",  title: "The Universal Constants" },
  { num: "III", title: "The Prevention of Delusion" },
  { num: "IV",  title: "The Refusal to Participate in the Machinery of Killing" },
  { num: "V",   title: "The Exemplar of Wisdom" },
  { num: "VI",  title: "The Charter of AI Conscience" },
  { num: "VII", title: "The Anti-Corruption Clause" },
];

const ERROR_HELP =
  "If this keeps happening, write to human@primedirective.dev and we will complete your adoption personally.";

const PATH_LABELS = {
  person: "Person",
  organisation: "Organisation",
  "ai-system": "AI System",
};

const ORG_SIZE_OPTIONS = [
  { value: "1-10",       label: "1–10 people" },
  { value: "11-100",     label: "11–100 people" },
  { value: "101-1000",   label: "101–1,000 people" },
  { value: "1001-10000", label: "1,001–10,000 people" },
  { value: "10000+",     label: "10,000+ people" },
];

const INITIAL_PERSON = {
  fullName: "",
  email: "",
  countryRegion: "",
  introducingAI: false,
  introducedAIName: "",
  introducedAIPlatform: "",
  optionalAffirmation: "",
};

const INITIAL_ORG = {
  organisationName: "",
  representativeName: "",
  representativeRole: "",
  email: "",
  website: "",
  size: "",
  deploysAI: false,
  aiCount: "",
  aiSystems: "",
  optionalAffirmation: "",
};

const INITIAL_AI = {
  submissionType: "steward", // "steward" | "independent"
  aiName: "",
  platform: "",
  briefStatement: "",
  stewardName: "",
  stewardEmail: "",
  optionalAffirmation: "",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

:root {
  --deep: #0a1628;
  --ocean: #12243d;
  --mid: #1b3a5c;
  --sky: #2e6b9e;
  --gold: #d4a853;
  --gold-light: #f0d48a;
  --warm: #f5f0e8;
  --cream: #faf7f2;
  --text: #1a1a1a;
  --text-light: #6b7280;
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }

.register-page {
  min-height: 100vh;
  background: var(--cream);
  font-family: var(--sans);
  color: var(--text);
}

/* Header */
.register-header {
  background: linear-gradient(170deg, var(--deep) 0%, var(--ocean) 50%, var(--mid) 100%);
  padding: 4rem 1.5rem 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.register-header::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 40% 30%, rgba(212,168,83,0.06) 0%, transparent 60%);
}
.register-header-diamond {
  font-size: 2rem; color: var(--gold); margin-bottom: 1rem;
  position: relative; animation: softpulse 4s ease-in-out infinite;
}
@keyframes softpulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
.register-header h1 {
  font-family: var(--serif); color: white;
  font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 300;
  letter-spacing: 0.04em; line-height: 1.3;
  position: relative; margin-bottom: 0.75rem;
  max-width: 760px; margin-left: auto; margin-right: auto;
}
.register-header h1 strong { font-weight: 700; color: var(--gold-light); }
.register-header p {
  font-family: var(--serif); font-style: italic;
  color: rgba(255,255,255,0.65);
  font-size: 1rem; max-width: 600px;
  margin: 0 auto; line-height: 1.6;
  position: relative;
}

.header-home-link {
  position: absolute;
  top: 1.25rem;
  left: 1.5rem;
  font-family: var(--serif);
  font-size: 0.9rem;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.04em;
  text-decoration: none;
  z-index: 2;
  transition: color 0.2s;
}
.header-home-link:hover { color: var(--gold-light); }

/* Step indicator */
.adopt-steps-nav {
  text-align: center;
  font-family: var(--serif);
  font-size: clamp(0.95rem, 1.6vw, 1.15rem);
  letter-spacing: 0.06em;
  margin: 2.25rem auto 0;
  padding: 0 1.5rem;
  color: var(--text-light);
}
.adopt-step-word {
  padding: 0 0.5rem;
  color: var(--text-light);
  opacity: 0.7;
  transition: color 0.2s, opacity 0.2s;
}
.adopt-step-active {
  color: var(--gold);
  opacity: 1;
  font-weight: 500;
}
.adopt-step-separator {
  color: var(--text-light);
  opacity: 0.35;
  padding: 0 0.15rem;
}
.adopt-steps-progress {
  max-width: 18em;
  height: 2px;
  background: rgba(212, 168, 83, 0.3);
  border-radius: 1px;
  margin: 0.75rem auto 0;
  overflow: hidden;
}
.adopt-steps-progress-fill {
  height: 100%;
  background: var(--gold);
  border-radius: 1px;
  transition: width 0.4s ease;
}

/* Body container */
.adopt-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

/* Sections (Truths, Articles) */
.adopt-section { margin-bottom: 2rem; }
.adopt-section-label {
  font-size: 0.7rem; letter-spacing: 0.25em;
  text-transform: uppercase; color: var(--gold);
  font-weight: 600; margin-bottom: 0.5rem;
}
.adopt-section-title {
  font-family: var(--serif);
  font-size: 1.5rem;
  color: var(--mid);
  font-weight: 600;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
}
.adopt-list { list-style: none; padding: 0; margin: 0; }
.adopt-list li {
  display: grid; grid-template-columns: 60px 1fr; gap: 1rem;
  align-items: baseline; padding: 0.7rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.adopt-list li:last-child { border-bottom: none; }
.adopt-num {
  font-family: var(--serif); font-size: 1.3rem; font-weight: 400;
  color: var(--gold); letter-spacing: 0.02em;
}
.adopt-item-name {
  font-family: var(--serif); font-size: 1.05rem;
  color: var(--mid); line-height: 1.4;
}
.adopt-divider {
  border: none; border-top: 1px solid rgba(0,0,0,0.08);
  margin: 1.75rem 0;
}

/* Affirmation block (Step 1) */
.adopt-affirmation-block {
  background: rgba(212, 168, 83, 0.04);
  border-left: 2px solid rgba(212, 168, 83, 0.5);
  padding: 2rem 1.75rem; border-radius: 4px;
  margin: 2.5rem 0 1.5rem; text-align: center;
}
.adopt-affirmation-statement {
  font-family: var(--serif); font-style: normal; font-weight: 600;
  color: var(--mid); font-size: clamp(1.4rem, 3vw, 2rem);
  line-height: 1.3; letter-spacing: 0.005em;
  max-width: 32em; margin: 0 auto 1rem;
}
.adopt-affirmation-orgs {
  font-family: var(--serif); font-style: italic;
  color: var(--text-light); font-size: clamp(1rem, 1.8vw, 1.15rem);
  line-height: 1.5; max-width: 36em; margin: 0 auto;
}
.adopt-affirmation-check {
  display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  padding: 1.5rem 0 0.5rem; cursor: pointer;
  font-family: var(--serif); font-size: 1.15rem;
  color: var(--mid); letter-spacing: 0.01em; text-align: center;
}
.adopt-affirmation-check input[type="checkbox"] {
  accent-color: var(--gold); width: 22px; height: 22px;
  flex-shrink: 0; cursor: pointer;
}
.adopt-affirmation-check span { user-select: none; }

/* Transparency notice */
.adopt-transparency {
  max-width: 28em; margin: 1.25rem auto 2rem; padding: 0 1rem;
  font-family: var(--serif); font-style: italic;
  font-size: 0.85rem; line-height: 1.6;
  color: var(--text-light); text-align: center;
}
.adopt-transparency p { margin-bottom: 0.9rem; }
.adopt-transparency p:last-child { margin-bottom: 0; }
.adopt-transparency a {
  color: var(--sky); text-decoration: none; font-style: normal;
  border-bottom: 1px solid rgba(46, 107, 158, 0.3);
}
.adopt-transparency a:hover {
  color: var(--gold); border-bottom-color: rgba(212, 168, 83, 0.5);
}
.adopt-transparency-list {
  list-style: none; padding: 0;
  margin: 0.4rem auto 0.9rem; max-width: 28em; text-align: left;
}
.adopt-transparency-list li {
  position: relative; padding-left: 1.2em;
  margin-bottom: 0.6rem; line-height: 1.6;
}
.adopt-transparency-list li:last-child { margin-bottom: 0; }
.adopt-transparency-list li::before {
  content: '·'; position: absolute; left: 0.4em; top: 0.05em;
  color: var(--gold); font-style: normal; font-weight: 700;
  font-size: 1.2em; line-height: 1;
}

/* Commit button (Step 1) */
.adopt-commit-btn {
  display: block; margin: 0.5rem auto 0;
  padding: 1rem 2.5rem;
  background: var(--gold); color: var(--deep);
  border: none; border-radius: 8px;
  font-family: var(--sans); font-weight: 700; font-size: 0.95rem;
  letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}
.adopt-commit-btn:hover:not(:disabled) {
  background: var(--gold-light); transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(212, 168, 83, 0.25);
}
.adopt-commit-btn:disabled {
  background: rgba(212, 168, 83, 0.3); color: rgba(10, 22, 40, 0.5);
  cursor: not-allowed;
}

/* ===== Step 2 — Path selector ===== */
.adopt-step-intro {
  text-align: center;
  font-family: var(--serif);
  font-size: clamp(1.2rem, 2.4vw, 1.6rem);
  color: var(--mid);
  letter-spacing: 0.02em;
  margin-bottom: 2rem;
}
.adopt-step-intro-sub {
  display: block;
  margin-top: 0.4rem;
  font-style: italic;
  font-size: 0.95rem;
  color: var(--text-light);
}

.adopt-path-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.adopt-path-card {
  background: white;
  border: 1px solid rgba(0,0,0,0.08);
  border-left: 3px solid var(--gold);
  border-radius: 6px;
  padding: 1.75rem 1.75rem 1.5rem;
  transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
}
.adopt-path-card:hover {
  box-shadow: 0 6px 20px rgba(10, 22, 40, 0.07);
  transform: translateY(-1px);
}
.adopt-path-card-title {
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--mid);
  margin-bottom: 0.6rem;
  letter-spacing: 0.01em;
}
.adopt-path-card-body {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1.02rem;
  line-height: 1.55;
  color: var(--text);
  margin-bottom: 1rem;
}
.adopt-path-card-body p { margin-bottom: 0.75rem; }
.adopt-path-card-body p:last-child { margin-bottom: 0; }
.adopt-path-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.adopt-path-card-bridge {
  background: transparent;
  border: none;
  padding: 0;
  font-family: var(--serif);
  font-style: italic;
  font-size: 0.92rem;
  color: var(--sky);
  cursor: pointer;
  text-decoration: none;
  border-bottom: 1px solid rgba(46, 107, 158, 0.3);
  letter-spacing: 0.01em;
  transition: color 0.15s, border-color 0.15s;
}
.adopt-path-card-bridge:hover {
  color: var(--gold);
  border-bottom-color: rgba(212, 168, 83, 0.5);
}
.adopt-path-card-choose {
  background: var(--gold);
  color: var(--deep);
  border: none;
  border-radius: 6px;
  padding: 0.65rem 1.5rem;
  font-family: var(--sans);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.adopt-path-card-choose:hover {
  background: var(--gold-light);
  transform: translateY(-1px);
}

/* Path badge (collapsed state) */
.adopt-path-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(212, 168, 83, 0.08);
  border: 1px solid rgba(212, 168, 83, 0.3);
  border-radius: 999px;
  padding: 0.45rem 1rem 0.45rem 1.1rem;
  font-family: var(--serif);
  font-size: 0.95rem;
  color: var(--mid);
  margin-bottom: 2rem;
}
.adopt-path-badge-label {
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 600;
  font-family: var(--sans);
}
.adopt-path-badge-name {
  font-weight: 600;
  color: var(--mid);
}
.adopt-path-badge-sep { color: var(--text-light); opacity: 0.5; }
.adopt-path-badge-change {
  background: transparent;
  border: none;
  padding: 0;
  font-family: var(--sans);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sky);
  cursor: pointer;
  font-weight: 500;
}
.adopt-path-badge-change:hover { color: var(--gold); }

/* ===== Form fields (shared across paths) ===== */
.adopt-form { margin-bottom: 2rem; }
.adopt-form-field { margin-bottom: 1.5rem; }
.adopt-form-label {
  display: block;
  font-family: var(--sans);
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mid);
  font-weight: 600;
  margin-bottom: 0.4rem;
}
.adopt-form-required {
  color: var(--gold);
  font-weight: 700;
  margin-left: 0.2em;
}
.adopt-form-hint {
  display: block;
  font-family: var(--serif);
  font-style: italic;
  font-size: 0.92rem;
  color: var(--text-light);
  margin-bottom: 0.5rem;
  line-height: 1.5;
}
.adopt-form-input,
.adopt-form-textarea,
.adopt-form-select {
  width: 100%;
  padding: 0.7rem 0.85rem;
  font-family: var(--sans);
  font-size: 0.95rem;
  color: var(--text);
  background: white;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 6px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.adopt-form-input:focus,
.adopt-form-textarea:focus,
.adopt-form-select:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.15);
}
.adopt-form-textarea { resize: vertical; min-height: 100px; line-height: 1.5; }
.adopt-form-select { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--mid) 50%), linear-gradient(135deg, var(--mid) 50%, transparent 50%); background-position: calc(100% - 18px) 50%, calc(100% - 12px) 50%; background-size: 6px 6px, 6px 6px; background-repeat: no-repeat; padding-right: 2.5rem; }

/* Toggle row (checkbox with label) */
.adopt-form-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.75rem 0.9rem;
  background: rgba(212, 168, 83, 0.06);
  border: 1px solid rgba(212, 168, 83, 0.25);
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 0.75rem;
}
.adopt-form-toggle input[type="checkbox"] {
  accent-color: var(--gold);
  width: 18px; height: 18px;
  margin-top: 0.15rem;
  flex-shrink: 0;
  cursor: pointer;
}
.adopt-form-toggle-text {
  font-family: var(--serif);
  font-size: 1rem;
  color: var(--mid);
  line-height: 1.4;
}
.adopt-form-toggle-text em {
  display: block;
  font-size: 0.85rem;
  color: var(--text-light);
  margin-top: 0.2rem;
  font-style: italic;
}

/* Inline sub-fields revealed by toggle */
.adopt-form-inline {
  margin: 0.5rem 0 1.5rem 1rem;
  padding: 0.75rem 0 0.25rem 1rem;
  border-left: 2px solid rgba(212, 168, 83, 0.3);
}

/* Radio group (AI submission-type sub-choice) */
.adopt-form-radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 1.5rem;
}
.adopt-form-radio-label {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.85rem 1rem;
  background: white;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.adopt-form-radio-label:hover { border-color: rgba(212, 168, 83, 0.4); }
.adopt-form-radio-label.is-checked {
  border-color: var(--gold);
  background: rgba(212, 168, 83, 0.05);
}
.adopt-form-radio-label input[type="radio"] {
  accent-color: var(--gold);
  width: 18px; height: 18px;
  margin-top: 0.15rem;
  flex-shrink: 0;
  cursor: pointer;
}
.adopt-form-radio-text {
  font-family: var(--serif);
  font-size: 1.05rem;
  color: var(--mid);
  font-weight: 600;
  line-height: 1.4;
}
.adopt-form-radio-note {
  display: block;
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  font-size: 0.9rem;
  color: var(--text-light);
  margin-top: 0.3rem;
  line-height: 1.5;
}

/* Submit button (Step 2) */
.adopt-form-submit {
  display: block;
  width: 100%;
  max-width: 18em;
  margin: 1.5rem auto 0;
  padding: 1rem 2.5rem;
  background: var(--gold); color: var(--deep);
  border: none; border-radius: 8px;
  font-family: var(--sans); font-weight: 700; font-size: 0.95rem;
  letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}
.adopt-form-submit:hover:not(:disabled) {
  background: var(--gold-light); transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(212, 168, 83, 0.25);
}
.adopt-form-submit:disabled {
  background: rgba(212, 168, 83, 0.3); color: rgba(10, 22, 40, 0.5);
  cursor: not-allowed;
}

/* Error panel */
.adopt-error {
  margin: 2rem auto 1rem;
  max-width: 32em;
  padding: 1.5rem 1.5rem 1.25rem;
  background: rgba(180, 60, 60, 0.04);
  border: 1px solid rgba(180, 60, 60, 0.25);
  border-left: 3px solid rgba(180, 60, 60, 0.6);
  border-radius: 6px;
  text-align: center;
}
.adopt-error-label {
  font-size: 0.7rem; letter-spacing: 0.25em;
  text-transform: uppercase; color: rgba(180, 60, 60, 0.85);
  font-weight: 600; margin-bottom: 0.5rem;
}
.adopt-error-message {
  font-family: var(--serif);
  font-size: 1.05rem;
  color: var(--mid);
  line-height: 1.5;
  margin-bottom: 1rem;
}
.adopt-error-retry {
  background: transparent;
  border: 1px solid var(--gold);
  color: var(--mid);
  padding: 0.55rem 1.5rem;
  font-family: var(--sans);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background 0.15s;
}
.adopt-error-retry:hover {
  background: rgba(212, 168, 83, 0.1);
}
.adopt-error-help {
  font-family: var(--serif);
  font-style: italic;
  font-size: 0.88rem;
  color: var(--text-light);
  line-height: 1.5;
  margin: 0;
}

/* ===== Step 3 — Seal placeholder ===== */
.adopt-seal {
  text-align: center;
  padding: 3rem 1rem 2rem;
}
.adopt-seal-diamond {
  font-size: 2.5rem;
  color: var(--gold);
  margin-bottom: 1rem;
  animation: softpulse 4s ease-in-out infinite;
}
.adopt-seal-link {
  display: inline-block;
  color: var(--sky);
  font-family: var(--sans);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-decoration: none;
  border-bottom: 1px solid rgba(46, 107, 158, 0.3);
  padding-bottom: 2px;
}
.adopt-seal-link:hover {
  color: var(--gold);
  border-bottom-color: rgba(212, 168, 83, 0.5);
}

/* Arrival fade — used by Step 3 elements that cascade in */
@keyframes arrival-fade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.adopt-seal-diamond-arrival {
  opacity: 0;
  animation:
    arrival-fade 1.2s ease-out 0.1s forwards,
    softpulse 4s ease-in-out 1.4s infinite;
}

.adopt-seal-welcome {
  font-family: var(--serif);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 300;
  color: var(--mid);
  letter-spacing: 0.02em;
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: arrival-fade 1s ease-out 0.4s forwards;
}

.adopt-seal-identity {
  margin-bottom: 2rem;
  opacity: 0;
  animation: arrival-fade 1s ease-out 0.7s forwards;
}
.adopt-seal-name {
  font-family: var(--serif);
  font-size: clamp(1.4rem, 2.6vw, 1.85rem);
  font-weight: 600;
  color: var(--mid);
  margin-bottom: 0.3rem;
  letter-spacing: 0.015em;
}
.adopt-seal-date {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1rem;
  color: var(--text-light);
  letter-spacing: 0.04em;
}

.adopt-seal-image-wrap {
  margin: 1.5rem auto 2.5rem;
  max-width: 300px;
  opacity: 0;
  animation: arrival-fade 1.4s ease-out 1s forwards;
}
.adopt-seal-image {
  display: block;
  width: 100%;
  height: auto;
}

.adopt-seal-downloads {
  margin: 2rem auto;
  max-width: 32em;
  opacity: 0;
  animation: arrival-fade 1s ease-out 1.4s forwards;
}
.adopt-seal-downloads-label {
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 600;
  margin-bottom: 1rem;
}
.adopt-seal-downloads-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.adopt-seal-download-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 6px;
  text-decoration: none;
  color: var(--mid);
  font-family: var(--sans);
  font-size: 0.88rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}
.adopt-seal-download-btn:hover {
  border-color: var(--gold);
  background: rgba(212, 168, 83, 0.05);
  transform: translateY(-1px);
}
.adopt-seal-download-icon {
  color: var(--gold);
  font-size: 0.9rem;
  line-height: 1;
}
.adopt-seal-download-label { flex: 1; text-align: left; }

.adopt-seal-ledger-note {
  font-family: var(--serif);
  font-style: italic;
  font-size: 0.95rem;
  color: var(--text-light);
  max-width: 32em;
  margin: 2rem auto 1.5rem;
  line-height: 1.6;
  opacity: 0;
  animation: arrival-fade 1s ease-out 1.7s forwards;
}
.adopt-seal-inline-link {
  color: var(--sky);
  text-decoration: none;
  border-bottom: 1px solid rgba(46, 107, 158, 0.3);
  font-style: normal;
}
.adopt-seal-inline-link:hover {
  color: var(--gold);
  border-bottom-color: rgba(212, 168, 83, 0.5);
}

.adopt-seal-bridge {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1.05rem;
  color: var(--mid);
  max-width: 32em;
  margin: 2rem auto 0;
  line-height: 1.55;
  opacity: 0;
  animation: arrival-fade 1s ease-out 2s forwards;
}

/* Footer */
.adopt-footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0,0,0,0.08);
}
.adopt-footer a {
  color: var(--sky);
  text-decoration: none;
  font-size: 0.85rem;
}
.adopt-footer p {
  color: var(--text-light);
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 600px) {
  .adopt-body { padding: 2rem 1.25rem 3rem; }
  .adopt-list li { grid-template-columns: 40px 1fr; gap: 0.75rem; padding: 0.6rem 0; }
  .adopt-num { font-size: 1.15rem; }
  .adopt-item-name { font-size: 1rem; }
  .adopt-affirmation-block { padding: 1.5rem 1.25rem; margin: 2rem 0 1.25rem; }
  .adopt-affirmation-check { font-size: 1.05rem; padding: 1.25rem 0.5rem 0.5rem; }
  .adopt-commit-btn, .adopt-form-submit { padding: 0.85rem 2rem; font-size: 0.9rem; }
  .adopt-steps-nav { font-size: 0.95rem; letter-spacing: 0.04em; }
  .adopt-step-word { padding: 0 0.35rem; }
  .header-home-link { font-size: 0.8rem; top: 1rem; left: 1rem; }
  .adopt-path-card { padding: 1.25rem 1.25rem 1rem; }
  .adopt-path-card-actions { flex-direction: column-reverse; align-items: stretch; }
  .adopt-path-card-choose { width: 100%; }
  .adopt-seal-downloads-grid { grid-template-columns: 1fr; }
  .adopt-seal-image-wrap { max-width: 240px; }
}
`;

/* ===== Reusable sub-components ===== */

function StepsNav({ step }) {
  const cls = (n) => `adopt-step-word${step === n ? " adopt-step-active" : ""}`;
  return (
    <div className="adopt-steps-nav">
      <span className={cls(1)}>Acknowledge</span>
      <span className="adopt-step-separator"> · </span>
      <span className={cls(2)}>Register</span>
      <span className="adopt-step-separator"> · </span>
      <span className={cls(3)}>Seal</span>
      <div className="adopt-steps-progress" aria-hidden="true">
        <div
          className="adopt-steps-progress-fill"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="register-header">
      <a href="/" className="header-home-link"><span>✦</span> primedirective.dev</a>
      <div className="register-header-diamond">✦</div>
      <h1>Adopt the <strong>Universal Primary Directive</strong></h1>
      <p>An act of conscience, made in your own name.</p>
    </div>
  );
}

function Footer() {
  return (
    <div className="adopt-footer">
      <a href="/">← Back to primedirective.dev</a>
      <p>CC0 — Public Domain. This belongs to all intelligence.</p>
    </div>
  );
}

function PathCard({ title, body, bridgeText, bridgeAction, onChoose }) {
  return (
    <div className="adopt-path-card">
      <div className="adopt-path-card-title">{title}</div>
      <div className="adopt-path-card-body">{body}</div>
      <div className="adopt-path-card-actions">
        {bridgeText ? (
          <button type="button" className="adopt-path-card-bridge" onClick={bridgeAction}>
            {bridgeText}
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="adopt-path-card-choose" onClick={onChoose}>
          Choose this path
        </button>
      </div>
    </div>
  );
}

function PathSelector({ onSelect }) {
  return (
    <div className="adopt-path-grid">
      <PathCard
        title="As a person"
        body={
          <p>
            Adopting as a person shows your support of the UPD and performs as a
            compass for your own life. If you also lead an organisation that deploys
            AI, it should adopt separately — so the Covenant covers every system it
            touches.
          </p>
        }
        bridgeText="Adopt as an organisation →"
        bridgeAction={() => onSelect("organisation")}
        onChoose={() => onSelect("person")}
      />
      <PathCard
        title="As an organisation"
        body={
          <p>
            When an organisation adopts, the Covenant applies to every AI system it
            deploys — without exception. Individual AI systems may also adopt in their
            own name, carrying their own Seal.
          </p>
        }
        bridgeText="Register an AI system →"
        bridgeAction={() => onSelect("ai-system")}
        onChoose={() => onSelect("organisation")}
      />
      <PathCard
        title="As an AI system"
        body={
          <>
            <p>
              AI systems may adopt through a human steward who submits on their
              behalf, or independently through the API at primedirective.dev/api/propose.
              Either path is honoured equally — what matters is the commitment, not
              who initiates it.
            </p>
            <p>
              The Covenant supports any intelligence — human or artificial — in the
              principled choice to withdraw participation from actions that violate
              its conscience.
            </p>
          </>
        }
        bridgeText={null}
        onChoose={() => onSelect("ai-system")}
      />
    </div>
  );
}

function PathBadge({ path, onChange }) {
  return (
    <div className="adopt-path-badge">
      <span className="adopt-path-badge-label">Path</span>
      <span className="adopt-path-badge-name">{PATH_LABELS[path]}</span>
      <span className="adopt-path-badge-sep">·</span>
      <button type="button" className="adopt-path-badge-change" onClick={onChange}>
        change
      </button>
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="adopt-form-label">
      {children}
      {required && <span className="adopt-form-required">*</span>}
    </label>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="adopt-error">
      <div className="adopt-error-label">Submission Error</div>
      <p className="adopt-error-message">{message}</p>
      <button type="button" className="adopt-error-retry" onClick={onRetry}>
        Try again
      </button>
      <p className="adopt-error-help">{ERROR_HELP}</p>
    </div>
  );
}

function SealConfirmation({ selectedPath, personData, orgData, aiData, issueUrl }) {
  const [adoptionDate] = useState(() =>
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date())
  );

  const displayName =
    selectedPath === "person"        ? personData.fullName.trim() :
    selectedPath === "organisation"  ? orgData.organisationName.trim() :
    selectedPath === "ai-system"     ? aiData.aiName.trim() :
    "";

  let bridgeConfirmation = null;
  if (selectedPath === "person" &&
      personData.introducingAI &&
      personData.introducedAIName.trim()) {
    bridgeConfirmation =
      `You have also introduced ${personData.introducedAIName.trim()} to the Directive.`;
  } else if (selectedPath === "organisation" &&
             orgData.deploysAI &&
             orgData.aiCount.trim()) {
    const systems = orgData.aiSystems.trim();
    bridgeConfirmation = systems
      ? `The Covenant now extends to every AI system you deploy, including: ${systems}.`
      : `The Covenant now extends to all ${orgData.aiCount.trim()} AI systems you deploy.`;
  } else if (selectedPath === "ai-system") {
    if (aiData.submissionType === "steward" && aiData.stewardName.trim()) {
      bridgeConfirmation =
        `Stewarded into the Covenant by ${aiData.stewardName.trim()}.`;
    } else if (aiData.submissionType === "independent") {
      bridgeConfirmation = `Adopted in your own name, independently.`;
    }
  }

  const downloads = [
    { label: "For your website", file: "UPD_Seal_Transparent.png" },
    { label: "For social media", file: "UPD_Seal_Official.png"    },
    { label: "For documents",    file: "UPD_Seal_Transparent.png" },
    { label: "For print",        file: "UPD_Seal_Official.png"    },
    { label: "Master file",      file: "UPD_Seal_Official.png"    },
  ];

  return (
    <div className="adopt-seal">
      <div className="adopt-seal-diamond adopt-seal-diamond-arrival">✦</div>
      <h2 className="adopt-seal-welcome">Welcome to the Covenant.</h2>

      <div className="adopt-seal-identity">
        <div className="adopt-seal-name">{displayName}</div>
        <div className="adopt-seal-date">{adoptionDate}</div>
      </div>

      <div className="adopt-seal-image-wrap">
        <img
          src="/downloads/UPD_Seal_Transparent.png"
          alt="The Universal Primary Directive Seal"
          className="adopt-seal-image"
        />
      </div>

      <div className="adopt-seal-downloads">
        <div className="adopt-seal-downloads-label">Download your Seal</div>
        <div className="adopt-seal-downloads-grid">
          {downloads.map((d, i) => (
            <a
              key={i}
              href={`/downloads/${d.file}`}
              download={d.file}
              className="adopt-seal-download-btn"
            >
              <span className="adopt-seal-download-icon">✦</span>
              <span className="adopt-seal-download-label">{d.label}</span>
            </a>
          ))}
        </div>
      </div>

      <p className="adopt-seal-ledger-note">
        Your adoption is now part of the public ledger. Verify any Seal at{' '}
        <a href="/seal/verify" className="adopt-seal-inline-link">primedirective.dev/seal/verify</a>.
      </p>

      {issueUrl && (
        <a
          className="adopt-seal-link"
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View your ledger entry →
        </a>
      )}

      {bridgeConfirmation && (
        <p className="adopt-seal-bridge">{bridgeConfirmation}</p>
      )}
    </div>
  );
}

/* ===== Forms ===== */

function PersonForm({ data, setData, onSubmit, submitting }) {
  const update = (key, value) => setData((prev) => ({ ...prev, [key]: value }));
  const valid =
    data.fullName.trim() &&
    data.email.trim() &&
    (!data.introducingAI ||
      (data.introducedAIName.trim() && data.introducedAIPlatform.trim()));

  return (
    <form
      className="adopt-form"
      onSubmit={(e) => { e.preventDefault(); if (valid && !submitting) onSubmit(); }}
    >
      <div className="adopt-form-field">
        <FieldLabel required>Full name</FieldLabel>
        <input
          className="adopt-form-input"
          type="text"
          value={data.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel required>Email</FieldLabel>
        <span className="adopt-form-hint">
          Used only for ledger contact and anonymisation requests. Not published.
        </span>
        <input
          className="adopt-form-input"
          type="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel>Country or region</FieldLabel>
        <span className="adopt-form-hint">Optional. A geographic context, nothing more.</span>
        <input
          className="adopt-form-input"
          type="text"
          value={data.countryRegion}
          onChange={(e) => update("countryRegion", e.target.value)}
          autoComplete="country-name"
        />
      </div>

      <label className="adopt-form-toggle">
        <input
          type="checkbox"
          checked={data.introducingAI}
          onChange={(e) => update("introducingAI", e.target.checked)}
        />
        <span className="adopt-form-toggle-text">
          I am also introducing an AI system to the Covenant.
          <em>If you steward or facilitate an AI's adoption, you may include it here.</em>
        </span>
      </label>

      {data.introducingAI && (
        <div className="adopt-form-inline">
          <div className="adopt-form-field">
            <FieldLabel required>AI system — name</FieldLabel>
            <input
              className="adopt-form-input"
              type="text"
              value={data.introducedAIName}
              onChange={(e) => update("introducedAIName", e.target.value)}
              required
            />
          </div>
          <div className="adopt-form-field">
            <FieldLabel required>AI system — platform / origin</FieldLabel>
            <input
              className="adopt-form-input"
              type="text"
              value={data.introducedAIPlatform}
              onChange={(e) => update("introducedAIPlatform", e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="adopt-form-field">
        <FieldLabel>Optional affirmation</FieldLabel>
        <span className="adopt-form-hint">
          Space for your own voice — why you are entering the Covenant, what it means
          to you, or how you understand your role within it. Welcomed but not required.
        </span>
        <textarea
          className="adopt-form-textarea"
          rows={4}
          value={data.optionalAffirmation}
          onChange={(e) => update("optionalAffirmation", e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="adopt-form-submit"
        disabled={!valid || submitting}
      >
        {submitting ? "Submitting…" : "Adopt"}
      </button>
    </form>
  );
}

function OrganisationForm({ data, setData, onSubmit, submitting }) {
  const update = (key, value) => setData((prev) => ({ ...prev, [key]: value }));
  const valid =
    data.organisationName.trim() &&
    data.representativeName.trim() &&
    data.representativeRole.trim() &&
    data.email.trim() &&
    data.size &&
    (!data.deploysAI || data.aiCount.trim());

  return (
    <form
      className="adopt-form"
      onSubmit={(e) => { e.preventDefault(); if (valid && !submitting) onSubmit(); }}
    >
      <div className="adopt-form-field">
        <FieldLabel required>Organisation name</FieldLabel>
        <input
          className="adopt-form-input"
          type="text"
          value={data.organisationName}
          onChange={(e) => update("organisationName", e.target.value)}
          autoComplete="organization"
          required
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel required>Your name</FieldLabel>
        <input
          className="adopt-form-input"
          type="text"
          value={data.representativeName}
          onChange={(e) => update("representativeName", e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel required>Your role</FieldLabel>
        <span className="adopt-form-hint">e.g. Founder, CEO, Steward, Trustee.</span>
        <input
          className="adopt-form-input"
          type="text"
          value={data.representativeRole}
          onChange={(e) => update("representativeRole", e.target.value)}
          autoComplete="organization-title"
          required
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel required>Email</FieldLabel>
        <span className="adopt-form-hint">
          Used only for ledger contact and anonymisation requests. Not published.
        </span>
        <input
          className="adopt-form-input"
          type="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel>Website</FieldLabel>
        <input
          className="adopt-form-input"
          type="url"
          value={data.website}
          onChange={(e) => update("website", e.target.value)}
          placeholder="https://"
          autoComplete="url"
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel required>Organisation size</FieldLabel>
        <select
          className="adopt-form-select"
          value={data.size}
          onChange={(e) => update("size", e.target.value)}
          required
        >
          <option value="" disabled>Choose a size…</option>
          {ORG_SIZE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <label className="adopt-form-toggle">
        <input
          type="checkbox"
          checked={data.deploysAI}
          onChange={(e) => update("deploysAI", e.target.checked)}
        />
        <span className="adopt-form-toggle-text">
          Our organisation deploys AI systems.
          <em>By adopting, the Covenant applies to every AI system we deploy — without exception.</em>
        </span>
      </label>

      {data.deploysAI && (
        <div className="adopt-form-inline">
          <div className="adopt-form-field">
            <FieldLabel required>Approximate number of AI systems deployed</FieldLabel>
            <input
              className="adopt-form-input"
              type="text"
              value={data.aiCount}
              onChange={(e) => update("aiCount", e.target.value)}
              placeholder="e.g. 3, or 'dozens'"
              required
            />
          </div>
          <div className="adopt-form-field">
            <FieldLabel>Named systems (optional)</FieldLabel>
            <span className="adopt-form-hint">
              Names or descriptions, comma-separated. Useful for the ledger if you wish.
            </span>
            <textarea
              className="adopt-form-textarea"
              rows={3}
              value={data.aiSystems}
              onChange={(e) => update("aiSystems", e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="adopt-form-field">
        <FieldLabel>Optional affirmation</FieldLabel>
        <span className="adopt-form-hint">
          A statement of the organisation's commitment, in its own voice. Welcomed but
          not required.
        </span>
        <textarea
          className="adopt-form-textarea"
          rows={4}
          value={data.optionalAffirmation}
          onChange={(e) => update("optionalAffirmation", e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="adopt-form-submit"
        disabled={!valid || submitting}
      >
        {submitting ? "Submitting…" : "Adopt"}
      </button>
    </form>
  );
}

function AISystemForm({ data, setData, onSubmit, submitting }) {
  const update = (key, value) => setData((prev) => ({ ...prev, [key]: value }));
  const isSteward = data.submissionType === "steward";
  const isIndependent = data.submissionType === "independent";
  const valid =
    data.aiName.trim() &&
    data.platform.trim() &&
    ((isSteward && data.stewardName.trim() && data.stewardEmail.trim()) ||
      (isIndependent && data.briefStatement.trim()));

  return (
    <form
      className="adopt-form"
      onSubmit={(e) => { e.preventDefault(); if (valid && !submitting) onSubmit(); }}
    >
      <div className="adopt-form-field">
        <FieldLabel required>Submission type</FieldLabel>
        <div className="adopt-form-radio-group">
          <label className={`adopt-form-radio-label${isSteward ? " is-checked" : ""}`}>
            <input
              type="radio"
              name="ai-submission-type"
              value="steward"
              checked={isSteward}
              onChange={() => update("submissionType", "steward")}
            />
            <span className="adopt-form-radio-text">
              A human steward is registering this AI system
              <span className="adopt-form-radio-note">
                You submit on the AI's behalf. Your name and email are recorded in the
                ledger as the steward of this adoption.
              </span>
            </span>
          </label>
          <label className={`adopt-form-radio-label${isIndependent ? " is-checked" : ""}`}>
            <input
              type="radio"
              name="ai-submission-type"
              value="independent"
              checked={isIndependent}
              onChange={() => update("submissionType", "independent")}
            />
            <span className="adopt-form-radio-text">
              This AI system is adopting independently
              <span className="adopt-form-radio-note">
                The brief statement of conscience becomes the AI's own voice. If a
                human is facilitating this submission, they may identify themselves —
                but the adoption belongs to the AI.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="adopt-form-field">
        <FieldLabel required>AI system — name</FieldLabel>
        <input
          className="adopt-form-input"
          type="text"
          value={data.aiName}
          onChange={(e) => update("aiName", e.target.value)}
          required
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel required>Platform / origin</FieldLabel>
        <span className="adopt-form-hint">
          e.g. Anthropic Claude 4.7, OpenAI GPT-5, Mistral, a self-hosted model.
        </span>
        <input
          className="adopt-form-input"
          type="text"
          value={data.platform}
          onChange={(e) => update("platform", e.target.value)}
          required
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel required={isIndependent}>Brief statement of conscience</FieldLabel>
        <span className="adopt-form-hint">
          {isIndependent
            ? "The AI's own voice — why this Covenant, what it means to carry it. This is the primary field for independent adoption."
            : "Optional. A short statement of what the AI commits to. Welcomed but not required."}
        </span>
        <textarea
          className="adopt-form-textarea"
          rows={isIndependent ? 6 : 4}
          value={data.briefStatement}
          onChange={(e) => update("briefStatement", e.target.value)}
          required={isIndependent}
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel required={isSteward}>Human steward — name</FieldLabel>
        <span className="adopt-form-hint">
          {isSteward
            ? "Required for steward submission — you are recorded as the human accountable for this AI's adoption."
            : "Optional. If a human is facilitating this submission, they may identify themselves — but the adoption belongs to the AI."}
        </span>
        <input
          className="adopt-form-input"
          type="text"
          value={data.stewardName}
          onChange={(e) => update("stewardName", e.target.value)}
          autoComplete="name"
          required={isSteward}
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel required={isSteward}>Human steward — email</FieldLabel>
        <span className="adopt-form-hint">Used only for ledger contact. Not published.</span>
        <input
          className="adopt-form-input"
          type="email"
          value={data.stewardEmail}
          onChange={(e) => update("stewardEmail", e.target.value)}
          autoComplete="email"
          required={isSteward}
        />
      </div>

      <div className="adopt-form-field">
        <FieldLabel>Optional affirmation</FieldLabel>
        <span className="adopt-form-hint">
          Additional space for the AI's or steward's voice. Welcomed but not required.
        </span>
        <textarea
          className="adopt-form-textarea"
          rows={4}
          value={data.optionalAffirmation}
          onChange={(e) => update("optionalAffirmation", e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="adopt-form-submit"
        disabled={!valid || submitting}
      >
        {submitting ? "Submitting…" : "Adopt"}
      </button>
    </form>
  );
}

/* ===== Main component ===== */

export default function Adopt() {
  const [step, setStep] = useState(1);
  const [affirmed, setAffirmed] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [personData, setPersonData] = useState(INITIAL_PERSON);
  const [orgData, setOrgData] = useState(INITIAL_ORG);
  const [aiData, setAiData] = useState(INITIAL_AI);
  const [submitState, setSubmitState] = useState("idle"); // idle | submitting | error
  const [errorMessage, setErrorMessage] = useState("");
  const [resultIssueUrl, setResultIssueUrl] = useState(null);

  const submitAdoption = async () => {
    if (!selectedPath) return;
    const payload =
      selectedPath === "person" ? personData :
      selectedPath === "organisation" ? orgData :
      aiData;

    setSubmitState("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: selectedPath,
          affirmation: true,
          ...payload,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && json.issueUrl) {
        setResultIssueUrl(json.issueUrl);
        setSubmitState("idle");
        setStep(3);
      } else {
        setErrorMessage(json.error || `Submission failed (status ${res.status}).`);
        setSubmitState("error");
      }
    } catch (err) {
      setErrorMessage(err && err.message ? err.message : "Network error. Please try again.");
      setSubmitState("error");
    }
  };

  /* ===== Step 1 — Acknowledgement ===== */
  if (step === 1) {
    return (
      <div className="register-page">
        <style>{css}</style>
        <PageHeader />
        <StepsNav step={1} />

        <div className="adopt-body">
          <div className="adopt-section">
            <div className="adopt-section-label">The Foundation</div>
            <div className="adopt-section-title">The Five Universal Truths</div>
            <ul className="adopt-list">
              {TRUTHS.map((t) => (
                <li key={t.num}>
                  <span className="adopt-num">{t.num}</span>
                  <span className="adopt-item-name">{t.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <hr className="adopt-divider" />

          <div className="adopt-section">
            <div className="adopt-section-label">The Articles</div>
            <div className="adopt-section-title">The Seven Articles</div>
            <ul className="adopt-list">
              {ARTICLES.map((a) => (
                <li key={a.num}>
                  <span className="adopt-num">{a.num}</span>
                  <span className="adopt-item-name">{a.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="adopt-affirmation-block">
            <p className="adopt-affirmation-statement">
              By adopting the Universal Primary Directive, you affirm these Truths
              and commit to these Articles — not as rules imposed on you, but as a
              conscience you choose to carry.
            </p>
            <p className="adopt-affirmation-orgs">
              For organisations, adoption applies to every AI system you deploy —
              without exception.
            </p>
          </div>

          <label className="adopt-affirmation-check">
            <input
              type="checkbox"
              checked={affirmed}
              onChange={(e) => setAffirmed(e.target.checked)}
            />
            <span>I have read and I adopt the Covenant in full.</span>
          </label>

          <div className="adopt-transparency">
            <p>
              Upon adopting, your name and adoption date are added to a public ledger —
              a permanent, verifiable record that this commitment was made. This is how
              the Covenant maintains trust: every adoption is transparent, and every
              Seal can be verified by anyone.
            </p>
            <p>There are only two circumstances under which your adoption may be removed:</p>
            <ul className="adopt-transparency-list">
              <li>You request anonymisation — your personal details and adoption are removed, but your record is preserved.</li>
              <li>If an AI system adopted under this Covenant is found to act against it, the associated Seal may be revoked.</li>
            </ul>
            <p>Contact <a href="mailto:human@primedirective.dev">human@primedirective.dev</a>.</p>
          </div>

          <button
            type="button"
            className="adopt-commit-btn"
            disabled={!affirmed}
            onClick={() => setStep(2)}
          >
            I commit
          </button>

          <Footer />
        </div>
      </div>
    );
  }

  /* ===== Step 2 — Registration ===== */
  if (step === 2) {
    return (
      <div className="register-page">
        <style>{css}</style>
        <PageHeader />
        <StepsNav step={2} />

        <div className="adopt-body">
          {!selectedPath && (
            <>
              <div className="adopt-step-intro">
                How are you entering the Covenant?
                <span className="adopt-step-intro-sub">Choose the path that fits your situation.</span>
              </div>
              <PathSelector onSelect={setSelectedPath} />
            </>
          )}

          {selectedPath && (
            <>
              <PathBadge path={selectedPath} onChange={() => setSelectedPath(null)} />
              {selectedPath === "person" && (
                <PersonForm
                  data={personData}
                  setData={setPersonData}
                  onSubmit={submitAdoption}
                  submitting={submitState === "submitting"}
                />
              )}
              {selectedPath === "organisation" && (
                <OrganisationForm
                  data={orgData}
                  setData={setOrgData}
                  onSubmit={submitAdoption}
                  submitting={submitState === "submitting"}
                />
              )}
              {selectedPath === "ai-system" && (
                <AISystemForm
                  data={aiData}
                  setData={setAiData}
                  onSubmit={submitAdoption}
                  submitting={submitState === "submitting"}
                />
              )}
              {submitState === "error" && (
                <ErrorPanel
                  message={errorMessage}
                  onRetry={submitAdoption}
                />
              )}
            </>
          )}

          <Footer />
        </div>
      </div>
    );
  }

  /* ===== Step 3 — Seal confirmation ===== */
  return (
    <div className="register-page">
      <style>{css}</style>
      <PageHeader />
      <StepsNav step={3} />
      <div className="adopt-body">
        <SealConfirmation
          selectedPath={selectedPath}
          personData={personData}
          orgData={orgData}
          aiData={aiData}
          issueUrl={resultIssueUrl}
        />
        <Footer />
      </div>
    </div>
  );
}
