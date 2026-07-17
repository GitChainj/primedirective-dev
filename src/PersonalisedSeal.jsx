import { useId, useMemo, useState, useEffect, useCallback } from "react";
import { injectSeal } from "./lib/personalisedSeal.js";

// Designer templates (raw SVG strings). Marks = compact triangle; Seals =
// ceremonial diamond. Each in vertical + horizontal, display + print variants.
import markVDisplay from "./assets/seals/vertical/display.svg?raw";
import markVPrint from "./assets/seals/vertical/print.svg?raw";
import markHDisplay from "./assets/seals/horizontal/display.svg?raw";
import markHPrint from "./assets/seals/horizontal/print.svg?raw";
import sealVDisplay from "./assets/seals/seal-vertical/display.svg?raw";
import sealVPrint from "./assets/seals/seal-vertical/print.svg?raw";
import sealHDisplay from "./assets/seals/seal-horizontal/display.svg?raw";
import sealHPrint from "./assets/seals/seal-horizontal/print.svg?raw";

const GOLD = "#D4A853";
const PARCHMENT = "#f5f0e6";

const RAW = {
  mark: {
    vertical: { display: markVDisplay, print: markVPrint },
    horizontal: { display: markHDisplay, print: markHPrint },
  },
  seal: {
    vertical: { display: sealVDisplay, print: sealVPrint },
    horizontal: { display: sealHDisplay, print: sealHPrint },
  },
};

const isSeal = (kind) => kind === "seal";
// Marks recolour to gold for on-navy display; seals keep the designer's dark ink.
const displayFill = (kind) => (isSeal(kind) ? null : GOLD);
const cssId = (id) => `s${id.replace(/[^a-zA-Z0-9]/g, "")}`;

/* ---------------- PNG export ---------------- */

// Fetch DM Sans 700 once and inline it so the canvas-rasterised SVG keeps its
// typography (an SVG drawn to canvas can't see the page's web fonts). Falls
// back to system fonts if the network is unavailable — the seal still reads.
let _fontCssPromise = null;
function embeddedFontCss() {
  if (_fontCssPromise) return _fontCssPromise;
  _fontCssPromise = (async () => {
    try {
      const cssText = await fetch(
        "https://fonts.googleapis.com/css2?family=DM+Sans:wght@700&display=swap"
      ).then((r) => r.text());
      const m = cssText.match(/url\((https:[^)]+\.woff2)\)/);
      if (!m) return "";
      const buf = await fetch(m[1]).then((r) => r.arrayBuffer());
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return `@font-face{font-family:'DM Sans';font-weight:700;src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2');}`;
    } catch {
      return "";
    }
  })();
  return _fontCssPromise;
}

function withFonts(svg, fontCss) {
  if (!fontCss) return svg;
  return svg.replace(/(<svg\b[^>]*>)/, `$1<style>${fontCss}</style>`);
}

async function svgToPngBlob(svg, { background } = {}) {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const w = Math.round(+vb[1]);
  const h = Math.round(+vb[2]);
  const scale = 2; // retina
  const fontCss = await embeddedFontCss();
  const full = withFonts(svg, fontCss);
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(full);

  const img = new Image();
  img.decoding = "sync";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Reference is filename-safe already (UPD-2026-0001); keep its case as the
// grouping prefix so all of an adopter's files sort together in Downloads.
function refPrefix(reference) {
  return (String(reference).replace(/[^a-zA-Z0-9-]/g, "") || "UPD").slice(0, 40);
}

// Reusable PNG generator (Blob) for the confirmation page's welcome-email
// attachments. Mirrors the in-component download(): a seal renders on a
// parchment ground; a mark stays transparent gold.
export async function renderSealPngBlob({ kind = "seal", orientation = "vertical", name, date, reference, uid = "email" }) {
  const fill = displayFill(kind);
  const svg = injectSeal(RAW[kind][orientation].display, {
    name: name || "", date: date || "", reference: reference || "",
    orientation, fill, uid: `png${uid}`,
  });
  const background = isSeal(kind) ? PARCHMENT : null;
  return svgToPngBlob(svg, { background });
}

/* ---------------- Component ---------------- */

export default function PersonalisedSeal({
  kind = "seal",
  orientation = "vertical",
  name,
  date,
  reference,
  mode = "interactive", // "interactive" (lightbox + downloads) | "preview" (form live preview)
}) {
  const rid = useId();
  const uid = cssId(rid);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [isTouch] = useState(
    () => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
  const enlargeLabel = isTouch ? "Tap to enlarge" : "Click to enlarge";

  const fields = { name: name || "", date: date || "", reference: reference || "" };

  const displaySvg = useMemo(
    () =>
      injectSeal(RAW[kind][orientation].display, {
        ...fields, orientation, fill: displayFill(kind), uid: `${uid}d`,
      }),
    [kind, orientation, fields.name, fields.date, fields.reference, uid]
  );

  const altText = `UPD ${isSeal(kind) ? "Ceremonial Seal" : "Trust Mark"} — ${fields.name}, adopted ${fields.date}, reference ${fields.reference}`;

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const download = async (which) => {
    // Display = with ground (seal on parchment; mark gold/transparent).
    // Transparent = no ground (seal navy ink; mark gold) — both without background.
    setBusy(which);
    try {
      const fill = displayFill(kind);
      const svg = injectSeal(RAW[kind][orientation].display, {
        ...fields, orientation, fill, uid: `${uid}${which}`,
      });
      const background = which === "display" && isSeal(kind) ? PARCHMENT : null;
      const blob = await svgToPngBlob(svg, { background });
      triggerDownload(blob, `${refPrefix(fields.reference)}-${kind}-${orientation}-${which}.png`);
    } finally {
      setBusy(null);
    }
  };

  const seal = isSeal(kind);

  // "display" — just the framed art, no helper/cue/downloads/lightbox. Used for
  // generic marks on the conscience.wiki portal hero (rendered with blank
  // fields). Marks show gold on navy; seals keep their parchment ground.
  if (mode === "display") {
    return (
      <div className="pseal">
        <style>{css}</style>
        <div
          className={`pseal-frame ${seal ? "is-seal" : "is-mark"}`}
          dangerouslySetInnerHTML={{ __html: displaySvg }}
          role="img"
          aria-label={`Universal Primary Directive ${seal ? "Adoption Seal" : "Trust Mark"}`}
        />
      </div>
    );
  }

  if (mode === "preview") {
    return (
      <div className="pseal">
        <style>{css}</style>
        <div className={`pseal-frame ${seal ? "is-seal" : "is-mark"}`}
             dangerouslySetInnerHTML={{ __html: displaySvg }} role="img" aria-label={altText} />
        <p className="pseal-helper">This is how your name will appear on your seal. You can adjust it above.</p>
      </div>
    );
  }

  return (
    <div className="pseal">
      <style>{css}</style>

      <button type="button" className={`pseal-frame pseal-trigger ${seal ? "is-seal" : "is-mark"}`}
              onClick={() => setOpen(true)} aria-label={`${altText}. ${enlargeLabel}.`}
              dangerouslySetInnerHTML={{ __html: displaySvg }} />
      <button type="button" className="pseal-cue" onClick={() => setOpen(true)}>{enlargeLabel}</button>

      <div className="pseal-downloads">
        <button type="button" className="pseal-dl" disabled={busy} onClick={() => download("display")}>
          {busy === "display" ? "Preparing…" : "Download Display Version"}
        </button>
        <button type="button" className="pseal-dl" disabled={busy} onClick={() => download("transparent")}>
          {busy === "transparent" ? "Preparing…" : "Download Transparent Version"}
        </button>
      </div>

      {open && (
        <div className="pseal-lightbox" onClick={close} role="dialog" aria-modal="true" aria-label={altText}>
          <button type="button" className="pseal-close" onClick={close} aria-label="Close">×</button>
          <div className={`pseal-lightbox-inner ${seal ? "is-seal" : "is-mark"}`} onClick={(e) => e.stopPropagation()}>
            <div className="pseal-lightbox-art" dangerouslySetInnerHTML={{ __html: displaySvg }} role="img" aria-label={altText} />
          </div>
        </div>
      )}
    </div>
  );
}

const css = `
.pseal{ display:flex; flex-direction:column; align-items:center; }
.pseal-frame{ display:block; border:0; padding:0; background:none; width:100%; max-width:340px; }
.pseal-frame svg{ width:100%; height:auto; display:block; }
.pseal-frame.is-seal{
  max-width:360px; padding:22px; border-radius:14px;
  background:${PARCHMENT};
  background-image:
    radial-gradient(130% 120% at 50% -10%, rgba(255,255,255,.6), rgba(255,255,255,0) 55%),
    radial-gradient(150% 120% at 50% 110%, rgba(150,120,60,.14), rgba(255,255,255,0) 55%),
    repeating-linear-gradient(92deg, rgba(160,130,70,.03) 0 2px, rgba(0,0,0,0) 2px 5px);
  border:1px solid rgba(150,120,60,.3);
  box-shadow: inset 0 0 44px rgba(140,110,60,.14), 0 10px 30px rgba(0,0,0,.35);
}
.pseal-trigger{ cursor:zoom-in; }
.pseal-cue{
  margin:.6rem 0 0; padding:0; border:0; background:none; font:inherit;
  font-size:.8rem; letter-spacing:.02em; color:var(--muted,#9fb0c8); opacity:.85; cursor:zoom-in;
}
.pseal-cue:hover{ opacity:1; text-decoration:underline; }
.pseal-helper{ margin:.9rem 0 0; text-align:center; font-size:.85rem; font-style:italic; color:var(--muted,#9fb0c8); max-width:36ch; }

.pseal-downloads{
  display:inline-flex; gap:.6rem; justify-content:center;
  width:340px; max-width:100%; margin:1.1rem auto 0;   /* fixed width, self-centering in any parent */
}
.pseal-dl{
  flex:1 1 0; min-width:0; text-align:center;          /* two exactly-equal halves */
  font:inherit; font-size:.85rem; letter-spacing:.01em; cursor:pointer;
  padding:.6rem 1rem; border-radius:8px;
  border:1px solid rgba(212,168,83,.5); background:rgba(212,168,83,.08); color:var(--gold,#d4a853);
}
.pseal-dl:hover:not(:disabled){ background:rgba(212,168,83,.16); }
.pseal-dl:disabled{ opacity:.6; cursor:default; }

.pseal-lightbox{
  position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center;
  padding:4vmin; background:rgba(6,12,22,.86); backdrop-filter:blur(3px);
}
.pseal-close{
  position:absolute; top:2vmin; right:2.4vmin; font-size:2.2rem; line-height:1;
  border:0; background:none; color:#e8eaf0; cursor:pointer; opacity:.8;
}
.pseal-close:hover{ opacity:1; }
.pseal-lightbox-inner.is-mark{ width:min(90vmin,900px); }
.pseal-lightbox-inner.is-seal{
  width:min(90vmin,760px); padding:min(6vmin,48px); border-radius:18px;
  background:${PARCHMENT};
  background-image:
    radial-gradient(130% 120% at 50% -10%, rgba(255,255,255,.6), rgba(255,255,255,0) 55%),
    radial-gradient(150% 120% at 50% 110%, rgba(150,120,60,.14), rgba(255,255,255,0) 55%),
    repeating-linear-gradient(92deg, rgba(160,130,70,.03) 0 2px, rgba(0,0,0,0) 2px 5px);
  border:1px solid rgba(150,120,60,.35);
  box-shadow: inset 0 0 60px rgba(140,110,60,.16), 0 20px 60px rgba(0,0,0,.5);
}
.pseal-lightbox-art svg{ width:100%; height:auto; display:block; }
`;
