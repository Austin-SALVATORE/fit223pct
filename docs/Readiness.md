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
- One severe signal (sleep = 1 or freshness = 1) forces `easier` regardless
  of anything else — a lone terrible signal is a real red flag, so it's
  the one case that doesn't need a second data point.
- Otherwise, at least **two** answered signals are required to leave
  `steady` — a single low rating (e.g. motivation alone, the
  least-weighted signal) is too thin a sample to carry full authority.
- With two or more answered signals: weighted average (sleep .30, freshness
  .25, energy .20, calm .15, motivation .10, normalized 0–1) — ≥ .70 ready,
  ≥ .45 steady, else easier.
- Partial check-ins use only answered signals; empty/no check-in → steady.
- `drivers` name the low signals ("short sleep") — every downstream message
  derives from them; nothing is unexplainable.
- `consecutiveLowDays` counts a trailing run of `easier` days ending today,
  where each prior day must be **exactly one calendar day** before the
  next — a gap (a missed check-in, or a stale record from weeks ago) breaks
  the streak. This is a date walk, not a count of matching records, so a
  streak can never be inflated by history that isn't actually contiguous.

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

Every adjustment carries a driver-derived reason, rendered quietly under the
"Adjusted for readiness" label next to the changed numbers on Today. The
user can always override: steppers and the RIR picker set defaults, never
limits.

## Persistence

`Workout.readiness` stores `{ tier, drivers: ReadinessSignal[] }` —
**signal keys, not display copy**. Labels are derived at render time
(`describeDriverSignals`), so stored workouts stay analyzable even after
wording changes, and future intelligence (e.g. M4 stagnation detection)
never has to string-match English sentences.

## Check-in card lifecycle

Once today's session has started (in progress or completed), the check-in
card locks: the readiness that shaped that session is fixed, so further
taps can't retroactively change it. The card shows the day's tier phrase
(or "Not recorded today") plus a quiet note that edits now apply from
tomorrow — never a dead control that looks interactive but silently does
nothing.

## Accessibility

The 1–5 and RIR pickers (`ui/RatingPicker.tsx`) are plain labelled toggle
buttons (`aria-pressed`), not `role="radio"` — the ARIA radio pattern
promises arrow-key roving-tabindex navigation this app doesn't implement,
and claiming it would promise screen-reader behavior that isn't there. Tab
moves through every option; Enter/Space selects.
