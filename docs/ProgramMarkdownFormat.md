# Program Markdown Format

Hand-authoring format for importing a program (see docs/DataPortability.md).
Parses to the exact same schema as JSON import — nothing expressible in one
and not the other. Meant to be writable on a phone.

## Structure

YAML front matter for program-level fields, then one `## Session: <id>`
section per session, each with a `Name:` / `Focus:` line and one table of
exercises.

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

| Exercise | Sets | Range | Mode | RIR | Rest | Weights | Note |
|---|---|---|---|---|---|---|---|
| barbell-squat | 3 | 8-12 | reps | 2 | 120 | 20/40/2.5 | Goblet squat is the substitution if the rack's busy |
| lat-pulldown | 3 | 8-12 | reps | 2 | 90 | 25/45/5 | - |
| plank | 2 | 20-40 | seconds | 2 | 60 | -/-/- | - |

## Session: B
Name: Session B
Focus: Hinge & press

| Exercise | Sets | Range | Mode | RIR | Rest | Weights | Note |
|---|---|---|---|---|---|---|---|
| romanian-deadlift | 3 | 10-15 | reps | 2 | 120 | 20/40/2.5 | - |
```

## Front matter fields

- `id`, `name` — free text.
- `phase` — integer.
- `startDate`, `endDate` — `yyyy-mm-dd`, or blank for an open-ended program.
- `trainingWeekdays` — ISO weekday numbers, `1` = Monday … `7` = Sunday.
- `rotation` — session ids, in rotation order (repeats allowed).

## Exercise table columns

Header-driven — column order doesn't matter, but names must match (case-
insensitive). Required: `Exercise`, `Sets`, `Range`, `Mode`, `RIR`, `Rest`,
`Weights`, `Note`. Optional: `Role`, `Per side` (both default when omitted).

- **Exercise** — an id from the Library. Unknown ids reject the whole
  import and name the offending id.
- **Sets** — integer.
- **Range** — `min-max`, e.g. `8-12`.
- **Mode** — `reps` or `seconds`.
- **RIR** — target reps-in-reserve, integer 0–10.
- **Rest** — seconds, integer.
- **Weights** — `start/max/step` in kg. Use `-` for any that don't apply
  (bodyweight, bands): `-/-/-`.
- **Note** — free text, or `-` for none.
- **Role** *(optional)* — `main` or `accessory`. Omit for `main`.
- **Per side** *(optional)* — `yes` or `no`. Omit for `no`.

## What's out of scope

Markdown export (JSON only — see docs/DataPortability.md), the exercise
Library itself (app-owned, not importable), anything about training
philosophy (the file is a schedule of sets/reps/weights, not a coach — a
structurally valid file imports regardless of what it prescribes).
