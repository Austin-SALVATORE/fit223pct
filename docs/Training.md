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

**Rep-range (existing shape, minus RIR)** — bodyweight, band and timed
(seconds-mode) work, plus any loaded accessory the coach has not written
as weight × reps per set. Fill the rep range first (add reps to the
weakest set); once every set tops the range, add load.

A loaded isolation movement may be either shape, and **the exercise does
not tell you which** — only the presence of `setPlan` does. Since 31 Jul
the Shoulders & Arms accessories (lateral raise, rear delt fly, curl) are
ladders, while `rear-delt-fly` remains a rep range in Chest & Back. Same
id, different model, different session.

**Consequence for readiness easing:** a ladder is eased by dropping its
top rung, floored at one rung (`MIN_LADDER_RUNGS`, `domain/adjustments.ts`)
— a two-rung ladder now eases to one, and a one-rung ladder is already at
the floor and cannot be eased further. A rep range is eased by cutting a
set.

> **Coach ruling, 31 Jul — fulfilled, not reversed, by the owner's ruling
> that followed it.** The 31 Jul ruling had two parts. The first still
> holds exactly as written: **do not "fix" this in the program.** No rung
> is added to any ladder to route around the engine — the prescription
> states the intended stimulus for a normal training day, and *"the
> baseline program should not be authored around the limitations of the
> current easing rule."*
>
> The second part was a promise, left open at the time: *"if low-readiness
> sessions prove too demanding, the readiness model is what changes —
> easing a two-rung ladder by load or by reps rather than by removing a
> rung. That work is open and unowned; until it exists, the reduced easing
> is accepted behaviour."* The owner has since ruled that work in: the rung
> floor moves from two to one, so a two-rung ladder eases the same way a
> three-rung one always has. Nothing here reopens the first part of the
> ruling — the prohibition on authoring around the engine is unaffected by
> where the engine's own floor sits.
>
> This is the standing shape of the boundary: program content answers to
> the coach, and the engine adapts to it — never the reverse.

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
