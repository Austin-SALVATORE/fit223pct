# Phase 1 Home v3 — Shoulders & Arms revision

**Status:** authoritative coach prescription, received 31 Jul 2026.
Supersedes the Friday section of
[`phase-1-home-v3-coach-spec.md`](./phase-1-home-v3-coach-spec.md).
**Not yet implemented** — see *Open before implementation*.

The coach recalibrated the session after the first completed Shoulders &
Arms workout, which was finished comfortably with recovery to spare. The
previous prescription was judged conservative.

---

## Session

Five exercises, in this order. Every movement is on the **ladder**
(pyramid) model — explicit weight × reps per set.

| # | Exercise | Set 1 | Set 2 | Set 3 |
|---|---|---|---|---|
| 1 | Dumbbell Shoulder Press | 8 kg × 10 | 10 kg × 8 | 12 kg × 6 |
| 2 | Dumbbell Lateral Raise | 6 kg × 15 | 8 kg × 12 | — |
| 3 | Rear Delt Fly | 6 kg × 15 | 8 kg × 12 | — |
| 4 | Dumbbell Curl | 8 kg × 15 | 10 kg × 12 | — |
| 5 | Overhead Triceps Extension | 6 kg × 15 | 8 kg × 12 | 10 kg × 10 |

Progression: when every prescribed set is completed with good technique,
the **whole ladder** advances by **+2 kg**, subject to the 15 kg
equipment ceiling.

Target regions: front delts, lateral delts, rear delts, biceps, triceps.

### Overhead Triceps Extension — the corrected ladder

The prescription arrived twice with different loads. **6 / 8 / 10 is
final**, ruled by the coach on 31 Jul; the 10 / 12 / 14 draft in the
received file is **superseded** and must not be implemented.

The coach's reasoning, recorded because it constrains any future
revision — the ceiling, not the starting load, is what was being solved:

| | Set 1 | Set 2 | Set 3 |
|---|---|---|---|
| Week 1 | 6 | 8 | 10 |
| Week 2 | 8 | 10 | 12 |
| Week 3 | 10 | 12 | 14 |
| Week 4 | 12 | 14 | **15 — equipment cap** |

Four progressions before the ceiling. The superseded 10 / 12 / 14 would
have reached the cap immediately: its top rung needs 16 kg to advance,
so it could never have progressed at all.

The top rung clamping at 15 rather than overshooting to 16 is already how
the ladder model behaves — it holds at `maxWeightKg` and surfaces
`at-equipment-max`. No special-casing is required.

**One dumbbell, held with both hands.** The stated weight is that single
dumbbell, not a pair — the only movement in this session where the
per-dumbbell convention could be misread.

---

## What this changes against the current seed

Verified against `src/data/seed/program.ts:192-220` on 31 Jul.

| Exercise | Currently | Becomes |
|---|---|---|
| Dumbbell Shoulder Press | ladder 8×12, 10×10, 12×8 | ladder 8×10, 10×8, 12×6 |
| Dumbbell Lateral Raise | rep-range, 2 × 12–15 @ 5 kg | **ladder** 6×15, 8×12 |
| Rear Delt Fly | rep-range, 2 × 12–15 @ 5 kg | **ladder** 6×15, 8×12 |
| Dumbbell Curl | rep-range, 2 × 12–15 @ 8 kg | **ladder** 8×15, 10×12 |
| Overhead Triceps Extension | *not in the Library* | **new**, ladder 6×15, 8×12, 10×10 |

Five prescriptions change, not one. Three convert from rep-range to
ladder, which **retires the rep-range model from this session
entirely**.

The coach's stated rationale: Phase 1 has moved to a unified pyramid
philosophy for loaded movements, and a rep-range exception here would
reintroduce mixed progression models inside one session. Consistency of
the progression system was judged more valuable than matching the other
isolations.

This is a coach ruling on training philosophy and is recorded, not
evaluated.

---

## Structural checks

Done here because they are structural, not editorial —
[`program-content.md`](../../.claude/rules/program-content.md) reserves
training decisions to the coach.

- **Equipment tier holds.** Every prescribed load is ≤ 15 kg per hand.
  The only movement that reaches the ceiling does so through
  progression, where the model already clamps.
- **`overhead-triceps-extension` is not in the Library.**
  `src/data/seed/exercises.ts` has no entry, and no near-miss id
  exists. It must be promoted before it can be prescribed — art
  existing is not the same as the id existing.
- **Art is already complete.** `public/assets/exercises/overhead-triceps-extension/`
  holds reference, frames and thumbnail, and the manifest entry carries
  all five integrity fields (`referenceHash`, `referenceSize`,
  `frameHashes`, `frameSizes`, `thumbnailHash`).
- **Locale keys do not exist yet.** A promoted exercise needs `name`,
  `cues` and `teachingConcept` in `en`, `fr` and `zh-CN` `seed.json`,
  landing together — locale parity is a test.
- **The ladder model is chosen per prescription by the presence of
  `setPlan`**, never inferred from role or equipment. Three accessories
  becoming ladders needs no engine change, only `setPlan` arrays.
- **Substitution ids are unspecified.** `dumbbell-curl` carries
  `substitutionIds: ['band-curl']`; nothing equivalent is named for the
  triceps movement. Not a blocker — the field may be empty — but it is
  a coach decision if one is wanted.

---

## Open before implementation

1. **Scope.** The owner asked for one exercise to be added; this
   prescription changes five. Awaiting the owner's decision on whether
   to take the whole session or the triceps alone. *(Blocking.)*
2. **Cues and teaching concept** for the new exercise are unwritten.
   Every other seeded exercise carries three cues and a teaching
   concept; these are content, and belong to the coach.

Received file archived verbatim in the session scratchpad as
`coach-prescription-received.md`.
