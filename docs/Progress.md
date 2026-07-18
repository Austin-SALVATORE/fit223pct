# Progress

Progress is a small set of honest facts, not a dashboard. Reached from a
quiet header link, never a permanent tile. No charts anywhere — the whole
app is phrase-driven, and a wall of sparklines would contradict that.

## Two acceptance criteria (non-negotiable)

1. **No trend from insufficient data.** Every trend function returns an
   explicit `insufficient-data` status with a plain-language reason instead
   of ever drawing a direction from too few points. Thresholds:
   - Strength: ≥3 qualifying sessions (weightless sessions on an otherwise
     weight-tracked exercise are excluded before that count, not coerced
     to a fabricated `0 kg` — see below).
   - Waist: ≥3 measurements spanning ≥14 days (3 measurements in one week
     is noise, not a trend).
   - Consistency: at least one day must have elapsed since the program
     started before a rate is shown.
2. **Every stagnation claim carries named evidence.** `detectStagnation`
   never says "stagnant" without the exact dated sessions and values that
   produced the claim — the UI renders that evidence, it doesn't summarize
   it away.

## Trends (`domain/trends.ts`)

- **Consistency**: completion rate over a trailing window (≤28 days, never
  before the program's start date, ending yesterday — today's session may
  not be done yet). Only completions that land on a scheduled weekday count
  toward the numerator, so the rate can never exceed 1 — an extra session
  on an unscheduled day is real effort, but it isn't "more of the schedule
  than the schedule has"; it simply doesn't move this number either way.
- **Strength**: direction for one exercise, judged across its most recent
  ≤6 qualifying sessions. Uses top weight when the exercise is loaded;
  falls back to best effort (reps/seconds) for bodyweight/band work. A
  session where no weight was logged on an otherwise weight-tracked
  exercise is **excluded**, not read as a `0 kg` data point — a fabricated
  zero is worse than either direction it could produce, and the ≥3
  threshold is re-checked after exclusion.
- **Waist**: same direction logic over check-in measurements.
- **Direction** compares the median of the first half of the window
  against the median of the second half, not just the two endpoints — one
  noisy reading (measurement error, an off day) at either end shouldn't
  flip the whole verdict. With exactly three points (the minimum) this is
  mathematically identical to comparing the two endpoints; there's no more
  robust option with that little data.

Screen design: exercises never logged at all get no card (nothing to
report). Exercises with 1–2 sessions are named quietly in a single grouped
list ("gathering data"), not given a repeated paragraph each — a wall of
identical "not enough data yet" cards is noise, not information.

## Stagnation (`domain/stagnation.ts`)

Compares the three most recent **qualifying** sessions for an exercise —
qualifying meaning NOT run on an `easier` readiness day, since a
deliberately deferred load increase (docs/Readiness.md) is not a plateau.

Progress on **either** weight or effort counts — the two are never
collapsed into one scalar. Double progression (docs/Training.md) means
weight is *expected* to hold flat for weeks while reps climb toward the
top of the range; that is the program working exactly as designed, not a
plateau, and a flat weight with rising reps must never read as stagnant.
Only when neither dimension moved across the whole window is it a genuine
stall. The evidence shown always displays both weight and reps when weight
is present — hiding either would hide the very thing that makes a claim
correct or incorrect.

`stagnant` carries the exact dated evidence and a single substitution
suggestion (the exercise's first listed alternative).

## Weekly review (`domain/weeklyReview.ts`)

Reviews the week just finished. Deliberately not a trend — it reports only
what happened in that one week (including zero), so there is no
insufficient-data case: a quiet week is a true, reportable fact.

Not gated to Monday: a fixed day-of-week trigger makes the feature
attendance-dependent — miss opening the app that one day and the review
never appears at all. Instead, a review stays available on **every** open
until the user has seen it once, whichever day that happens to be, then it
is gone for that week (`UserSettings.lastSeenWeeklyReviewWeekStart`,
written the moment the card is shown). The decision to show it is locked
in for the lifetime of that page view, so the card never disappears out
from under the user mid-session just because the "seen" write landed.
