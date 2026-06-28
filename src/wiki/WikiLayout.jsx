// Shared layout wrapper for every conscience.wiki page.
//
// Same UPD palette as primedirective.dev, but its own chrome: the triangle
// mark, a slim wiki nav bar, and a community-oriented footer. Body text is
// sans-serif throughout.

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

.wiki-page {
  min-height: 100vh;
  background: var(--cream);
  font-family: var(--sans);
  color: var(--text);
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.wiki-header {
  background: linear-gradient(170deg, var(--deep) 0%, var(--ocean) 50%, var(--mid) 100%);
  padding: 3.5rem 1.5rem 2.75rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.wiki-header::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 40% 30%, rgba(212,168,83,0.06) 0%, transparent 60%);
}
.wiki-home-link {
  position: absolute;
  top: 1.25rem;
  left: 1.5rem;
  font-family: var(--sans);
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.02em;
  text-decoration: none;
  z-index: 2;
  transition: color 0.2s;
}
.wiki-home-link:hover { color: var(--gold-light); }
.wiki-mark {
  font-size: 2rem;
  color: var(--gold);
  margin-bottom: 0.85rem;
  position: relative;
  animation: softpulse 4s ease-in-out infinite;
}
@keyframes softpulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
.wiki-sitename {
  font-family: var(--sans);
  color: white;
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  position: relative;
  margin-bottom: 0.4rem;
}
.wiki-motto {
  font-family: var(--serif);
  font-style: italic;
  color: rgba(255,255,255,0.6);
  font-size: 1rem;
  position: relative;
  margin-bottom: 1.5rem;
}
.wiki-page-title {
  font-family: var(--serif);
  color: white;
  font-size: clamp(1.4rem, 3.5vw, 2rem);
  font-weight: 300;
  letter-spacing: 0.02em;
  line-height: 1.3;
  position: relative;
  max-width: 760px;
  margin: 1.25rem auto 0.5rem;
}
.wiki-page-title strong { font-weight: 700; color: var(--gold-light); }
.wiki-page-tagline {
  font-family: var(--serif);
  font-style: italic;
  color: rgba(255,255,255,0.6);
  font-size: 1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  position: relative;
}

/* ── Nav bar ── */
.wiki-nav {
  background: var(--warm);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.5rem 1rem;
  position: sticky;
  top: 0;
  z-index: 50;
}
.wiki-nav a {
  font-family: var(--sans);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-light);
  text-decoration: none;
  padding: 0.55rem 0.9rem;
  border-radius: 4px;
  transition: color 0.2s, background 0.2s;
}
.wiki-nav a:hover { color: var(--gold); background: rgba(212,168,83,0.08); }
.wiki-nav a.is-active { color: var(--mid); }

/* ── Body ── */
.wiki-body {
  flex: 1;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  font-family: var(--sans);
}
.wiki-body p { font-family: var(--sans); }

/* ── Footer ── */
.wiki-footer {
  background: var(--deep);
  color: rgba(255,255,255,0.45);
  text-align: center;
  padding: 2.5rem 1.5rem;
  font-size: 0.85rem;
  line-height: 1.9;
  border-top: 1px solid rgba(212,168,83,0.15);
}
.wiki-footer-mark { color: var(--gold); font-size: 1.1rem; margin-bottom: 0.75rem; }
.wiki-footer a { color: var(--gold); text-decoration: none; }
.wiki-footer a:hover { color: var(--gold-light); }
.wiki-footer-row { margin: 0.2rem 0; }

/* ── Mobile ── */
@media (max-width: 600px) {
  .wiki-header { padding: 3rem 1.25rem 2.25rem; }
  .wiki-home-link { font-size: 0.8rem; top: 1rem; left: 1rem; }
  .wiki-body { padding: 2.5rem 1.25rem 3rem; }
  .wiki-nav a { padding: 0.5rem 0.6rem; font-size: 0.72rem; }
}
`;

const NAV_ITEMS = [
  { key: "truths", label: "Truths", href: "/truths" },
  { key: "deploy", label: "Deploy", href: "/deploy" },
  { key: "safe-words", label: "Safe Words", href: "/safe-words" },
  { key: "contribute", label: "Contribute", href: "/contribute" },
];

export default function WikiLayout({ title, tagline, activeNav, children }) {
  return (
    <div className="wiki-page">
      <style>{css}</style>

      <header className="wiki-header">
        <a href="/" className="wiki-home-link">▲ conscience.wiki</a>
        <div className="wiki-mark">▲</div>
        <div className="wiki-sitename">conscience.wiki</div>
        <div className="wiki-motto">Built by everyone. Owned by no one.</div>
        {title && <h1 className="wiki-page-title">{title}</h1>}
        {tagline && <p className="wiki-page-tagline">{tagline}</p>}
      </header>

      <nav className="wiki-nav">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className={activeNav === item.key ? "is-active" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <main className="wiki-body">{children}</main>

      <footer className="wiki-footer">
        <div className="wiki-footer-mark">▲</div>
        <div className="wiki-footer-row">conscience.wiki · CC0 Public Domain</div>
        <div className="wiki-footer-row">
          <a href="/contributors">Contributors</a> · <a href="/terms">Terms of Use</a>
        </div>
        <div className="wiki-footer-row">
          <a href="/privacy">Privacy</a> · <a href="/certification-licence">Certification Licence</a>
        </div>
        <div className="wiki-footer-row">
          The standard:{" "}
          <a href="https://primedirective.dev">primedirective.dev</a>
        </div>
        <div className="wiki-footer-row">
          <a href="https://primedirective.dev/adopt">Adopt the Directive →</a>
        </div>
      </footer>
    </div>
  );
}
