// src/entry-server.jsx — SSR entry for build-time prerendering (SEO Phase 2).
//
// Built with `vite build --ssr` into dist-ssr/, then walked by
// scripts/prerender.mjs. Exports a pure render(path) that returns the route's
// HTML, and re-exports renderHeadTags so the prerender script gets both from
// the single built bundle (no raw-src imports in Node).
//
// ssrIsWiki is always false: only primedirective.dev routes are prerendered;
// the conscience.wiki experience stays entirely runtime/hostname-driven.
//
// The client entry (main.jsx) still uses createRoot().render() — NOT hydrate —
// so on load React rebuilds the SPA fresh and this prerendered HTML is replaced.

import { renderToString } from "react-dom/server";
import App from "./App.jsx";

export { renderHeadTags } from "./seo.js";

export function render(path) {
  const html = renderToString(<App ssrPath={path} ssrIsWiki={false} />);
  return { html };
}
