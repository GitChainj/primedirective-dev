// src/signals/signalsStyles.js
// Shared styles for the Signals index and post (site design language: navy/gold,
// Cormorant Garamond + DM Sans + JetBrains Mono). Injected via <style> in each
// component, matching the project's per-component inline-CSS convention.

export const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --deep: #0a1628; --ocean: #12243d; --mid: #1b3a5c; --sky: #2e6b9e;
  --gold: #d4a853; --gold-light: #f0d48a; --cream: #faf7f2;
  --text: #1a1a1a; --text-light: #6b7280;
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }

.sig-page { min-height: 100vh; background: var(--cream); font-family: var(--sans); color: var(--text); }

.sig-header {
  background: linear-gradient(170deg, var(--deep) 0%, var(--ocean) 50%, var(--mid) 100%);
  padding: 4rem 1.5rem 3rem; text-align: center; position: relative; overflow: hidden;
}
.sig-header::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 40% 30%, rgba(212,168,83,0.06) 0%, transparent 60%);
}
.sig-home {
  position: absolute; top: 1.25rem; left: 1.5rem; z-index: 2;
  font-family: var(--serif); font-size: 0.9rem; letter-spacing: 0.04em;
  color: rgba(255,255,255,0.55); text-decoration: none; transition: color 0.2s;
  display: inline-flex; align-items: center;
}
.sig-home:hover { color: var(--gold-light); }
.sig-mark { margin-bottom: 1rem; position: relative; animation: sig-pulse 4s ease-in-out infinite; }
@keyframes sig-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
.sig-eyebrow {
  position: relative; font-size: 0.72rem; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--gold); font-weight: 600; margin-bottom: 0.6rem;
}
.sig-header h1 {
  position: relative; font-family: var(--serif); color: white; font-weight: 300;
  font-size: clamp(1.8rem, 4.5vw, 2.6rem); letter-spacing: 0.02em; line-height: 1.25;
  max-width: 760px; margin: 0 auto 0.75rem;
}
.sig-header h1 strong { font-weight: 700; color: var(--gold-light); }
.sig-header .sig-tagline {
  position: relative; font-family: var(--serif); font-style: italic;
  color: rgba(255,255,255,0.65); font-size: 1.05rem; max-width: 620px; margin: 0 auto; line-height: 1.6;
}
.sig-date {
  position: relative; font-family: var(--mono); font-size: 0.8rem; letter-spacing: 0.08em;
  color: rgba(240,212,138,0.85); margin-top: 0.9rem;
}

.sig-body { max-width: 720px; margin: 0 auto; padding: 3rem 1.5rem 4rem; }

/* Index list */
.sig-list { display: flex; flex-direction: column; gap: 1.25rem; }
.sig-card {
  display: block; text-decoration: none; color: inherit;
  background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  padding: 1.5rem 1.6rem; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.sig-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(10,22,40,0.08); border-color: rgba(212,168,83,0.4); }
.sig-card-date { font-family: var(--mono); font-size: 0.75rem; letter-spacing: 0.06em; color: var(--text-light); }
.sig-card-title { font-family: var(--serif); font-weight: 600; font-size: 1.5rem; color: var(--mid); margin: 0.3rem 0 0.5rem; line-height: 1.2; }
.sig-card-excerpt { font-size: 1rem; line-height: 1.65; color: var(--text); }
.sig-card-more { display: inline-block; margin-top: 0.8rem; color: var(--sky); font-size: 0.9rem; }
.sig-card:hover .sig-card-more { color: var(--gold); }

/* Post body */
.sig-post p { font-size: 1.1rem; line-height: 1.8; color: var(--text); margin-bottom: 1.25rem; white-space: pre-line; }
.sig-post p:last-child { margin-bottom: 0; }
.sig-canonical {
  margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(0,0,0,0.08);
  font-family: var(--mono); font-size: 0.8rem; color: var(--text-light); word-break: break-word;
}
.sig-canonical a { color: var(--sky); text-decoration: none; }

.sig-footer { text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(0,0,0,0.08); }
.sig-footer a { color: var(--sky); text-decoration: none; font-size: 0.85rem; }
.sig-footer p { color: var(--text-light); font-size: 0.75rem; margin-top: 0.5rem; }

@media (max-width: 600px) { .sig-body { padding: 2.5rem 1.25rem 3rem; } .sig-card-title { font-size: 1.3rem; } }
`;
