# Data Portability — Program Import & Data Export

**Status: designed, not yet implemented** (Milestone 5, ahead of Phase 2
authoring — see Roadmap). This brief is the spec the implementation is
reviewed against.

## Why

Programs are already data (Dexie), but the *authoring path* is hardcoded:
`src/data/seed/program.ts` is TypeScript compiled into the bundle. The
user must be able to bring their own program without a code change, and
to take their data out — a local-first app owes its user an exit. The
exercise **Library stays app-owned**: it ships with the app as the
persistent datasource; imports reference it, never replace it.

## Import

- **Formats: JSON (canonical) and Markdown (human-authoring).** One
  schema; Markdown parses *to* the JSON schema, adding nothing. JSON
  mirrors the `Program` domain type. Markdown format: front-matter for
  program fields (name, phase, dates, training weekdays, rotation),
  one section per session, a table per session's exercises (exercise
  id, sets, range, mode, RIR, rest, weights, note). Format documented
  with a complete example file in `docs/` when built.
- **Validation at the boundary, strict, whole-file:** schema-validated
  (Zod — add the dependency; hand-rolled validation of nested
  structures is how silent corruption happens). Every exercise id must
  exist in the Library — unknown ids reject the import and name the
  offending line/id. A file either imports completely or not at all;
  no partial writes. Errors are human sentences, not stack traces.
- **Import is upsert with consent:** importing an id that already
  exists asks before replacing (two-step, like discard-session).
  **Import never touches workout history** — workouts reference
  `programId` and survive a program replacement untouched.
- **Structure is validated; training philosophy is not.** If the file
  schedules seven days a week, the app imports it. The import surface
  is sovereignty, not a coach — the readiness engine remains the
  in-app voice on load management.
- **Surface** (revised 19 Jul after first real use): Import program /
  Export program as a single-line two-button row on the Plan page (the
  program surface). **Export all data moves to Settings** — it is an
  app-level backup, not a program action.

  **Settings entry (revised again 19 Jul, after the language switcher
  made Settings a destination, not a corner):** one consistent gear
  icon, top-right of the page header, on **every AppShell page** —
  Today, Plan, Progress, Library — always the same position, icon-only
  with `aria-label`, ≥44px target, via one shared component (no four
  hand-rolled copies). **Deliberately absent from Workout Mode**: a
  training session is the one surface where no app chrome competes
  with the set in front of you; Settings is one tap away after ✕.
  `/settings` remains the deliberately minimal page: backup export +
  language switcher, nothing that hasn't earned the room.

## Export

- **Program export**: any program as canonical JSON — byte-compatible
  with import (round-trip is the acceptance test).
- **Full data export**: one JSON file — programs, workouts, check-ins
  (readiness history), settings. This is the backup story for a
  local-first app and the manual precursor of cloud sync at the same
  repository seam. Library is *not* exported (app-owned datasource,
  re-seeded on any fresh install).
- Delivery: Web Share API where available, download fallback.
  Filenames dated (`fit223-export-2026-08-01.json`).

## Sequencing note

Phase 2 (Fitness Park) should be **delivered as the first imported
program file**, not as more seed code — it dogfoods this pipeline the
week it's built and proves the format on real content. Phase 1 stays
seeded (it's live mid-phase; migrating it buys nothing).

## Record: the "every two days" question (19 Jul)

The Plan page showing Mon/Wed/Fri is **correct display of the authored
program**, not a bug: Phase 1 was designed as 3 full-body days with
each muscle group ~2×/week (docs/Training.md) — recovery days are part
of the program, with tennis/swimming free on the others. A daily
program is the user's call to make — import gives them that control —
but it is a *content* decision, and the evidence-informed default
remains rest between same-pattern loading.

## Amendment (19 Jul): program-defined substitutions

Prescriptions gain optional `substitutionIds?: string[]` — *contextual*
fallbacks a program declares per exercise (e.g. Phase 2's barbell squat
falls back to goblet or split squat when the rack is taken), layered on
top of the Library's generic `Exercise.substitutionIds`.

- **One resolver in domain**: `effectiveSubstitutions(prescription,
  exercise)` — program-defined first, then Library generics, deduped,
  never the exercise itself. SwapSheet **and** stagnation's suggested
  substitution both use it; nothing else may re-derive the merge.
- **Import validation** (when present): array of non-empty strings, no
  duplicates, must not contain the prescription's own `exerciseId`,
  every id must exist in the Library. Optional — files without the
  field import unchanged.
- **Markdown parity**: the exercise table gains a `Substitutions`
  column (comma-separated ids). One schema, two syntaxes — always.
- **Export** includes the field when present; round-trip still the
  acceptance test. Prescriptions are snapshotted into workouts, so
  program-defined substitutions survive later program edits.

**Deliberately rejected**: per-prescription `equipment` strings.
`Exercise.equipment` (typed) already exists in the app-owned Library
and answers the informational-display use case with zero format
changes; a free-string shadow copy per prescription would be a second,
weaker source of truth. Revisit only as explicit *override* semantics
if a real program ever needs them.

## Out of scope (deliberate)

Library import/editing (app-owned; revisit only if a real program
needs an exercise the library lacks), Markdown *export*, CSV, cloud
sync (later, same seam), import of workout history from other apps.
