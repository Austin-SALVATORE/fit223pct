# Verified Equipment Profile

**Status: partially verified — plate inventory coach-confirmed 7 Aug 2026;
handle weight measured 7 Aug 2026; plate interchangeability and handle
count still unmeasured.**

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

## Measured — 7 Aug 2026

| Fact | Value | Source |
|---|---|---|
| Empty handle weight, **collars on** | **1.2 kg** | Owner, kitchen scale, reported in chat 7 Aug 2026 ~16:00 |

**Immediate consequence (preliminary, pending Phase 2's proper
enumeration):** every buildable load is `1.2 + 2 × (side sum)`, and side
sums step in 0.25 kg — so achievable loads all end in **.2 or .7**.
**None of the coach's written targets (5 / 6 / 8 / 10 / 12 / 14 / 15 kg)
is exactly buildable.** Under ruling ③ (round down, globally) every
prescription maps to its nearest lower achievable neighbour (10 → 9.7,
15 → 14.7, …). This is the outcome the 7 Aug amendment's sensitivity
finding predicted for a near-1.25 kg handle, and it makes the Phase 5
revalidation report's expected classification for essentially the whole
program: *intentionally approximate (mapped)* — for the coach to confirm,
never silently rounded by the app.

## Unmeasured — still blocks the achievable-load list

| Fact | How it gets measured | Why it matters |
|---|---|---|
| Set A ↔ Set B plate interchangeability (bore) | Owner tries one Set B plate on a Set A handle | Decides program executability: without mixing, the bilateral ceiling is ~11.5 kg + handle and the prescribed 12/14/15 kg tops are unreachable. |
| Handle count | Owner counts | Bilateral lifts load two handles from one shared inventory. |
| Max plates per side | Owner checks how many plates physically fit one side (ruling ⑧: wait for the measurement, assume nothing) | Caps the top of the achievable list. |

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

## Coach rulings — 7 Aug 2026 (board answer, all eight questions)

- **① 5 kg rear-delt fly:** map to the nearest achievable **lower** load.
  Isolation work never progresses by exceeding the technical standard to
  hit a number.
- **②/⑦ Bilateral loading:** the two dumbbells **always carry identical
  loads**. Asymmetric loading is never prescribed for bilateral
  movements; if a target cannot be built as a matching pair, use the
  next lower achievable matching pair. Single-dumbbell exercises are
  exempt by nature. *(Residual nuance, not extrapolated: the coach
  ruled on equal **weight**; whether two equal-weight handles may differ
  in plate **composition** — the only way to reach 14 kg — was the
  question's edge and reads as permitted, but is flagged for explicit
  confirmation in the revalidation report.)*
- **③ Global tie-break: always round down.** Long-term progression over
  arbitrary numbers; technique over load. Applies everywhere, not just
  the Deload.
- **④ Load-ceiling variation ladder:** confirmed, and **per-pyramid
  independently** — each exercise progresses against its own ceiling
  without waiting for the session.
- **⑤ Revalidation pass:** confirmed as specified. Three classes, no
  silent rounding.
- **⑥ Single-dumbbell movements may use the single-implement list** —
  any load physically achievable on one handle, unconstrained by what
  can be built as a pair. (The bilateral and single-implement lists are
  officially two lists.)
- **⑧ Max plates per side:** a hardware fact — wait for the athlete's
  measurement, implement no assumption.
- **Spec correction accepted:** the "imports cannot preserve fixed
  weekdays" sentence will be removed (untrue since M8).

**One discrepancy surfaced by ②'s own examples, needs coach
confirmation:** the coach's single-dumbbell list includes **Bulgarian
Split Squat**, but spec v2.16 §4 writes it as *"12 kg in each hand"*
(two dumbbells). One of the two is stale. `implementCount` for that
exercise is blocked on the answer; do not seed it from either source
alone.

## Change discipline

Update this file when a measurement lands or the coach revises the
inventory — dated, appended, never silently rewritten. The spec
validator archives coach spec revisions at
`~/.claude/agent-memory/program-spec-validator/spec-archive/`.
