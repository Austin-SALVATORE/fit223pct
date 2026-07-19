# Daily Program — Activity Days

**Status: designed, not yet implemented** (Milestone 6 — see Roadmap).
This brief is the spec the implementation is reviewed against. It
reshapes the raw request; the rejections at the bottom are decisions,
not omissions.

## Goal

A program stops being only a strength calendar: every day of the week
can carry an authored activity — strength (the existing rotation),
recovery, mobility, cardio, optional, or checkpoint — so opening the
app always answers "what should I do today?" with something real.
Strength volume does not increase; recovery days are intentional
content, not filler.

## Model (simplest that works)

`Program` gains an optional map:

```ts
weekdayActivities?: Partial<Record<IsoWeekday, ActivityTemplate>>

interface ActivityTemplate {
  kind: 'recovery' | 'mobility' | 'cardio' | 'optional' | 'checkpoint'
  title: string            // "Recovery walk & stretch"
  items: { label: string; detail?: string }[]
}
```

- Strength weekdays stay exactly as they are (`trainingWeekdays` +
  rotation). `weekdayActivities` may not claim a training weekday —
  import validation rejects the overlap.
- Activity items are **free-text program content**, not Library
  references — authoring a mobility-drill Library is a separate content
  project and must not gate this model. No weights, no logging, no
  prescriptions.
- Absent map = today's behavior, unchanged. Old programs, old exports,
  old snapshots all untouched.

## Behavior

- **Today** on an activity day: the activity replaces the bare rest
  hero — title, items, the same quiet tone. The readiness check-in,
  next-session preview, and early-start affordance all remain; the
  activity is guidance above them, not a gate in front of them.
- **No completion state. No "Mark Complete".** Skipping is always fine
  is the product's deepest promise; a checkbox on a walk is a streak
  mechanic in disguise. The check-in remains the only daily
  interaction. (Revisit only with a concrete decision-improving use for
  the data.)
- **Checkpoint days** are the exception with real input: they surface
  **weight and waist measurement fields** — writing the `CheckIn.weightKg`
  / `waistCm` columns that have existed since M3 with no UI to fill
  them — plus the existing weekly review. This unblocks the Progress
  page's waist trend, which today can never leave insufficient-data.
- **Plan page**: activity days appear in the day list by title, visually
  quieter than strength sessions. Past activity days show nothing about
  completion (there is none to show).
- **Import/export**: `weekdayActivities` joins the program schema —
  JSON field + a Markdown section per activity day; optional, validated
  (kinds from the closed set, non-empty titles/labels, no training-day
  overlap), round-trip tested. One schema, two syntaxes, as always.
- **Readiness** does not modulate activity days, and activity days do
  not feed readiness. No coupling in v1.

## Content bar

Every item must be as specific as a technique note ("30-minute easy
walk — conversational pace", "hip flexor stretch, 45s per side").
Generic wellness prompts ("hydrate well", "sleep early") are rejected
in review — that is the dashboard creep the Vision names.

## Rejected from the raw request (decisions, with reasons)

- **"Mark Complete" / any completion tracking on activity days** — see
  above.
- **"Cheat meal"** — nutrition is Later-scoped, and moralized food
  language fails the product's language rules.
- **Progress photos** — new media data type (storage, privacy); Later.
- **Library-backed mobility exercises** — content project, later; v1 is
  free-text.

## Sequencing

Milestone 6, before i18n (now M7): this feature adds a large batch of
user-facing strings and program content; the i18n descriptor refactor
should land after that content stabilizes, not before. The Phase 2
program file gains its activity days when this ships — it is already an
import file, so that is a content edit, not a migration.
