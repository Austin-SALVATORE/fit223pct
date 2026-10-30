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
- Load follows the verified home equipment (`docs/EquipmentProfile.md`).
  A prescription's `maxWeightKg` is the equipment ceiling. Since 29 Oct
  (`4fec4bb`) it is a warning shown above the ceiling and never a clamp
  on what you log. Swapped exercises show no warning.
- Recovery is tracked (sleep, energy, soreness, stress, motivation) and is a
  first-class input to training decisions — an 'easier' day drops the
  heaviest set of each ladder and trims accessory volume, never load.

## Two progression models

Every prescription is one of exactly two shapes (`docs/PyramidProgression.md`
is the full spec; this section is the summary).

**Pyramid / ladder (`setPlan`)** — primary compound lifts. An explicit,
ascending set-by-set plan: weight climbs, reps descend
(e.g. `8×12 → 10×10 → 12×8`).

**Rep-range (existing shape, minus RIR)** — bodyweight, band and timed
(seconds-mode) work, plus any loaded accessory the coach has not written
as weight × reps per set.

**Neither shape auto-increments (carry-forward, since 28 Aug, `99f27cf`).**
Each set starts where that set finished at the previous complete exposure.
Rungs that were skipped or never logged fall back to the authored rung.
Swapped and easier-day exposures are never a carry basis. The step-up
engines this section used to describe were retired in that commit;
`.claude/rules/architecture.md` (Progression model) is the current
summary.

**A swapped exercise suggests its own weights** (since 30 Oct, `c731222`;
coach CQ2, CC1–CC3). Each set starts from the weight logged at the same set
position in that exercise's most recent eligible exposure. An exposure is
eligible when it is in the same program, was not on an easier day, and is not
a substitute record logged before this rule. Weights always come from that
one exposure and are never mixed with older ones. A position with no such
history starts blank; pressing + or − there starts from the last weight
logged this session (owner OD-e, 29 Oct). The "Last time" line still shows
the most recent exposure, easier days included (CQ3), so the two can differ.

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

### Carry-forward is applied once, at workout start

Since the 28 Aug ruling each set starts where that set finished last time
(`src/domain/carryForward.ts`). That carry is applied **exactly once, when
the workout is created** (`TodayPage`'s start path stores
`carrySessionForward(...)`), so a workout's stored prescription *is* the plan
the athlete was asked to do. Set position, set counts, rest, the summary and
history all read that stored plan; the set and rest screens do not re-derive
it. Applying it at render time while position read the authored stored plan
let the two disagree whenever carry changed the set count (a completed
custom set was counted but never offered). A workout started before that
change keeps its authored numbers for that one session. Corollary: undoing a
previous workout mid-session does not change today's plan.

## Phase 1 program (20 Jul – 9 Aug, home gym)

The authoritative content is the coach's specification:
[`docs/programs/phase-1-home-v3-coach-spec.md`](./programs/phase-1-home-v3-coach-spec.md),
transcribed into the app's seed program — see that file for the full
session-by-session breakdown (Mon Chest & Back, Wed Legs & Core, Fri
Shoulders & Arms), equipment tier, and weekly calendar. This doc doesn't
duplicate that table; treat the coach spec as the source of truth and this
section as the "why," not the "what."

Phase 1's own scheduling is weekday-pinned, not A/B-rotated
(`Program.schedulingMode`) — every training weekday always offers the
same session identity, so a missed day never shifts what a later day
offers. **This does not carry over to Phase 2** (below) — Fit223 has no
single scheduling model, it is a per-program choice.

## Phase 2 (10 Aug →, Mesocycle 2 — Home Progressive)

The Fitness Park (gym-equipment) plan this section once described was
retired before it shipped: the coach's Mesocycle 2 continues at the same
15 kg-dumbbell home tier as Phase 1, rather than moving to gym machines
(`docs/design/Mesocycle2Implementation.md` §9, 6 Aug). Architecture still
treats programs as data, so this remains a content change, not a code
change — only the content itself moved.

The block now runs through 31 Dec 2026 by owner ruling of 8 Oct 2026: same
program id, same prescriptions, and carry-forward continues from the last
completed exposure.

Scheduling is **rotation**, not weekday-pinned (coach ruling, 7 Aug,
`~/.claude/plans/m2-rotation-switch.md`) — session identity follows how
many sessions have actually been completed, not the calendar; the
weekly calendar (`trainingWeekdays`) still decides *whether* a given day
is a training day, but not *which* session it offers. This reverses
Phase 1's model deliberately: `MissedDayDeferral.md` rulings 3, 4 and 7
name rotation as the canonical model, and Phase 1 was left pinned only
because it was already completed history by the time that ruling
shipped — re-modelling it would rewrite what the Plan page says
happened.
