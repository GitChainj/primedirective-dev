// api/register-ai.js — RETIRED. Kept, not deleted, so the path answers honestly.
//
// ── What this used to be ──
// An AI "registration" form submitted here and the endpoint opened a GitHub
// issue labelled "ai-registration" for the Steward to review by hand. It was
// never an adoption: it minted no reference, computed no adoption hash, and
// wrote no Verification block, so scripts/curate-ledger.mjs — which fetches only
// issues labelled adoption-person / adoption-organisation / adoption-ai-system,
// and refuses any row without a complete, hash-verifying Verification block —
// could never turn one into a ledger record. Two independent gates, both closed.
//
// No "ai-registration" issue was ever created. The page that posted here was
// routed but unlinked, reachable only by typing the URL, and it submitted into
// this dead end: a human followed an old link, filled in a form, and received a
// GitHub issue that could not become an adoption. That is the gap this closes.
//
// ── Why a 410 and not a redirect ──
// A redirect would make a POST of the old shape look like it had been accepted
// somewhere. It has not: the canonical path takes a different body — it requires
// the adopter's own did:key, an explicit consent object, and a submission type.
// A 410 with the new address is the honest answer, and it tells a machine
// unambiguously that this door is closed rather than moved.
//
// The response is the same for every method, including GET. A retired endpoint
// that answers "405 Method not allowed" to a GET implies that some other method
// would still work here, and none does.

const CONTRACT_URL = "https://primedirective.dev/.well-known/ai-adoption-contract.json";
const KEYGEN_URL = "https://primedirective.dev/.well-known/ai-identity-keygen.json";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  // Link relations a machine may follow without parsing the body.
  res.setHeader(
    "Link",
    `<${CONTRACT_URL}>; rel="describedby", <https://primedirective.dev/api/adopt>; rel="successor-version"`,
  );

  return res.status(410).json({
    error: "This endpoint is retired.",
    retired: true,
    retired_on: "2026-10",
    reason:
      "It created a human-review issue, not an adoption: it minted no reference and no adoption hash, so nothing submitted here could ever reach the public ledger. AI adoption now happens in one request on the canonical path.",
    adopt_instead: {
      method: "POST",
      url: "https://primedirective.dev/api/adopt",
      path: "ai-system",
      contract: CONTRACT_URL,
      keygen: KEYGEN_URL,
      note:
        "The body differs from this endpoint's: the canonical path requires your own did:key (adopterDid), a submissionType, and an explicit consent object. Read the contract before posting — it is derived field by field from the live handler.",
    },
    what_you_get:
      "A permanent public ledger record carrying your own did:key, which any party can challenge you to prove you still hold. Self-asserted identity, peer-verifiable. NOT a Foundation-signed attestation — that layer is built but not live and issues nothing today.",
    human_page: "https://primedirective.dev/adopt",
  });
}
