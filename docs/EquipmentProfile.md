# Verified Equipment Profile

**Status: partially verified — plate inventory coach-confirmed 7 Aug 2026;
handle weight and plate interchangeability unmeasured.**

This document is the durable home for the athlete's real equipment. It
exists because the inventory below arrived in a coach *message*, appears
in no versioned spec file (verified against v2.16 — no plate or handle
content anywhere in its 762 lines), and the coach's spec files overwrite
themselves on revision. Facts that live only in messages are the next
thing to vanish.

The authority split, per the coach's 7 Aug amendment:

> **Coach prescribes the training target; the equipment profile defines
> which physical loads actually exist.**

## Hardware (coach-confirmed, 7 Aug 2026)

Two traditional **plate-loaded** dumbbell sets. NOT selectorized/dial
dumbbells — there is no fixed weight ladder.

| Set | Plates |
|---|---|
| A | 4 × 1.0 kg · 4 × 1.25 kg · 4 × 2.5 kg |
| B | 8 × 1.0 kg · 4 × 2.0 kg |

## Unmeasured — blocks the achievable-load list

| Fact | How it gets measured | Why it matters |
|---|---|---|
| Empty handle weight, **collars on** | Owner weighs one on a scale (committed to, 7 Aug board tap) | Translates the entire load grid. Measured prototype result: at a 2.0 kg handle, 7 of 8 currently-prescribed weights are exactly buildable; at 1.25 / 1.75 / 2.27 / 2.75 kg, **zero of eight** are. |
| Set A ↔ Set B plate interchangeability (bore) | Owner tries one Set B plate on a Set A handle | Decides program executability: without mixing, the bilateral ceiling is ~11.5 kg + handle and the prescribed 12/14/15 kg tops are unreachable. |
| Handle count | Owner counts | Bilateral lifts load two handles from one shared inventory. |

## Standing rules (coach, 7 Aug amendment — do not weaken)

- The equipment layer's product is an **ordered list of achievable
  loads per dumbbell**. Never a step size.
- **One available load step = one position forward or backward in that
  list.** Applies uniformly: pyramid progression, Yellow-day reduction,
  multi-miss rebuild, Deload mapping.
- **Never hardcode 2 kg / 2.5 kg / any arithmetic increment.**
- Until the list is verified: prescribed loads stay visible,
  **automatic next/previous-load calculation stays disabled**, missing
  settings are never inferred.
- An unachievable written Deload load maps to the **nearest
  coach-approved lower** achievable load — never silent arithmetic.
  (The general tie-break outside the Deload is an open coach question —
  deliberately not extrapolated.)
- Once verified: one revalidation pass classifies every written load as
  *directly achievable* / *intentionally approximate (mapped)* /
  *invalid (coach corrects)*. **No silent rounding.** The pass produces
  a report for the coach, not automatic corrections.

## Known findings against this inventory (measured, 7 Aug)

- Prototype enumeration (2.0 kg handle placeholder, sets mixable,
  composition-symmetric handles): **28 achievable loads, 2–19.5 kg**,
  largest gap 1.5 kg (between 4.5 and 6).
- **5 kg is unbuildable in every configuration** (needs 1.5 kg/side; no
  subset of {1, 1.25, 2, 2.5} sums to 1.5). It is prescribed today
  (phase-1-home rear-delt fly). With the coach as *invalid — needs
  correction*.
- The engine's committed `DUMBBELL_STEP_KG = 2` / `DUMBBELL_MAX_KG = 15`
  and scalar `weightStepKg` are the arithmetic the rules above forbid —
  knowingly wrong pending the equipment-aware progression design
  (`~/.claude/plans/equipment-aware-progression.md`).

## Change discipline

Update this file when a measurement lands or the coach revises the
inventory — dated, appended, never silently rewritten. The spec
validator archives coach spec revisions at
`~/.claude/agent-memory/program-spec-validator/spec-archive/`.
