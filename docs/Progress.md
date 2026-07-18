# Progress

Progress is a small set of honest facts, not a dashboard. Reached from a
quiet header link, never a permanent tile. No charts anywhere — the whole
app is phrase-driven, and a wall of sparklines would contradict that.

## Two acceptance criteria (non-negotiable)

1. **No trend from insufficient data.** Every trend function returns an
   explicit `insufficient-data` status with a plain-language reason instead
   of ever drawing a direction from too few points. Thresholds:
   - Strength: ≥3 qualifying sessions.
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
  not be done yet).
- **Strength**: direction (increasing/steady/decreasing) for one exercise,
  judged across its most recent ≤6 qualifying sessions. Uses top weight
  when the exercise is loaded; falls back to best effort (reps/seconds)
  for bodyweight/band work.
- **Waist**: same direction logic over check-in measurements.

Screen design: exercises never logged at all get no card (nothing to
report). Exercises with 1–2 sessions are named quietly in a single grouped
list ("gathering data"), not given a repeated paragraph each — a wall of
identical "not enough data yet" cards is noise, not information.

## Stagnation (`domain/stagnation.ts`)

Compares the three most recent **qualifying** sessions for an exercise —
qualifying meaning NOT run on an `easier` readiness day, since a
deliberately deferred load increase (docs/Readiness.md) is not a plateau.
If none of the three improved on the one before it, the exercise is
`stagnant`, with the exact dated evidence and a single substitution
suggestion (the exercise's first listed alternative).

## Weekly review (`domain/weeklyReview.ts`)

Monday only, reviewing the week just finished. Deliberately not a trend —
it reports only what happened in that one week (including zero), so there
is no insufficient-data case: a quiet week is a true, reportable fact.
Appears as a card on Today for that one day, never a permanent tile.
