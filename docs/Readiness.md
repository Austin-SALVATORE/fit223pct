# Readiness

The check-in is not the feature. The feature is readiness flowing into
training decisions: the plan you see today already accounts for how you
slept last night. Product language is always **readiness** — never
"recovery score", "wellness", or anything medical-sounding. Readiness stays
subordinate to training: the user opens the app to train.

## Signals

Five subjective items (Hooper-style wellness questionnaire), each rated
1–5 where **5 is always the good end**: sleep, energy, freshness (inverse
soreness), calm (inverse stress), motivation. Five taps, auto-saved,
under ten seconds. Skipping is always fine — no badges, no streaks, no
nagging; a missing check-in means neutral readiness.

Evidence note: subjective wellness measures respond sensitively to training
load (Saw et al. 2016, systematic review). The specific weights and
thresholds below are coaching heuristics — reasonable, explainable, and
tunable once real data accumulates — not clinical claims.

## Model (`domain/readiness.ts`)

Output is **categorical, never numeric** — a percentage would be false
precision.

- Tiers: `ready | steady | easier`.
- Weighted average of answered signals (sleep .30, freshness .25, energy
  .20, calm .15, motivation .10, normalized 0–1): ≥ .70 ready, ≥ .45
  steady, else easier.
- One severe signal (sleep = 1 or freshness = 1) forces `easier` regardless
  of the average.
- Partial check-ins use only answered signals; empty/no check-in → steady.
- `drivers` name the low signals ("short sleep") — every downstream message
  derives from them; nothing is unexplainable.
- `consecutiveLowDays` counts the trailing run of easier days (trend seed
  for future fatigue modeling).

## Modulation (`domain/adjustments.ts`, `domain/progression.ts`)

Small, capped, asymmetric — pulling back is better supported than pushing
harder, so `ready` days change nothing.

On an `easier` day:
- +1 target RIR on every exercise (capped at 4);
- one set less on accessories (`role: 'accessory'`, never below one set,
  main lifts untouched);
- the progression engine defers load increases (`consolidate`) — the earned
  jump is suggested again on a fresher day;
- at 2+ consecutive low days, Today additionally suggests making it a rest
  day. Because session identity derives from completed count, resting simply
  postpones — no state change, no penalty, nothing skipped.

Every adjustment carries a driver-derived reason shown quietly in the UI.
The user can always override: steppers and the RIR picker set defaults,
never limits. Workouts store the applied readiness (tier + drivers) for
future intelligence.
