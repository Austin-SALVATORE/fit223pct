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

## Milestone 5 — Polish & Phase 2 ✓ (shipped)

PWA install/offline hardening, motion polish pass, accessibility audit,
Fitness Park (gym equipment) program for Phase 2, program transition UX.

**Retracted 6 Aug:** the Fitness Park program never shipped to the owner
and was retired before its start date — the coach's Mesocycle 2 continues
Phase 2 at the *home* tier instead (`docs/design/Mesocycle2Implementation.md`
§9). Its markdown file and both test files that depended on it were
deleted the same day. The transition UX and Plan page below stay; only
the gym content did not.

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
story. The plan then was for Phase 2 to ship as the first *imported*
program file, dogfooding the pipeline on real content — retracted with
the Fitness Park program above; Mesocycle 2 is seeded directly per the
coach's spec §3, so the import pipeline's dogfooding is still pending.

Pre-flight (real-device pass ahead of Phase 1's 21 Jul start): offline font
caching, iOS home-screen install meta tags, safe-area padding so the status
bar no longer overlaps installed-PWA headers. Landed early, ahead of the
rest of the milestone: an early-start affordance — rest days and
pre-program days offer a quiet "Start this session now" action below the
session preview, so training ahead of schedule is always possible without
being the recommendation — and a tap-to-start hold timer for seconds-mode
sets (side plank and similar), which pre-fills the manual seconds Stepper
on stop rather than replacing it.

## Milestone 6 — Daily Program ✓ (shipped)

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

## Milestone 8 — Pyramid Progression ✓ (shipped 23 Jul)

Owner-directed pivot after the first real workout (docs/
PyramidProgression.md): loaded lifts move from RIR-gated double
progression to classical ascending-weight set ladders — explicit
per-set weight×rep targets, ladder-steps-up-on-completion progression,
RIR purged entirely — UI, schema, and stored data (owner ruling,
Dexie v3 migration). Readiness's easing
lever becomes "drop the top set." Bodyweight, band, and timed work keep
the rep-range model — pyramid is the primary model for loaded lifts,
not the only model. Import/export gain the ladder syntax,
back-compatible. Shipped alongside: weekday-pinned scheduling
(sessions carry fixed day identities — Mon Chest & Back, Wed Legs &
Core, Fri Shoulders & Arms — per the coach's v3 spec, which the seed
now transcribes directly), and the seed-clobber guard protecting
imported programs from reseeding.

Rides with M8 (owner decision, same first-workout feedback): the **Home
equipment tier** — Home programs assume adjustable dumbbells + bench
only; no barbell, rack, cables, bands, or spotter-dependent lifts.
Requires a **Library expansion** first: promote dumbbell-bench-press,
dumbbell-shoulder-press, and rear-delt-fly (art exists, no Library
entries) and add dumbbell-rdl (needs art). Phase 1 is then re-authored
by the owner's coach as a pyramid, dumbbell-only import file; the seed
program follows in the same batch.

## Post-M8 review backlog (docs/review-backlog.md, 27 Jul)

A parallel accessibility / i18n / dead-code review surfaced a fixable
batch: two a11y blockers (focus destroyed at swap-confirm and the fifth
check-in rating), one live i18n bug on Today (in-progress hero renders
untranslated), and a systemic guard — a lint asserting no seed field is
read directly outside the i18n hooks — that retires the whole class the
weekdayActivities bug belonged to. Two owner decisions and one
sequencing constraint are called out in the doc.

**Status, verified 30 Jul — mostly done, and this file said otherwise
for three days.** All four Blockers and all nine Serious items are
fixed, except **A5**, which the **owner closed on 30 Jul** having looked
on device and observed no problem. The 1.26:1 measurement stays on the
record, so it reopens if the app ever has a second user. The §4 systemic
guard landed as `src/i18n/seedFieldAccess.guard.test.ts`.

What actually remains:

- **Minor tier (§3)** — I4 and A10 are now closed. A10 had first been
  made *worse*: hold-acceleration took the Stepper's live region from
  ~7 announcements/sec to a measured 18 in a two-second hold, because
  the accessibility backlog was not consulted when acceleration was
  ruled. **A9 and A12 are confirmed still open**, with drifted line
  references. I5, I6, A11, A13 and A14 are **unverified** — nobody has
  looked, which is not the same as fine.
- **Dead-code, non-locale scope** (unused exports, stale docs, dead
  fixtures) — **still unaudited**, unchanged since 27 Jul.

The general lesson outlives the tally: **a fix list nobody annotates
becomes a list of things that look undone.** Twelve items were fixed and
recorded nowhere, and the board was reported wrong from this file until
someone checked the code instead of the document.

## Milestone 9 (proposed, ON HOLD — owner decision 22 Jul) — Smart Connector

Phase 0 investigation complete and preserved (docs/design/SmartConnector.md):
Apple Health becomes the single integration boundary (Apple Watch
natively; the Xiaomi 8-electrode scale via Mi Fitness's Health sync),
read through a Capacitor-wrapped build of the existing web app — the
readiness engine gains objective drivers (sleep, resting HR, HRV,
external load) alongside the subjective check-in, with
subjective-wins fusion and pyramid-era recommendation levers.
Reduced scope approved-for-consideration: Phases 0–3 only; workout
write-back and the watch app are separate future milestones; BLE and
Xiaomi cloud rejected. Blocked behind M8 and the owner decisions in
the doc's §11.

## Milestone 10 ✓ (shipped 30 Jul) — User profile & energy baseline

**Closed 30 Jul**, verified item by item against `docs/UserProfile.md`:
`profileConfirmedAt`, required sex, birth date rather than a stored age,
targets, the persisted PAL band, Mifflin + Cunningham + FAO/WHO/UNU
constants with their provenance, the `sedentary.min > 1.2` guard, the
predict-nothing guard, weight and body-fat trends, and all-three-bands
maintenance when no band is stated. Four phases in the required order
plus the PAL band selector.

Two defects of the *same class* were found and fixed inside the
milestone written to prevent it — a guess becoming load-bearing:
`DEFAULT_PAL = 'sedentary'` was being attributed to the user, and the
body-fat control persisted 20% on reveal. A third, the check-in card's
`70 kg` placeholder, was fixed after (`3c420c1`). **A never-default
invariant holds only where something checks it; prose is not a
mechanism.**

The stable facts about the user, in one place: height, age, sex,
current weight and body-fat percentage, plus their targets. From those,
a BMR and a maintenance figure by published formula (Mifflin–St Jeor
needs age, height, weight and sex — which is why sex is a required
field rather than an optional one).

**Sequenced before nutrition deliberately.** M11's whole evaluation
rests on knowing what "too much" is measured against, and that number
has to come from somewhere citable rather than invented. It is also
useful on its own — training targets, readiness and progress all have
a use for a baseline — and it needs no backend, so it can ship while
M11's hosting question is still open.

Reconciles rather than duplicates: `UserSettings.heightCm` already
exists, and weight already lives as a time series on `CheckIn.weightKg`
(nullable). Height, age and sex are stable facts; weight and body fat
are series. The profile must not fork a second copy of a number the
app already tracks.

**One guardrail.** Storing a goal — "target 15% body fat" — is fine.
Telling the user *when* they will reach it is not: `CLAUDE.md` forbids
promising body-transformation outcomes, and a target weight beside a
trend line is exactly the shape that invites a projection. Store the
goal, show progress, predict nothing.

## Milestone 11 (design delivered 30 Jul) — AI nutrition logging

**Plan: `~/.claude/plans/nutrition-m11.md`.** The earlier
`nutrition.md` carries a SUPERSEDED banner — do not implement from it.

Three of the four §1 blockers are ruled: a **Vercel backend** (which
knowingly changes the local-first constraint), **no daily score**, and
**targets belong to the owner's coach**. Protein uses the owner's
rescaled 1.4–2.0 g/kg.

Decisions taken in the plan, with the reasoning that matters:

- **Two model roles, not the three proposed. OCR is dropped**, because
  its only job here is reading a nutrition label — which is packaged-food
  recognition, already out of scope in §5 of the spec. Photographing a
  plate is estimation, not reading.
- **Conversation and vision are one model.** One prompt, one schema, one
  failure mode; a cheaper text-only parser stays available later as a
  measured optimisation.
- **The RAG store is local**, measured rather than argued: 1536 dims over
  a 500-food corpus is 0.85 ms/query at 2.93 MB. Cost is no cross-device
  sync — and `embeddingModel` must be in the schema from day one, since
  changing the model invalidates every stored vector.
- **Normalisation before embedding.** 24 of 27 constructed variants
  collapse without a model; embeddings earn their place on cross-language
  and synonyms only.
- **No cost-per-meal figure is stated**, deliberately — §4 is a cost
  model with the rates as inputs. Retrieval reduces *expensive* calls,
  not the number of calls, because free-text parsing is itself a call.
- **Estimation-never-prediction is structural**, mirroring M10: a
  `.strict()` schema that rejects an injected `advice` field, a name
  guard like `goals.guard.test.ts`, and an import-closure guard so the
  evaluator cannot import the LLM client.

**Two owner decisions remain**, both behind one function so deferring
costs nothing: where embedding runs (backend recommended) and where the
RAG store lives (local recommended). Real provider rates are needed
before phases 3–5.

Meals logged by text, photo or both; an LLM estimates calories and
macros with confidence and stated assumptions; a daily summary judged
against targets that adapt to the training schedule. Records are
isolated per calendar day — yesterday never influences today, which is
the no-guilt principle expressed in food. Full spec and the proposal
as given: **docs/NutritionLogging.md**.

**Blocked on four owner decisions, and the first is larger than the
feature.** An LLM call needs a key, a key cannot ship in a PWA, so this
requires either a backend the owner hosts, a user-supplied key, or an
on-device model — and "local-first (no backend)" is a stated product
constraint that this milestone changes. The other three: a daily
nutrition score is a judgement mechanism in an app whose
non-negotiable is that nothing guilts; nutrition targets belong to the
owner's coach, not this repo; and the model's output must be
constrained to estimation against a target, never prediction, or it
will violate the fitness rules unprompted. Nothing is designed until
these are settled.

## Deferred (owner-requested 29 Jul, design not started) — Day-plan rescheduling

Move today's session to another day, and pull any day's plan onto any
other day. Raised and deferred the same evening; design stopped before
it started so nothing was invested.

**Not a small feature, which is why it is its own milestone.** The app
has two scheduling models and a swap means different things under each
(`.claude/rules/architecture.md`): under `'weekday-pinned'` a date
genuinely has an identity, so moving it is meaningful — and overriding
it fights the exact property pinning exists to guarantee; under
`'rotation'` identity follows the completed count, so the operation may
have no coherent meaning at all and should be unavailable rather than
subtly wrong.

Questions to settle before designing, all owner-facing:

- **Swap, displace, or overwrite?** If today's session moves to
  Thursday, do the two exchange, does Thursday shift forward, or is it
  lost? The owner's phrasing — "swap" for one case, "grab" for the
  other — suggests two operations, not one.
- **Does it cascade?** Moving a training day into a recovery slot
  changes that week's rhythm. Does the app re-balance, or does the user
  own the consequence? M6's philosophy points at the latter.
- **A day already trained** — logged sets must not be orphaned or
  duplicated. Prefer refusing over doing something clever.
- **Does the recovery activity travel with the day**, including the
  `routineId` one of its items now carries?

Two known traps: overrides are user data, so **storage stays
locale-free and they must never be shadowed by seed translations**; and
if they are exportable, `activityItemSchema` is not `.strict()`, so Zod
**strips** unknown fields rather than rejecting them — that is how
adding `routineId` silently deleted every recovery link on a program
round-trip, caught only by the round-trip tests
(`src/domain/programImport.ts:55-79`).

Dexie versions are allocated M10 → v4, Phase 0 (abandoned-workout close)
→ v5, activity records + session set customization → v6, **M11 → v7**
(re-pointed from v6 on 6 Aug — see `db.ts`'s v6 comment for why a lower
number cannot be reserved for later-shipping work). If new work lands
between existing entries, read `db.ts` and take the next free version
rather than trusting a number written in a doc, including this one.

## Later (architecture-ready, not scheduled)

Cloud sync · Apple Watch app (Smart Connector Phase 6) · workout
write-back (Phase 5) · advanced analytics.
