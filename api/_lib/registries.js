// api/_lib/registries.js
//
// Server-side resolver for the free public corporate-registry links used in the
// private steward verification email (Addition 3). Reads the SAME canonical file
// the adoption form imports (src/data/registries.json) so the steward edits one
// JSON file and both sides update. Reading is wrapped so a missing/edited file
// never throws — it degrades to the plain-text "search […] corporate registry"
// fallback the spec requires. vercel.json includeFiles ensures the JSON ships
// inside the function bundle.

import { readFileSync } from "node:fs";
import { join } from "node:path";

let _tables = null;
function tables() {
  if (_tables) return _tables;
  try {
    const raw = readFileSync(join(process.cwd(), "src/data/registries.json"), "utf8");
    const parsed = JSON.parse(raw);
    _tables = {
      countries: parsed.countries || {},
      us_states: parsed.us_states || {},
    };
  } catch (err) {
    console.error("registries.json unreadable; using fallback links only:", err && err.message);
    _tables = { countries: {}, us_states: {} };
  }
  return _tables;
}

// Returns { label, url }. url is null when the country/state is not in the table
// — the caller then renders the label as plain text (no broken link).
export function registryLink(country, usState) {
  const t = tables();
  if (country === "United States" && usState) {
    const url = t.us_states[usState] || null;
    return { label: `United States — ${usState}`, url };
  }
  if (country) {
    const url = t.countries[country] || null;
    return { label: country, url };
  }
  return { label: "", url: null };
}
