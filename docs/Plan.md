# Plan

**Status: designed, not yet implemented** (planned into Milestone 5 —
see Roadmap). This brief is the spec the implementation is reviewed
against.

Today answers "what do I do now?". The Plan page answers the two
questions Today deliberately refuses: "what does any other day hold?"
and "what is this program, as a whole?" It is a reference surface, like
the Library — it supports the workout and never competes with it. Today
remains the app.

## What it is

A single page at `/plan`, reached from a quiet header link on Today
(alongside Progress and Library). Phrase-driven, list-based — no
calendar grid, consistent with no-charts-anywhere. Three layers, top to
bottom:

1. **Phase header** — name, date range, focus, training weekdays, and
   the session rotation stated in a sentence ("A and B alternate,
   Mon / Wed / Fri").
2. **Day list, grouped by week** — every scheduled day of the phase in
   chronological order:
   - **Past days** state facts only: the session that was completed
     (name, sets, volume one-liner) or a plain em-dash for a scheduled
     day with no workout. No "missed", no streaks, no guilt copy — a
     skipped day never skips a session, and the list must read that
     way.
   - **Today** is marked and links back to Today.
   - **Future days** show the *projected* session.
3. **Phase navigation** — previous / next links between programs
   (ordered by `startDate`), so Phase 2 is browsable the moment it is
   authored. The current phase is the default view.

## The honesty rule (the one hard constraint)

Session identity derives from **completed count, not the calendar**
(`resolveDayPlan`). A future date's session is therefore a projection
that assumes every scheduled session between now and then gets
completed — miss one, and everything after it shifts. The page must say
so, once, quietly: future sessions are labeled as projected, with one
line explaining that the rotation follows what you complete, not the
date. Anything else fabricates certainty the model doesn't have — the
same false-precision trap readiness and trends were built to avoid.

Readiness adjustments are **never** projected onto future days — they
exist only on the day they're measured.

## Implementation shape

- **Domain** (`domain/schedule.ts`): a pure
  `projectSchedule(program, workouts, today)` returning the full
  phase's day entries — past entries reconciled against actual workouts
  by date, future entries projected by walking completed-count forward
  across scheduled weekdays. Tested for: rotation across an unlogged
  scheduled day (everything shifts, nothing skips), phase boundaries,
  early-started (unscheduled-day) workouts appearing on their actual
  date, and today landing in the right bucket.
- **Data**: `programRepo.getAll()` (ordered by `startDate`) — the only
  repository addition.
- **UI** (`features/plan/`): `PlanPage` + a week-grouped `GroupedList`
  reuse. Session names link to nothing in v1 — the Library covers
  exercise detail; a per-workout detail view is explicitly out of
  scope until something proves the need.
- **A11y**: list semantics; route-change focus and title come free from
  AppShell's existing handling.

## Amendment (19 Jul): day detail — every row clickable

v1 deferred a per-day view "until something proves the need"; first
real use proved it. Every day row navigates to `/plan/:date` (today's
row keeps linking to Today — that page *is* today's detail). The
detail shows, by day state:

- **Completed workout day** — facts: session name, per-exercise logged
  sets (weight × reps/seconds, RIR), and the summary line (sets,
  volume, duration). This is the app's first past-workout view; it
  states what happened and interprets nothing (Progress owns
  interpretation).
- **Future training day** — the projected session via the existing
  `SessionPreview`, carrying a "Projected" label and the honesty line.
  Readiness is never applied to future days.
- **Activity day** — the activity's title and items, same display
  vocabulary as Today's activity hero at list scale.
- **Past scheduled day, nothing logged** — an honest empty state:
  nothing was logged, the session shifted forward, nothing was lost.
  Never a fabricated "would-have-been" session.
- **Unknown/out-of-phase date** — a quiet "not part of this phase"
  with the back link; never a crash.

Exercise names link to the Library with contextual back-navigation
(existing `navigationOrigin` pattern). The date resolves its program
across phases with the same semantics as `programRepo.getActive`.
Rows use the existing `GroupedRow` link affordance — visibly tappable,
consistent with the Library.

## Out of scope (deliberate)

Editing the schedule, dragging sessions, per-day notes, a month-grid
calendar, projecting readiness, and any summary statistics (Progress
owns interpretation; Plan states structure).
