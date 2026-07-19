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
- **Surface:** quiet Import/Export actions on the Plan page (the
  program surface). No new nav entry.

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

## Out of scope (deliberate)

Library import/editing (app-owned; revisit only if a real program
needs an exercise the library lacks), Markdown *export*, CSV, cloud
sync (later, same seam), import of workout history from other apps.
