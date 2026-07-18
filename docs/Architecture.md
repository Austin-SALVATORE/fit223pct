# Architecture

## Shape

Local-first installable PWA. Static build, no server. All data on-device in
IndexedDB. This is the honest architecture for a private, offline-capable,
single-user product — and it keeps the door open for cloud sync later
(repositories isolate storage; a sync layer can be added without rearchitecting).

## Stack

| Concern      | Choice                          | Why |
|--------------|--------------------------------|-----|
| Build        | Vite + TypeScript (strict)      | Fast, simple, static output |
| UI           | React 19                        | Ecosystem, team familiarity |
| Styling      | Tailwind CSS v4 + CSS tokens    | Tokens are the design language source of truth |
| Persistence  | Dexie 4 (IndexedDB) + live queries | Durable, reactive, migration-friendly |
| Routing      | React Router (library mode)     | Small surface, no framework lock-in |
| Motion       | Motion (`motion/react`)         | Purposeful animation, reduced-motion aware |
| Offline      | vite-plugin-pwa (Workbox)       | Installable, precached app shell |
| Tests        | Vitest (+ Testing Library)      | Domain logic is pure and unit-tested |

## Layers

```
src/
  app/        shell, routes, providers
  ui/         design-system primitives (tokens consumed here)
  features/   today/ workout/ library/ progress/ checkin/  (screen + feature logic)
  domain/     pure logic: program scheduling, progression, units — no IO, fully tested
  data/       Dexie db, repositories, seed data
  lib/        generic utilities
```

Rules:
- `domain/` is pure functions only — no React, no Dexie. This is where the
  intelligence lives (progression, stagnation detection later) and it must stay testable.
- Components read data through repositories/live queries, never raw Dexie tables.
- Immutable updates everywhere.

## Data model (v1)

- `exercises` — library entries: equipment, muscle groups, cues, substitutions.
- `programs` / embedded sessions — phase-aware training plan templates.
- `workouts` — performed sessions with logged sets (load, reps, RIR).
- `checkins` — daily/weekly recovery + body metrics (sleep, energy, soreness, waist, weight).
- `settings` — user profile and preferences.

Schema versioning via Dexie migrations; never destructive.

## Future-proofing (deliberate seams)

- Cloud sync: repositories are the seam.
- Apple Watch / wearables: checkin and workout models take external sources.
- AI coaching: domain layer exposes pure analysis functions; a model can be
  swapped in behind the same interface.
