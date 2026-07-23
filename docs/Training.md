# Training

Evidence-informed, equipment-honest. Sources of principle: ACSM resistance
training guidance, WHO activity guidelines, peer-reviewed hypertrophy/strength
literature (e.g. Schoenfeld et al. on volume and proximity to failure).
No influencer programming. No fabricated claims. No promised outcomes.

## Principles applied

- Each major muscle group receives direct weekly stimulus.
- Every training day has a single, clear identity — the user should always be
  able to answer "what did I train today?"
- Compound lifts come first, isolation follows, core finishes.
- Progression is completion-gated, not reserve-gated: RIR was purged
  entirely from the app (22 Jul, `docs/PyramidProgression.md`) — a session
  advances because it was completed as prescribed, never because of a
  self-rated number.
- Load is capped at home (15 kg per hand, adjustable dumbbells only, 30 kg
  combined) — a ladder that reaches this ceiling holds there and says so,
  rather than quietly faking further progress.
- Recovery is tracked (sleep, energy, soreness, stress, motivation) and is a
  first-class input to training decisions — an 'easier' day drops the
  heaviest set of each ladder and trims accessory volume, never load.

## Two progression models

Every prescription is one of exactly two shapes (`docs/PyramidProgression.md`
is the full spec; this section is the summary).

**Pyramid / ladder (`setPlan`)** — primary compound lifts. An explicit,
ascending set-by-set plan: weight climbs, reps descend
(e.g. `8×12 → 10×10 → 12×8`). When every set in the ladder hits its target
reps, the whole ladder steps up by a fixed weight increment next session.
Falling short on any set repeats the same targets. At the equipment ceiling
the whole ladder holds — never a partial advance of the lower sets, which
would quietly collapse the coach-authored spacing between sets.

**Rep-range (existing shape, minus RIR)** — bodyweight, band, timed
(seconds-mode) work, and loaded isolation accessories (curls, lateral
raises, flies). Fill the rep range first (add reps to the weakest set);
once every set tops the range, add load. Isolation work stays on two
straight working sets rather than a ladder — the goal there is quality
contraction across a short session, not per-session progressive overload.

An 'easier' readiness day defers load increases (rep-range) and drops the
top set of each ladder — filling the rep range, or the remaining lower sets
of a ladder, is still expected.

## Phase 1 program (20 Jul – 9 Aug, home gym)

The authoritative content is the coach's specification:
[`docs/programs/phase-1-home-v3-coach-spec.md`](./programs/phase-1-home-v3-coach-spec.md),
transcribed into the app's seed program — see that file for the full
session-by-session breakdown (Mon Chest & Back, Wed Legs & Core, Fri
Shoulders & Arms), equipment tier, and weekly calendar. This doc doesn't
duplicate that table; treat the coach spec as the source of truth and this
section as the "why," not the "what."

Scheduling is weekday-pinned, not A/B-rotated (`Program.schedulingMode`) —
every training weekday always offers the same session identity, so a
missed day never shifts what a later day offers.

## Phase 2 (10 Aug →, Fitness Park)

Program to be designed near the date; same principles, machine/heavier-load
progressions unlock once barbell and cable equipment are available again.
Architecture treats programs as data, so this is a content change, not a
code change.
