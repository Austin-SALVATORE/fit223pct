# Roadmap

## Milestone 1 — Foundations ✓ (shipped 18 Jul)

Stable, runnable app: tooling, design tokens, data layer with seeded exercise
library + Phase 1 program, pure domain logic (scheduling, double progression)
with tests, app shell, functional Today page and exercise library.

## Milestone 2 — Workout mode ✓ (shipped 18 Jul)

The heart of the product. Full-screen session flow: one set at a time,
progression-engine pre-fills, rest timer with in-rest coaching, substitutions,
write-through persistence with exact resume, completion summary. Navigation
reworked: no tab bar — Today is the app. Asset strategy documented
(docs/ExerciseAssets.md).

## Milestone 3 — Adaptive Readiness Engine ✓ (shipped 18 Jul)

Not passive tracking: a categorical readiness model (ready/steady/easier,
driver-based, explainable — docs/Readiness.md) computed from a five-tap
check-in, flowing into prescriptions (+1 RIR, accessory trim, deferred load
jumps) with trend-based rest-day suggestions. Weight/waist trends, progress
screens and the weekly review move to Milestone 4.

## Milestone 4 — Progress & intelligence ✓ (shipped 18 Jul)

An Adaptive Readiness Engine that only tracked recovery would be a logger
with an extra field. This closes the loop: consistency, strength, and
waist trends (docs/Progress.md) — each with an explicit insufficient-data
state, never a direction drawn from too few points — plus stagnation
detection that excludes readiness-adjusted sessions from the stall count
and states its evidence by name, the same way readiness does. A weekly
review reports the week just finished, honestly, including zero, and
appears on the first open after the week ends rather than a fixed day.
No charts anywhere — phrase-driven, consistent with the rest of the app.

Review-patched same day: stagnation and strength trend both used to
collapse weight and reps into one scalar or coerce a missing weight to
`0` — either could turn the program's own double-progression pattern
(flat weight, climbing reps) into a false "stagnant" claim. Trend
direction moved from comparing two endpoints to comparing half-window
medians; the consistency rate is now bounded at 1; the weekly review is no
longer Monday-only. See docs/Progress.md.

## Milestone 5 — Polish & Phase 2

PWA install/offline hardening, motion polish pass, accessibility audit,
Fitness Park (gym equipment) program for Phase 2, program transition UX.

Added from field use (19 Jul): the **Plan page** (docs/Plan.md) — browse
the whole program: any date's session (past = facts, future = labeled
projections; rotation follows completed count, so projections must say
they shift), and navigate between phases. Pairs naturally with Phase 2
authoring and the transition UX, since phase navigation needs a second
program to browse.

Added 19 Jul, sequenced **before Phase 2 authoring**: **data
portability** (docs/DataPortability.md) — program import from JSON
(canonical) and Markdown (authoring format), strict whole-file
validation against the app-owned Library, upsert-with-consent, history
never touched; program export (round-trip) and full data export
(programs + workouts + check-ins + settings) as the local-first backup
story. Phase 2 ships as the first *imported* program file, dogfooding
the pipeline on real content.

Pre-flight (real-device pass ahead of Phase 1's 21 Jul start): offline font
caching, iOS home-screen install meta tags, safe-area padding so the status
bar no longer overlaps installed-PWA headers. Landed early, ahead of the
rest of the milestone: an early-start affordance — rest days and
pre-program days offer a quiet "Start this session now" action below the
session preview, so training ahead of schedule is always possible without
being the recommendation — and a tap-to-start hold timer for seconds-mode
sets (side plank and similar), which pre-fills the manual seconds Stepper
on stop rather than replacing it.

## Milestone 6 — Daily Program

Programs evolve from strength calendars into daily fitness programs
(docs/DailyProgram.md): every weekday can carry an authored activity —
recovery, mobility, cardio, optional, or checkpoint — without touching
the strength rotation or increasing training volume. Checkpoint days
add the app's first weight/waist measurement input (the CheckIn columns
have existed since M3 with no UI), unblocking the waist trend. No
completion tracking on activity days — skipping is always fine is
non-negotiable. Extends the import format (optional, back-compatible);
Phase 2's file gains its activity days as a content edit.

## Milestone 7 — Internationalization ✓ (shipped 20 Jul)

English, French, Simplified Chinese (docs/I18n.md). Not a string sweep:
the deep work was refactoring domain functions to return message
descriptors instead of English prose, and moving seeded content
(exercise names, cues) to locale-keyed lookup — storage stays
locale-free. Ships the app's first Settings surface, reachable from every
page (a gear alongside Today's nav links, or in the corner of Plan's,
Progress's, and Library's headings — never in Workout Mode), with
auto-detection, `UserSettings.locale` persistence, live switching with no
reload, and English fallback that's never silent (a missing key logs in
dev). Terminology constraints (readiness, never wellness/medical) hold
in French and Chinese too, each gated on a native reader's glossary
review before being called shipped (docs/I18n-glossary-fr.md,
docs/I18n-glossary-zh.md). docs/I18n-adding-a-locale.md documents what a
fourth locale actually requires.

## Later (architecture-ready, not scheduled)

Cloud sync · Apple Watch · nutrition · wearables · advanced analytics.
