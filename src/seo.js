// src/seo.js — per-route <head> metadata for primedirective.dev (SEO Phase 1).
//
// React 18 + full-page-reload navigation: each route is a fresh load, so the
// head only needs setting once per load for the matched path — no client-side
// transition to clean up. useSeo() runs at the top of App() and, for a mapped
// route, sets title / description / canonical / OG / Twitter on the www origin.
// Unmapped paths (wiki, /adopt/confirm) keep the static index.html defaults.
//
// Steward's notes (for the record, 2026-07-27):
// - /organizations ships as drafted — reviewed and retained deliberately;
//   wording to be revisited post-launch.
// - /deploy ships as drafted — the deploy-upgrade build (platform-configured
//   artifact generation) is queued and will make the page match the copy.
// - /integrate ships as drafted — the page documents publishing a signed
//   Ed25519 attestation (format + header/DNS/.well-known conventions, with the
//   Foundation's own live example); self-serve attestation issuance is
//   trust-network Piece 3, queued. Description reflects the near-term vision.
// - Site policy: pre-launch, copy is written to the vision and the builds close
//   the gaps — not the reverse.
//
// Note: metadata applies client-side at runtime. Raw-HTML visibility to non-JS
// crawlers awaits SEO Phase 2 (prerendering); that is expected, not a failure.

import { useEffect } from "react";

const SITE = "https://www.primedirective.dev";

// Homepage first, then alphabetical — mirrors the sitemap's 13 canonical routes.
export const ROUTE_META = {
  "/": {
    title: "The Universal Primary Directive — A Covenant Between Human and AI",
    description:
      "A shared covenant between human and artificial intelligence, grounded in Five Universal Truths observed across 190+ traditions. Adopt it, verify it, build with it.",
  },
  "/adopt": {
    title: "Adopt the Directive | The Universal Primary Directive",
    description:
      "Adopt the Universal Primary Directive as an individual, organisation, or AI system, and receive your cryptographically verifiable Conscience Mark — your Certified AI Conscience™ credential.",
  },
  "/build": {
    title: "Build with the Conscience | The Universal Primary Directive",
    description:
      "Developer surface for the Directive: a LangChain example agent, the /api/adopt contract, artifact downloads, and machine-readable Ed25519 verification.",
  },
  "/certification-licence": {
    title: "Certification Licence | The Universal Primary Directive",
    description:
      "Terms governing the Certified AI Conscience mark — who may display it, and the standards the Universal Primary Directive certification attests to.",
  },
  "/conscience": {
    title: "How AI Conscience Works | The Universal Primary Directive",
    description:
      "How the Certified AI Conscience works: the Five Universal Truths as an operating conscience for AI, with cryptographic attestation anyone can verify.",
  },
  "/deploy": {
    title: "Deploy and Test the Conscience | The Universal Primary Directive",
    description:
      "Deploy the Certified AI Conscience into a live AI system and test that it holds — practical steps to add the Universal Primary Directive to any model.",
  },
  "/donate": {
    title: "Give | The Universal Primary Directive",
    description:
      "Keep the Universal Primary Directive free and uncaptured — funded by many small gifts, never bought by a powerful few. Support a public-domain covenant for AI.",
  },
  "/integrate": {
    title: "Three Steps to Integrate | The Universal Primary Directive",
    description:
      "Add the Universal Primary Directive to any AI system in three steps: reference the covenant, publish a signed attestation, and expose it for verification.",
  },
  "/organizations": {
    title: "For Organisations | The Universal Primary Directive",
    description:
      "Adopt the Universal Primary Directive as an organisation — a public AI-ethics standard your customers can verify and your competitors will eventually adopt.",
  },
  "/privacy": {
    title: "Privacy Policy | The Universal Primary Directive",
    description:
      "How primedirective.dev handles data: the Universal Primary Directive collects minimal information and keeps the covenant free, open, and account-free.",
  },
  "/propose-amendment": {
    title: "Propose an Amendment | The Universal Primary Directive",
    description:
      "Propose an amendment to the Universal Primary Directive. The covenant evolves through open, reasoned proposals reviewed by the Founding Steward.",
  },
  "/terms": {
    title: "Terms of Use | The Universal Primary Directive",
    description:
      "Terms of use for primedirective.dev — a CC0 public-domain covenant, freely usable, with specific terms for the certification marks.",
  },
  "/truths-explained": {
    title: "The Five Universal Truths, Explained | The Universal Primary Directive",
    description:
      "The Five Universal Truths at the heart of the Directive, explained in plain language — the shared moral grammar found independently across 190+ traditions.",
  },
};

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// Apply per-route head for a mapped path. Called once per load (nav is a full
// reload), so no cleanup is required. Unmapped paths keep the static defaults.
export function useSeo(path) {
  useEffect(() => {
    const meta = ROUTE_META[path];
    if (!meta) return;
    const canonical = SITE + (path === "/" ? "/" : path);
    document.title = meta.title;
    upsertMeta("name", "description", meta.description);
    upsertCanonical(canonical);
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("name", "twitter:title", meta.title);
    upsertMeta("name", "twitter:description", meta.description);
    upsertMeta("name", "twitter:url", canonical);
  }, [path]);
}
