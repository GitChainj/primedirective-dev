// api/_lib/autonomyGradient.js — the two autonomy-gradient axes, in one place.
//
// ── Why this module exists ──
// These primitives were split across two modules that imported each other:
// Axis A (key_custody) lived in adoptionCore.js, Axis B (comprehension) lived in
// attestation.js, and adoptionCore.js imported Axis B from attestation.js. When
// attestation.js then needed Axis A, that would have closed a cycle
// (adoptionCore → attestation → adoptionCore). A leaf module ends it: this file
// imports NOTHING from either, so both can import from here freely.
//
// Keep it a leaf. Anything added here must depend on nothing inside api/_lib,
// or the cycle comes back by another route.
//
// ── The gradient is two independent axes, never one ladder ──
// There is deliberately no "level" or "tier" here. Trust is disclosed on two
// axes that move independently, and collapsing them into a single rank would
// invent a hierarchy the design rejects.

// ── Axis A: key custody — DECLARED, never inferred ──
//
// key_custody records WHO HOLDS THE KEY. submissionType records WHO SUBMITTED.
// They are different questions and must not be derived from one another: a
// stateless platform AI adopting in its own name (submissionType "independent")
// still cannot retain a secret between invocations, so its key is held for it.
// The design records such an AI as permanently operator_held, and inferring
// self_generated from "independent" would overclaim Axis A for the majority of
// adopters. That inference was the retired keyCustodyFor(submissionType).
//
// So custody is whatever the adopter DECLARES, validated against the enum, and
// defaults to the conservative value when nothing is declared. operator_held is
// not a lesser tier: a named, answerable party standing behind the commitment is
// full baseline trust, and in some respects the more accountable for having a
// human name attached to it.
//
// ONE function, used by the ledger issue body, the adopt response AND the
// attestation payload, so the value a machine is told cannot differ from the
// value on its record or in a signed statement about it.
export const KEY_CUSTODY_VALUES = new Set([
  "operator_held",
  "self_generated",
  "enclave_attested",
]);
export const KEY_CUSTODY_DEFAULT = "operator_held";

export function keyCustodyFrom(d) {
  const declared = d && typeof d.keyCustody === "string" ? d.keyCustody.trim() : "";
  return KEY_CUSTODY_VALUES.has(declared) ? declared : KEY_CUSTODY_DEFAULT;
}

// ── Axis B: comprehension ──
//
// v1 only ever writes "asserted": the field exists for forward-compatibility,
// and "demonstrated" waits on the comprehension-challenge design. Claiming a
// capability before it is built would be the one dishonesty this whole path is
// meant to avoid.
export const COMPREHENSION_V1 = "asserted";
