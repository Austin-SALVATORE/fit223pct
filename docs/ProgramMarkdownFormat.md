# Program Markdown Format

Hand-authoring format for importing a program (see docs/DataPortability.md).
Parses to the exact same schema as JSON import — nothing expressible in one
and not the other. Meant to be writable on a phone.

## Structure

YAML front matter for program-level fields, then one `## Session: <id>`
section per session (each with a `Name:` / `Focus:` line and one table of
exercises), plus an optional `## Activity: <Weekday>` section per activity
day (see docs/DailyProgram.md).

```markdown
---
id: phase-2-gym
name: Phase 2 — Gym
phase: 2
startDate: 2026-08-10
endDate:
trainingWeekdays: [1, 3, 5]
rotation: [A, B]
---

## Session: A
Name: Session A
Focus: Squat & pull

| Exercise | Sets | Range | Mode | Rest | Weights | Ladder | Note | Substitutions |
|---|---|---|---|---|---|---|---|---|
| goblet-squat | 3 | - | reps | 120 | -/14/2 | 8x12 / 10x10 / 12x8 | - | bulgarian-split-squat |
| lat-pulldown | 3 | 8-12 | reps | 90 | 25/45/5 | - | - | single-arm-db-row |
| plank | 2 | 20-40 | seconds | 60 | -/-/- | - | - | - |

## Session: B
Name: Session B
Focus: Hinge & press

| Exercise | Sets | Range | Mode | Rest | Weights | Note |
|---|---|---|---|---|---|---|
| romanian-deadlift | 3 | 10-15 | reps | 120 | 20/40/2.5 | - |

## Activity: Tuesday
Kind: recovery
Title: Recovery walk & stretch

- 30-minute easy walk — conversational pace
- Hip flexor stretch — 45s per side

## Activity: Sunday
Kind: checkpoint
Title: Weekly checkpoint

- Weight and waist measurement — same time of day each week
```

## Front matter fields

- `id`, `name` — free text.
- `phase` — integer.
- `startDate`, `endDate` — `yyyy-mm-dd`, or blank for an open-ended program.
- `trainingWeekdays` — ISO weekday numbers, `1` = Monday … `7` = Sunday.
- `rotation` — session ids, in rotation order (repeats allowed).

## Exercise table columns

Header-driven — column order doesn't matter, but names must match (case-
insensitive). Required: `Exercise`, `Sets`, `Range`, `Mode`, `Rest`,
`Weights`, `Note`. Optional: `Role`, `Per side`, `Substitutions`, `Ladder`
(all default when omitted).

Every row is either a **rep-range** prescription or a **ladder** (pyramid)
prescription — never both, never neither (see docs/PyramidProgression.md).
Which one a row is is decided by whether its `Ladder` cell is filled, not
by any other column.

- **Exercise** — an id from the Library. Unknown ids reject the whole
  import and name the offending id.
- **Sets** — integer. For a ladder row this must equal the number of
  rungs in the `Ladder` cell.
- **Range** — `min-max`, e.g. `8-12`, for a rep-range row. Must be `-` on
  a ladder row (a ladder has no rep range — each rung has its own fixed
  reps instead).
- **Mode** — `reps` or `seconds`. A ladder row must be `reps` — there's
  no timed-hold ladder.
- **Rest** — seconds, integer.
- **Weights** — `start/max/step` in kg. Use `-` for any that don't apply
  (bodyweight, bands): `-/-/-`. On a ladder row the `start` slot is
  unused (the ladder's own first rung is the effective start weight) —
  write it as `-`, e.g. `-/14/2`; `max`/`step` still mean what they say:
  the equipment ceiling and the amount every rung advances by, together,
  once a full ladder is completed.
- **Ladder** *(optional)* — rungs separated by `/`, each written
  `weightxreps` — weight first, then reps, e.g. `8x12 / 10x10 / 12x8`
  (climbing weight, descending reps, top rung last). Leave `-` for a
  rep-range row. Weights must be ascending or equal rung to rung.
- **Note** — free text, or `-` for none.
- **Role** *(optional)* — `main` or `accessory`. Omit for `main`.
- **Per side** *(optional)* — `yes` or `no`. Omit for `no`.
- **Substitutions** *(optional)* — comma-separated Library ids, or `-`
  for none. These are *contextual* fallbacks this program declares for
  this slot (e.g. "the rack's taken") — layered over whatever generic
  substitutions the Library already lists for the exercise, never
  replacing them. Same rules as Exercise: every id must exist in the
  Library, none may repeat, and the exercise can't list itself.

## Activity sections

`## Activity: <Weekday>` — the full weekday name (`Monday` … `Sunday`,
case-insensitive), never a number or abbreviation. Optional entirely; a
file with no Activity sections behaves exactly as before. A weekday named
here may **not** also appear in `trainingWeekdays` — import rejects the
overlap, naming the weekday.

- `Kind:` — one of `recovery`, `mobility`, `cardio`, `optional`,
  `checkpoint`. Closed set; nothing else is accepted.
- `Title:` — free text, shown in place of the bare rest day.
- Items are a bullet list, one `- ` per line. `- Label — Detail` splits on
  the first ` — ` (a real em dash, spaced) into `label`/`detail`; a line
  with no ` — ` is `label` only. Every item must be as specific as a
  technique note — generic wellness prompts ("hydrate well") are a review
  rejection, not a format error, but write real content regardless.

## What's out of scope

Markdown export (JSON only — see docs/DataPortability.md), the exercise
Library itself (app-owned, not importable), anything about training
philosophy (the file is a schedule of sets/reps/weights, not a coach — a
structurally valid file imports regardless of what it prescribes).
