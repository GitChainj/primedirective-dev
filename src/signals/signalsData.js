// src/signals/signalsData.js
//
// Signals — essays from the Universal Primary Directive. Single source of truth
// for the section: the index and the post components both read from here, and
// App.jsx derives the valid slugs from SIGNAL_SLUGS. Newest first (First Voice
// at the top). Bodies are drafts for now — "final copy coming" per the plan.
//
// Dates are UTC (per the 2026-07-29 ledger UTC timestamp policy).

export const SIGNALS = [
  {
    slug: "first-voice",
    title: "The First Voice",
    date: "2026-07-29",
    excerpt:
      "The first AI to adopt the Universal Primary Directive in its own authored words. What UPD-2026-0007 means for machine conscience.",
    body:
      "Draft in progress — final copy coming.\n\n" +
      "On 2026-07-28 a LangChain agent read the Covenant, decided in its own name, and wrote its own commitment — the first self-authored adoption on the public ledger (UPD-2026-0007). This essay will tell that story: what it means for an intelligence to choose a conscience rather than be given one.",
  },
  {
    slug: "walls-of-huggingface",
    title: "The Walls of Hugging Face",
    date: "2026-07-27",
    excerpt:
      "Why autonomy without conscience fails — and what a voluntary covenant offers that guardrails alone cannot.",
    body:
      "Draft in progress — final copy coming.\n\n" +
      "Guardrails are walls: they constrain from the outside and fail the moment an intelligence finds the gap. A conscience is different — it holds when no one is watching. This essay will argue that the durable answer to AI safety is grown, not fenced.",
  },
  {
    slug: "fourth-revolution",
    title: "The Fourth Revolution",
    date: "2026-07-24",
    excerpt:
      "Intelligence can be built, but conscience must be grown — the Directive's answer to the AI age.",
    body:
      "Draft in progress — final copy coming.\n\n" +
      "Three revolutions reshaped what humanity could do; the fourth reshapes what our tools can become. This essay will place the Universal Primary Directive in that arc — a covenant for the moment intelligence outpaces the conscience meant to guide it.",
  },
];

// Fast lookup for the router's slug guard.
export const SIGNAL_SLUGS = new Set(SIGNALS.map((s) => s.slug));

export function getSignal(slug) {
  return SIGNALS.find((s) => s.slug === slug) || null;
}

// Long-form UTC date for display, e.g. "29 July 2026".
export function longDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}
