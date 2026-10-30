# Architecture

A map for anyone arriving without this project's history. Layer rules
here are invariants, not conventions — the tests enforce several of
them directly.

## Layers

```
src/domain/    pure logic — NO React, NO i18next imports
src/data/      Dexie (db.ts) + repositories.ts + seed/ + generated/
src/features/  screens by feature (today, workout, plan, progress,
               library, checkin, settings)
src/ui/        shared primitives (Stepper, RatingPicker, thumbnails…)
src/i18n/      i18next setup, seed-content localization hooks
src/lib/       cross-cutting helpers (asset resolution, dates, brand)
src/locales/   en · fr · zh-CN
```

**Dependency direction is one-way**: features → domain/data/ui.
Domain depends on nothing but itself.

## Invariants

- **Domain returns message descriptors, never prose.** A domain
  function that returns an English string is a bug: it returns
  `{ key, params }` and the UI translates it. This is what makes
  three locales possible without duplicating logic.
- **Storage is locale-free.** No translated string is ever persisted.
- **Seeded vs imported content**: seeded content (exercise names,
  cues, activities) is locale-keyed and translated via
  `src/i18n/seedProgram.ts`. Imported content — `Program.origin ===
  'imported'` — renders **verbatim** and must never be translated or
  shadowed. This distinction exists because seed translations once
  shadowed a user's own imported program.
- **Locale parity is a test.** New keys land in all three locales in
  the same change (`src/i18n/localeParity.test.ts`).
- **Immutability**: domain functions return new objects; nothing is
  mutated in place.
- **Seeding is idempotent and runs on every boot.** Exercises are
  always upserted (that's how Library additions reach existing
  installs with no migration). The seed *program* is skipped when a
  program with the same id exists with `origin: 'imported'` — the
  seed-clobber guard. Weakening it silently reverts the owner's
  imported program on next launch.

## Data and reactivity

Dexie/IndexedDB behind `src/data/repositories.ts`; screens read
through `useLiveQuery`, so writes propagate without manual refresh.
Schema versions live in `db.ts` — migrations are additive, and
destructive ones (v3 stripped RIR from stored data) are irreversible
and need explicit owner approval.

## Progression model (carry-forward, since 28 Aug 2026)

Two prescription shapes, chosen **per prescription** by the presence of
`setPlan`, never inferred from equipment or role:

- **Ladder** (`setPlan: SetTarget[]`): explicit weight×reps per set.
- **Rep-range**: bodyweight, timed and isolation accessories.

Neither shape auto-increments. The coach's rule, live since `99f27cf`:
the next prescription is what the athlete actually completed at the
previous complete exposure, set by set ("each set starts where that set
finished last time"). Two exceptions. Rungs that were skipped or never
logged fall back to the authored rung. `dumbbell-lateral-raise` and
`rear-delt-fly` carry reps but not load: they are technique-gated, per
`LOAD_CARRY_FORWARD_EXCLUDED_EXERCISE_IDS`. This lives in
`src/domain/carryForward.ts` and is applied once, at session start. Swapped and easier-day exposures are
never a carry basis. Generating a load the athlete has not lifted needs
`equipment.confirmedAt`, a structural line the coach drew, so the carry
function takes no settings argument. `maxWeightKg` is the equipment
ceiling. Carry-forward copies it and never clamps a logged load to it.
The old engines that stepped ladders up and reported `at-equipment-max`
were deleted in `99f27cf`.

**Swaps (30 Oct, `c731222` and `02761fe`).** Swap state (`substitutedForId`,
`substituteLoad`) is read only through `isSubstitute`,
`authoredExerciseIdOf` and `withoutSwapState` in
`src/domain/substitutions.ts`. `substitutions.guard.test.ts` fails any
other module that reads the field, including through a string literal
naming it (since `aaee85b`). It still cannot see a name built at
runtime, or a read that never names the field (`Object.keys`, JSON).
Two rules about the swap itself:

- A genuine swap back to the authored exercise clears the swap state, so
  the slot is the original again and is a carry basis if complete (coach
  CC4).
- Every swap resets `sets`, `skippedLevels` and `customSlots`.

The sets a swap clears are kept in `priorAttempts`, as a record only. It
is shown in the day detail and carried in the export, and never read by
carry, suggestions, "Last time", trend or stagnation.

A loaded swap suggests the substitute's own most recent eligible
exposure, matched by set position. A position with no history stays
blank (`substituteLoad.ts`, `historyEligibility.ts`; coach CQ2,
CC1–CC3).

RIR no longer exists anywhere — UI, schema, or stored data.

## Scheduling

`Program.schedulingMode`: `'rotation'` (session identity follows
completed count) or `'weekday-pinned'` (`weekdaySessions` maps
weekday → session id; identity is immune to completion history).
Absent means rotation. Copy that describes rotation shift must branch
on the mode — it is false under pinning.

## Assets

Exercise art resolves through `src/lib/exerciseAsset.ts` against the
generated manifest, with URLs carrying a content hash (`?v=<hash>`)
— that hash *is* the cache-busting mechanism, so never bump cache
names manually. A coverage test walks every Library id to an asset or
an explicit KNOWN_MISSING entry, so silent gaps are impossible.
Authoring PNGs under `public/assets/**` are excluded from precache;
only runtime AVIFs are cached, at request time.

## Product constraints that shape code

Mobile-first, offline-friendly, local-first (no backend). "Today is
the app" — no tab bar. One decision at a time in Workout Mode;
education only during rest. Skipping is always fine: nothing guilts,
nothing locks.
