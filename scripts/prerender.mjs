#!/usr/bin/env node
// scripts/prerender.mjs — build-time SSG for the 17 primedirective.dev routes
// (SEO Phase 2). Runs after `vite build` (client → dist/) and
// `vite build --ssr src/entry-server.jsx --outDir dist-ssr`.
//
// For each route it: renders the route's HTML via the SSR bundle, replaces the
// template's site-wide per-route head tags with this route's renderHeadTags()
// output, injects the rendered HTML into #root, and writes dist/<route>/index.html.
// The client still boots and render()s (not hydrate) — this HTML is what crawlers
// and the first paint see; the SPA then rebuilds it.
//
// Idempotent (same inputs → same files). Usage:
//   node scripts/prerender.mjs            # write per-route HTML
//   node scripts/prerender.mjs --dry-run  # print the route → file map only

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const SSR_ENTRY = join(ROOT, "dist-ssr", "entry-server.js");

const DRY_RUN = process.argv.includes("--dry-run");

// Exactly the 17 target routes — explicit, never wiki / /verify / /adopt/confirm.
const ROUTES = [
  "/",
  "/adopt",
  "/build",
  "/certification-licence",
  "/conscience",
  "/deploy",
  "/give",
  "/integrate",
  "/organizations",
  "/privacy",
  "/propose-amendment",
  "/terms",
  "/truths-explained",
  "/signals",
  "/signals/first-voice",
  "/signals/walls-of-huggingface",
  "/signals/fourth-revolution",
];

// Head tags the template carries as site-wide defaults and that renderHeadTags
// supplies per-route — strip these before injecting the per-route set so there
// is exactly one of each. Everything else in <head> (og:image, og:site_name,
// twitter:card/image, favicon, JSON-LD) is left untouched.
const STRIP = [
  /<title>[\s\S]*?<\/title>\s*/i,
  /<meta\s+name="description"[^>]*>\s*/i,
  /<meta\s+property="og:title"[^>]*>\s*/i,
  /<meta\s+property="og:description"[^>]*>\s*/i,
  /<meta\s+property="og:url"[^>]*>\s*/i,
  /<meta\s+name="twitter:title"[^>]*>\s*/i,
  /<meta\s+name="twitter:description"[^>]*>\s*/i,
  /<meta\s+name="twitter:url"[^>]*>\s*/i,
];

function routeToFile(route) {
  if (route === "/") return join(DIST, "index.html");
  return join(DIST, route.replace(/^\//, ""), "index.html");
}

async function main() {
  const { render, renderHeadTags } = await import(SSR_ENTRY);

  const template = readFileSync(join(DIST, "index.html"), "utf8");
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('Template missing <div id="root"></div> — aborting.');
  }

  const written = [];
  for (const route of ROUTES) {
    const headTags = renderHeadTags(route);
    if (!headTags) {
      throw new Error(`No head metadata for ${route} — is it in ROUTE_META? Aborting.`);
    }
    const { html } = render(route);

    let head = template;
    for (const re of STRIP) head = head.replace(re, "");
    let page = head.replace(/<\/head>/i, `  ${headTags}\n  </head>`);
    page = page.replace('<div id="root"></div>', `<div id="root">${html}</div>`);

    const file = routeToFile(route);
    written.push([route, file.replace(ROOT + "/", "")]);
    if (!DRY_RUN) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, page);
    }
  }

  console.error(`\n${DRY_RUN ? "[dry-run] would prerender" : "Prerendered"} ${written.length} routes:`);
  for (const [route, file] of written) console.error(`  ${route.padEnd(28)} → ${file}`);
  if (DRY_RUN) console.error("\n(dry-run: no files written)");
}

main().catch((err) => { console.error(err); process.exit(1); });
