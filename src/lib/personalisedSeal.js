// SVG field-injection for the personalised Trust Seals & Marks.
// Self-configuring: it reads each template's own geometry (positions + font
// sizes) from the SVG, so the SAME function fills marks AND ceremonial seals,
// in vertical and horizontal compositions, without hardcoded per-template maths.
//
// Pure string transform — no React — so it can be unit-verified and reused by
// both the inline renderer and the PNG (canvas) export.

const XML_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const escapeXml = (s) => String(s).replace(/[&<>"]/g, (c) => XML_ESC[c]);

// DM Sans is loaded site-wide (700). Reference stays monospace unless refSans.
const SANS_STACK = "'DM Sans',sans-serif";
const MONO_STACK = "'Consolas','Monaco','Courier New',monospace";

const PLACE = { name: "ADOPTER NAME", date: "ADOPTION DATE", ref: "VERIFICATION REF" };

// Rough advance width for all-caps DM Sans (~0.60em) plus letter-spacing (~3).
const estWidth = (t, fs) => t.length * 0.60 * fs + Math.max(0, t.length - 1) * 3;

function wrapWords(text, maxW, fs) {
  const lines = [];
  let cur = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const trial = cur ? `${cur} ${w}` : w;
    if (!cur || estWidth(trial, fs) <= maxW) cur = trial;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Illustrator reuses generic ids (SVGID_2_…) and .st* class names in every
// export. Inlining several seals in one document makes their <style> classes
// and url(#…) clip references collide globally. Scope both to a per-instance
// uid so each rendered seal is self-contained.
function scopeSvg(svg, uid) {
  for (const id of new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))) {
    const e = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    svg = svg
      .replace(new RegExp(`\\bid="${e}"`, "g"), `id="${id}_${uid}"`)
      .replace(new RegExp(`url\\(#${e}\\)`, "g"), `url(#${id}_${uid})`)
      .replace(new RegExp(`(xlink:href|href)="#${e}"`, "g"), `$1="#${id}_${uid}"`);
  }
  svg = svg.replace(/<style[^>]*>[\s\S]*?<\/style>/, (m) => m.replace(/\.st(\d+)\b/g, `.st$1_${uid}`));
  svg = svg.replace(/class="([^"]+)"/g, (_m, cls) => `class="${cls.replace(/\bst(\d+)\b/g, `st$1_${uid}`)}"`);
  return svg;
}

let _seq = 0;

function fixFonts(svg, refSans) {
  return svg
    .replace(/font-family:\s*'Georgia-Bold'\s*;?/g, `font-family:${SANS_STACK};font-weight:700;`)
    .replace(/font-family:\s*'Consolas-Bold'\s*;?/g,
      refSans ? `font-family:${SANS_STACK};font-weight:700;` : `font-family:${MONO_STACK};font-weight:700;`);
}

// class -> font-size(px) from the <style> block
function fontSizeMap(svg) {
  const style = (svg.match(/<style[^>]*>([\s\S]*?)<\/style>/) || [, ""])[1];
  const map = {};
  for (const m of style.matchAll(/\.(st\d+)\s*{[^}]*font-size:\s*([\d.]+)px/g)) map[m[1]] = parseFloat(m[2]);
  return map;
}

// Locate a placeholder <text> and read its transform x/y, classes, font-size.
function readField(svg, placeholder, fsMap) {
  const m = svg.match(new RegExp(`<text\\b([^>]*)>${placeholder}</text>`));
  if (!m) return null;
  const attrs = m[1];
  const tr = attrs.match(/matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)/);
  const cls = (attrs.match(/class="([^"]+)"/) || [, ""])[1];
  const fs = cls.split(/\s+/).map((c) => fsMap[c]).find((v) => v != null) || 16;
  return { attrs, tx: tr ? +tr[1] : 0, ty: tr ? +tr[2] : 0, fs };
}

export function injectSeal(svg, { name, date, reference, orientation, refSans = false, fill = null, uid }) {
  const scope = uid || `s${(_seq++).toString(36)}`;
  let out = fixFonts(svg, refSans);
  const vb = out.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const W = +vb[1], H = +vb[2];
  const fsMap = fontSizeMap(svg);

  const N = readField(svg, PLACE.name, fsMap);
  const D = readField(svg, PLACE.date, fsMap);
  const R = readField(svg, PLACE.ref, fsMap);

  const vertical = orientation === "vertical";
  const anchorX = vertical ? W / 2 : N.tx;      // centre under mark, or designer's left block
  const anchorAttr = vertical ? ' text-anchor="middle"' : "";
  const styleAttr = fill ? ` style="fill:${fill}"` : "";   // inline style beats the class fill

  // NAME wrapping + original inter-field gaps (preserved).
  const maxW = vertical ? W * 0.82 : W - N.tx - 24;
  const lines = wrapWords(String(name).toUpperCase(), maxW, N.fs);
  const nameLH = N.fs * 1.2;
  const shift = (lines.length - 1) * nameLH;
  const gapND = D.ty - N.ty;
  const gapDR = R.ty - D.ty;
  const span = shift + gapND + gapDR;           // first name baseline -> ref baseline

  // First name baseline: horizontal recentres the whole group on the mark's
  // vertical midpoint (H/2); vertical keeps the designer's baseline and grows down.
  const firstBaseline = vertical ? N.ty : (H / 2 - span / 2 + 0.30 * N.fs);
  const dateY = firstBaseline + shift + gapND;
  const refY = dateY + gapDR;

  const buildText = (field, y, value, isMulti) => {
    const anchor = anchorAttr;
    const cls = (field.attrs.match(/class="[^"]+"/) || [""])[0];
    const clsAttr = cls ? ` ${cls}` : "";
    if (isMulti) {
      const tspans = lines
        .map((ln, i) => `<tspan x="${anchorX}" dy="${i === 0 ? 0 : nameLH}">${escapeXml(ln)}</tspan>`)
        .join("");
      return `<text transform="matrix(1 0 0 1 0 ${y})"${clsAttr}${anchor}${styleAttr}>${tspans}</text>`;
    }
    return `<text transform="matrix(1 0 0 1 ${anchorX} ${y})"${clsAttr}${anchor}${styleAttr}>${escapeXml(value)}</text>`;
  };

  const nameEl = buildText(N, firstBaseline, "", true);
  const dateEl = buildText(D, dateY, String(date).toUpperCase(), false);
  const refEl = buildText(R, refY, String(reference), false);

  // Remove the placeholders from their original (early) position — where later
  // artwork paints over them — and re-append on top just before </svg>.
  out = out.replace(new RegExp(`<text\\b[^>]*>${PLACE.name}</text>`), "");
  out = out.replace(new RegExp(`<text\\b[^>]*>${PLACE.date}</text>`), "");
  out = out.replace(new RegExp(`<text\\b[^>]*>${PLACE.ref}</text>`), "");

  // Vertical: if a wrapped block would fall past the bottom, extend the viewBox.
  if (vertical) {
    const bottom = refY + R.fs * 0.4;
    if (bottom > H) {
      const nh = Math.ceil(bottom + 16);
      out = out.replace(/viewBox="0 0 [\d.]+ [\d.]+"/, `viewBox="0 0 ${W} ${nh}"`);
    }
  }

  out = out.replace("</svg>", `<g id="adopter-fields">${nameEl}${dateEl}${refEl}</g></svg>`);
  return scopeSvg(out, scope);
}
