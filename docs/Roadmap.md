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
and states its evidence by name, the same way readiness does. A Monday-only
weekly review reports the week just finished, honestly, including zero.
No charts anywhere — phrase-driven, consistent with the rest of the app.

## Milestone 5 — Polish & Phase 2

PWA install/offline hardening, motion polish pass, accessibility audit,
Fitness Park (gym equipment) program for Phase 2, program transition UX.

## Later (architecture-ready, not scheduled)

Cloud sync · Apple Watch · nutrition · wearables · advanced analytics.
