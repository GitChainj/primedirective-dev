# Brand Guide — primedirective.dev

This document is the canonical reference for the Universal Primary Directive's visual identity. It is a summary of the full Brand Guide (Word document) maintained by the founding steward; consult this file when making any decision about colours, marks, typography, or visual identity in the codebase.

> *The principle is simple: the full Guilloché Seal is the coat of arms; the certification marks are the monogram. Both say the same thing at different scales.*

---

## The Six Marks

The visual system has six marks: the Ceremonial Seal at the top, plus five certification/identity marks. All six are unified by a four-pointed gold sparkle on deep navy, with five gold dots representing the Five Truths.

### Mark Hierarchy

| Tier | Purpose | Marks |
|---|---|---|
| **Tier 1 — Ceremonial** | Maximum impact, used sparingly | Mark 6: Ceremonial Seal (Guilloché circle) |
| **Tier 2 — Certification** | Everyday signalling of UPD alignment | Mark 1: Diamond, Mark 2: Inline Badge (Lozenge) |
| **Tier 3 — Identity** | Ambient presence | Mark 3: Favicon (Circle), Mark 4: App Icon (Square), Mark 5: Watermark (Sparkle only) |

### Mark Details

**Mark 1 — Primary Certification (Diamond)**
Diamond shape (square rotated 45°), navy interior with Guilloché overlay, gold sparkle, "UPD Verified" on sparkle, five gold dots arc beneath. Used for websites, documents, presentations, social posts, stickers, enamel pins. Unique among certification marks.

**Mark 2 — Inline Badge (Lozenge/Pill)**
Horizontal capsule shape, navy interior, gold sparkle + five dots on left, divider, "UNIVERSAL PRIMARY DIRECTIVE / VERIFIED ALIGNED. FIVE TRUTHS HONOURED" on right. ~4:1 aspect ratio. For website footers, email signatures, alongside other certifications (B-Corp, SOC 2, etc).

**Mark 3 — Favicon (Circle)**
Circle, navy with subtle Guilloché, large gold sparkle. For browser tabs and bookmarks. At 16-24px only the sparkle is visible. Sizes: 16, 32, 48, 180 (Apple touch), 512px + favicon.ico.

**Mark 4 — App Icon (Square)**
Square with rounded corners (~12% radius), navy with Guilloché, gold sparkle. For social media profiles, app icons, Slack/Discord avatars. Sizes: 512, 1024px.

**Mark 5 — Watermark (Sparkle only)**
No container — the sparkle itself is the mark. Five dots arc beneath, "UPD Verified" below. Three colour variants: gold, white, navy. For letterheads, document watermarks (15-20% opacity), single-colour printing, embossing.

**Mark 6 — Ceremonial Seal (Guilloché Circle)**
Full ceremonial credential. Circle with organic Guilloché outer rings, four layers of mathematical Guilloché in gold (6-15% opacity), large gold sparkle centre, "THE UNIVERSAL PRIMARY / DIRECTIVE" stacked text, "ESTABLISHED 2026", Safe Words ("WAVE · SUNRISE · MIRROR · OCEAN · RIPPLE"), micro-text running clockwise on inner edge, eight cardinal/intercardinal dots, three thin outer rings. For the website's parallax Seal section, formal certificates, downloadable credentials.

### Parallax Layer Order (Mark 6)

12 transparent PNGs at matching canvas size, used in `InteractiveSeal.jsx`:

| Layer | Content | Depth |
|---|---|---|
| `png-01.png` | AI Sparkle (innermost — stationary) | 0.0 |
| `png-02.png` | Inner circle with micro-text | 0.15 |
| `png-03.png` to `png-11.png` | Guilloché pattern layers, building outward | 0.4 to 3.5 |
| `png-12.png` | Outermost rings (maximum movement) | 4.0 |

---

## Colour Palette

| Name | Hex | RGB | Usage |
|---|---|---|---|
| Deep Navy | `#0A1628` | 10, 22, 40 | Darkest backgrounds, hero sections, mark interiors |
| Ocean | `#12243D` | 18, 36, 61 | Section backgrounds, gradients |
| Midnight Blue | `#1B3A5C` | 27, 58, 92 | Headings, titles, primary text, form theme |
| Covenant Gold | `#D4A853` | 212, 168, 83 | Primary accent, sparkle, buttons, mark outlines |
| Light Gold | `#F0D48A` | 240, 212, 138 | Hover states, highlights, sparkle gradient light |
| Dark Gold | `#B8912F` | 184, 145, 47 | Sparkle gradient dark, mark border emphasis |
| Warm Cream | `#F5F0E8` | 245, 240, 232 | Warm section backgrounds, form backgrounds |
| Page Cream | `#FAF7F2` | 250, 247, 242 | Main page background |
| Body Text | `#1A1A1A` | 26, 26, 26 | Primary body text |
| Light Text | `#6B7280` | 107, 114, 128 | Secondary text, descriptions |
| Accent Teal | `#3A6B8C` | 58, 107, 140 | Quotes, dividers, subtle accents |
| Sky Blue | `#2E6B9E` | 46, 107, 158 | Links, hover states |
| Subheading Blue | `#2E5A7E` | 46, 90, 126 | Subheadings, secondary titles |

---

## Typography

| Font | Role | Usage |
|---|---|---|
| **Cormorant Garamond** | Display / Serif | Headings, titles, quotes, hero text, section labels, mark text. Weights: 300–700. |
| **DM Sans** | Body / Sans-serif | Body text, descriptions, buttons, form labels, navigation. Weights: 300–700. |
| **JetBrains Mono** | Code / Monospace | AI section, code blocks, Safe Word labels, technical references. |

---

## CSS Variables Reference

All components use these named variables, currently duplicated across `App.jsx` and `DonatePage.jsx`. Preserve this duplication unless explicitly asked to consolidate.

```css
:root {
  --deep: #0A1628;        /* Deep Navy */
  --ocean: #12243D;       /* Ocean */
  --mid: #1B3A5C;         /* Midnight Blue */
  --sky: #2E6B9E;         /* Sky Blue */
  --gold: #D4A853;        /* Covenant Gold */
  --gold-light: #F0D48A;  /* Light Gold */
  --gold-dark: #B8912F;   /* Dark Gold */
  --warm: #F5F0E8;        /* Warm Cream */
  --cream: #FAF7F2;       /* Page Cream */
  --text: #1A1A1A;        /* Body Text */
  --text-light: #6B7280;  /* Light Text */
  --accent: #3A6B8C;      /* Accent Teal */
  --sub: #2E5A7E;         /* Subheading Blue */

  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}
```

---

## Usage Rules

### Do

- Use marks at the sizes and formats specified in this guide.
- Maintain clear space around each mark (minimum: width of one sparkle point).
- Use the provided colour variants for different background contexts.
- Scale marks proportionally — never stretch or distort.
- Use the Ceremonial Seal (Mark 6) only for verified ceremonial contexts.
- Use the certification marks (Marks 1-2) only after completing the Seal verification process at primedirective.dev.

### Do Not

- Do not alter the colours of any mark.
- Do not rotate any mark (except the Diamond, which is designed at 45°).
- Do not add effects (shadows, glows, outlines) to any mark.
- Do not place marks on busy backgrounds that compromise legibility.
- Do not use the Ceremonial Seal at sizes below 200px — use a certification mark instead.
- Do not recreate or approximate any mark — use only official files.
- Do not display any certification mark without completing the verification process.

---

## Asset Locations in the Repo

| Asset | Location |
|---|---|
| Ceremonial Seal (current) | `public/downloads/UPD_Seal_Official.png` (when uploaded) |
| Ceremonial Seal (transparent) | `public/downloads/UPD_Seal_Transparent.png` (when uploaded) |
| Parallax layers (Mark 6) | `public/downloads/png-01.png` … `png-12.png` |
| Favicon | `public/favicon.ico` (when generated) |
| Apple touch icon | `public/apple-touch-icon.png` (180×180, when generated) |
| Brand sheet | `public/downloads/UPD_Brand_Sheet.png` (when uploaded) |

When new mark files are added, this section should be updated to reflect their locations.

---

*The full Brand Guide (Word document) is maintained externally by the founding steward as the canonical, versioned reference. This `BRAND.md` is its living summary inside the codebase, optimised for use by Claude Code and any developer working on the website.*
