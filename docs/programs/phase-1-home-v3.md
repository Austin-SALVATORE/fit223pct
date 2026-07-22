# Phase 1 — Home, v3 (pyramid, dumbbell-only)

**Status: CONTENT DRAFT — not importable yet.** One dependency left:
**M8** (the `setPlan` ladder schema and the Markdown ladder syntax do
not exist in the importer today). The Library expansion landed 22 Jul
(9fdbf28 — all four ids are full Library entries; dumbbell-rdl's art
landed with the chroma regeneration, d0b4fbb). M8 must also ship the
seed-clobber guard (docs/PyramidProgression.md, Migration) or the
import of this file will be silently reverted by the next boot's
seeding. Once M8 lands, this file becomes the import file by removing
this status block and transcribing against the shipped syntax.

**Numbers are AUTHORITATIVE — confirmed by the owner's coach 22 Jul**,
with these coach amendments over the first draft: bench top rung raised
to 16 kg (deliberate 4 kg gap to the top — uneven rungs are valid,
"ascending or equal", and the step-up preserves the gaps); RDL reps
lowered to 12/10/8 (strength emphasis); Bulgarian split squat raised to
6/8/10; and **accessories do not pyramid** — isolation work stays
straight rep-range sets (this amended the M8 rule itself, see
docs/PyramidProgression.md).

Constraints this draft implements (owner + coach, 22 Jul):

- Equipment: adjustable dumbbells + adjustable bench ONLY. No barbell,
  rack, spotter, cables, or bands.
- Every loaded lift is an ascending-weight pyramid (`setPlan` ladder,
  docs/PyramidProgression.md). Bodyweight and timed work keep
  rep/second ranges. RIR does not appear anywhere.
- Movement-pattern integrity: each replacement preserves the original
  movement's intent; every unchosen variant is declared in
  `substitutionIds`.
- Row consolidation (coach decision): barbell bent-over row is replaced
  by single-arm dumbbell row in Session B — the same exercise as
  Session A's row, deliberately. Smaller vocabulary over a
  nearly-identical variation. (Note: the Library id for the retired
  barbell row is `bent-over-row` — there is no `barbell-bent-over-row`.)
- Identity: `id: phase-1-home`, `startDate: 2026-07-21` (the live
  program's actual value — the constraints note said 20 Jul, but the
  deployed seed says 21 Jul and the import must match it),
  `endDate: 2026-08-09`, Mon/Wed/Fri, rotation A/B. Weekday activities
  carry over unchanged from the 22 Jul revision.

**Weight convention (must be stated in the Library expansion docs):**
weights for dumbbell lifts are **per dumbbell** — the number dialed on
one adjustable dumbbell — for both single- and double-dumbbell lifts.
Barbell weights in the retired prescriptions were total bar weight;
that is why e.g. bench 25 kg becomes dumbbell bench 12 kg per hand.

Ladder syntax: `weight x reps`, rungs in order, top set last
(docs/PyramidProgression.md).

## Session A — Squat & pull

| # | Exercise | Prescription | Rest | Notes / substitutions |
|---|----------|--------------|------|-----------------------|
| 1 | goblet-squat | `12x12 / 14x10 / 16x8` (step 2, cap 20) | 120 s | 3-second lowering |
| 2 | **dumbbell-bench-press** (new) | `10x12 / 12x10 / 16x8` (step 2) | 120 s | subs: bench-press, db-floor-press |
| 3 | single-arm-db-row (per side) | `12x12 / 14x10 / 16x8` (step 2, cap 20) | 90 s | — |
| 4 | **dumbbell-rdl** (new) | `10x12 / 12x10 / 14x8` (step 2) | 120 s | Slow eccentric — the dumbbells take 3 seconds down · subs: romanian-deadlift, single-leg-rdl |
| 5 | **rear-delt-fly** (new, accessory) | 2 × 12–15, start 4 kg, step 2 | 60 s | straight sets — no pyramid · subs: band-pull-apart |
| 6 | dead-bug (accessory, per side) | 2 × 8–10, bodyweight | 60 s | unchanged |

## Session B — Hinge & press

| # | Exercise | Prescription | Rest | Notes / substitutions |
|---|----------|--------------|------|-----------------------|
| 1 | bulgarian-split-squat (per side) | `6x12 / 8x10 / 10x8` (step 2, cap 20) | 120 s | — |
| 2 | **dumbbell-shoulder-press** (new) | `6x10 / 8x8 / 10x6` (step 2) | 120 s | subs: overhead-press, single-arm-db-press |
| 3 | single-arm-db-row (per side) | `12x12 / 14x10 / 16x8` (step 2, cap 20) | 90 s | Pause at the top of each rep · subs: bent-over-row |
| 4 | single-leg-hip-thrust (per side) | 3 × 10–15, bodyweight | 120 s | Keep the hips level — the free leg stays extended · subs: hip-thrust |
| 5 | dumbbell-lateral-raise (accessory) | 2 × 12–15, start 4 kg, step 2 | 60 s | straight sets — no pyramid · subs: band-lateral-raise |
| 6 | dumbbell-curl (accessory) | 2 × 12–15, start 8 kg, step 2 | 60 s | straight sets — no pyramid · subs: band-curl |
| 7 | side-plank (accessory, per side) | 2 × 20–40 s | 60 s | unchanged |

## Weekday activities (unchanged)

- **Tue** — recovery: 30-minute easy walk (conversational pace);
  10-minute stretch (hips, hamstrings, chest, shoulders).
- **Thu** — recovery: 10-minute mobility routine (ankles, hips,
  thoracic spine, shoulders); 20–30 minutes of Zone 2.
- **Sat** — optional: one enjoyable activity (recreational); complete
  rest is a fine choice too.
- **Sun** — checkpoint: weigh in, measure waist (same conditions each
  week), prepare the coming week.

## Progression rules (coach-confirmed)

- **Primary compound lifts (ladders):** when every rung reaches its
  target reps, every rung steps up 2 kg next session; any shortfall
  repeats the whole ladder.
- **Accessories (straight sets):** progress within the rep range;
  weight steps up only when both sets reach the top of the range —
  the top-of-range completion gate that replaces the retired RIR
  reserve gate (docs/PyramidProgression.md).

## Open items before this becomes the import file

1. **Markdown ladder syntax must match the shipped M8 implementation**
   exactly before transcription — this table's `12x12 / 14x10 / 16x8`
   notation follows the spec, but the importer is the authority once
   it exists.
2. Runtime UX expectations (set gating, advisory rest timers,
   exercise-based progress, terminology) are app responsibilities —
   deliberately **not** encoded here.
