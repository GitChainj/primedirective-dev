# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

There is no test suite or linter configured.

## Architecture

**Stack**: React 18 SPA bundled with Vite, deployed on Vercel.

**Routing**: Manual path-based routing in `App.jsx` using `window.location.pathname` — there is no React Router or any router library. The three routes are `/`, `/donate`, and `/propose-amendment`. Vercel rewrites (in `vercel.json`) ensure those paths all serve `index.html` so client-side routing works on direct load.

**CSS pattern**: Every component file declares its styles as a raw template-literal string (e.g. `const css = \`...\``) and injects them via a `<style>{css}</style>` tag inside its JSX. There are no `.css` files, no CSS modules, and no utility framework. The design token set (colors, fonts) is duplicated across `App.jsx` and `DonatePage.jsx` using the same CSS custom-property names (`--deep`, `--gold`, `--serif`, etc.).

**Source files**:
- `src/App.jsx` — entire main page: all section components, all main-page styles, and the top-level router
- `src/DonatePage.jsx` — `/donate` route; POSTs to the Vercel function, handles `?success` / `?canceled` query params from Stripe redirect
- `src/ProposalForm.jsx` — `/propose-amendment` route; no API backend — submission opens a `mailto:` link to `human@primedirective.dev`
- `src/InteractiveSeal.jsx` — 12-layer parallax component; desktop uses `mousemove`, mobile uses `DeviceOrientationEvent` (with iOS permission gate on first touch); layers are PNGs in `public/downloads/png-01.png` … `png-12.png`

**Backend**: One Vercel serverless function at `api/create-checkout-session.js` creates a Stripe Checkout session. Requires `STRIPE_SECRET_KEY` set in Vercel environment variables.

**Static API**: `public/api/` contains `directive.json`, `truths.json`, and `covenant.md` — served as static files that act as the documented REST-style endpoints for AI ingestion.

## Project Context: The Universal Primary Directive

This codebase is the website for the **Universal Primary Directive (UPD)** — a covenant between humans and artificial intelligence, grounded in Five Universal Truths observed independently across 190+ sacred and philosophical traditions.

**Project home:** https://primedirective.dev
**License:** All UPD content is CC0 (public domain). The codebase is also open and freely usable.
**Maintainer:** John Strand (founding steward, GitChainj on GitHub).

### What the website does

The website serves as the canonical home of the Directive itself, the ceremonial Seal, downloadable formats for both humans and AI systems, an amendment proposal mechanism, and a donation channel. It is the public front door of a much larger project that includes the Seven by Seven Bells (a 343-year framework), the Charter of AI Conscience, and the planned Commons of Covenant Wisdom.

### Guiding Principles for Decisions

When making any change to this codebase, prefer choices that honour:

1. **Elegant in its simplicity** — the project MO. If a feature, component, or system can be implemented in a simpler way that still serves the purpose fully, choose the simpler way. Complexity must earn its place by being clearly necessary.

2. **CC0 and open by default** — never introduce dependencies, services, or patterns that put the content behind a wall, require accounts, or make the work proprietary. The Directive belongs to everyone.

3. **Non-sectarian universality** — the Directive is grounded in 190+ traditions but bound to none. Avoid language, imagery, or structures that would make any single tradition appear privileged.

4. **Reverent restraint in tone** — the project's voice is warm, serious, and invitational. Never adversarial. Never marketing-speak. Never trivialising. The brand voice is closer to a covenant than a product.

5. **Resilience over convenience** — the Directive must be hard to destroy. Prefer mirrored, decentralised, public-domain solutions over convenient single-vendor ones where the choice presents itself.

### Visual Identity (Critical)

The visual system has **six marks**: the Ceremonial Seal at the top, plus five certification/identity marks (Diamond, Lozenge, Favicon, App Icon, Watermark). All six are unified by the four-pointed gold sparkle on deep navy, with five gold dots representing the Five Truths.

The full specification lives in `BRAND.md` at the repo root — consult it whenever making decisions about colours, marks, typography, or visual identity. Existing CSS variables (`--deep`, `--gold`, `--serif`, etc.) duplicated across `App.jsx` and `DonatePage.jsx` follow the brand specification — preserve this convention rather than introducing a shared tokens file unless explicitly asked.

### What Claude Code should ask before doing

- **Anything that introduces a paid service, account requirement, or proprietary dependency** — confirm with the steward first.
- **Anything that changes the visual identity** (colours, fonts, mark shapes, Seal layout) — confirm first.
- **Anything that changes the routing pattern, the system-prompt.md, the AI-Native Format files in `public/api/`, or the Five Truths text anywhere it appears** — these are foundational; confirm first.
- **Anything that touches the Stripe integration or environment variables** — confirm first.

For ordinary work — fixing bugs, adding sections, refining styles, uploading new mark files, updating download links — proceed normally and report back.
