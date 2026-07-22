# Pyramid Progression

**Status: designed, not yet implemented** (Milestone 8 — see Roadmap).
This brief is the spec the implementation is reviewed against. It is an
owner-directed pivot (22 Jul, after the first real workout): the app's
primary progression model for loaded lifts moves from RIR-gated double
progression to classical ascending-weight pyramids. RIR leaves the
logging UI entirely.

## The model

A loaded lift is prescribed as an explicit **set ladder**:

```ts
interface SetTarget {
  weightKg: number | null
  reps: number
}

// ExercisePrescription gains ONE of:
//   setPlan?: SetTarget[]        // pyramid: one entry per set, in order
// …while the existing sets/range/targetRir shape remains valid for
// bodyweight, band, and timed work (they have no weight to ascend).
```

Example (dumbbell curl): `[{8, 12}, {10, 10}, {12, 8}]` — weight climbs,
reps descend, top set last.

**Progression rule (classical):** when every set in the ladder hits its
target reps, the whole ladder steps up by `weightStepKg` next time
(8/10/12 → 10/12/14). If any set falls short, repeat the ladder. The
suggestion engine pre-fills each set from the plan and the previous
session's actuals; the steppers stay free — suggestions are defaults,
never locks.

**RIR:** removed from the set-logging UI everywhere. `LoggedSet.rir`
stays in the schema (nullable, historical data untouched) but nothing
prompts for it. The reserve gate in progression is replaced by the
completion gate above. Conservative `weightStepKg` values are the
safety margin that RIR used to provide — program authors should step
small.

## Readiness integration (the lever changes shape)

'easier' days can no longer add reserve. The pyramid-native easing:

- **Drop the top set of each ladder** (the heaviest set is the day's
  stress peak — removing it is the classical way to train lighter),
  never below two sets.
- Accessory trimming (non-pyramid items) unchanged.
- Copy updates accordingly ("Skipping the top sets today — …"), all
  three locales, driver-derived reasons as always.

## What keeps which model

Amended 22 Jul by the owner's coach (supersedes the earlier
"every loaded lift" rule):

- **Pyramid (`setPlan`)**: primary compound lifts only.
- **Rep-range (existing)**: everything else — bodyweight, band,
  seconds-mode work, AND loaded isolation accessories (curls, lateral
  raises, flies). Rationale: accessory goals are quality contraction
  and short sessions, not per-session progressive loading. `targetRir`
  remains in their stored shape but is no longer surfaced in the UI.
- The choice is per-prescription, carried by the presence of `setPlan`
  — the engine never infers the model from equipment or role.

**Rep-range weight gate (RIR's replacement here too):** loaded
rep-range work steps up by `weightStepKg` when every set reaches the
top of the rep range — the same completion-gate principle as ladders,
at range granularity. The old reserve (RIR) condition is deleted, not
approximated.

## Surface changes

- **SetScreen**: pre-fills weight and reps from the current rung;
  header shows the ladder position ("Set 2 of 3 — 10 kg × 10"); RIR
  picker removed. Progress indicator work (Exercise N/M · Set n/k) from
  the UX batch composes with this.
- **Session preview / Plan day detail**: pyramid items render their
  ladder ("8→10→12 kg · 12/10/8") instead of "3 × 8–12".
- **Summary + trends + stagnation**: top-set weight and reps are already
  the engine's headline metrics (`improved()` credits either dimension)
  — verify against pyramid logs, adjust labels, no conceptual change.
- **Import/export**: `setPlan` joins the schema (JSON + a Markdown
  ladder syntax, e.g. `8x12 / 10x10 / 12x8`), optional and
  back-compatible; validation: non-empty, weights ascending or equal,
  reps positive. Round-trip remains the acceptance test.

## Out of scope (deliberate)

Deleting RIR from stored data or history; auto-generating ladders from
1RM; per-set rest overrides; changing bodyweight/timed progression.

## Migration

No data migration. The owner's live Phase 1 gets a coach-authored
pyramid revision imported after the feature ships; the seed program is
updated to ladders in the same batch (dev-owned). docs/Training.md's
progression section is rewritten to describe both models honestly.

**Seed-clobber guard (found 22 Jul, must ship with or before the v3
import):** `seedDatabase()` runs `db.programs.put(seedProgram)`
unconditionally on every boot. The v3 import deliberately keeps
`id: phase-1-home`, so the first boot after importing it would silently
revert the coach's program back to the seed. Seeding must skip the
program put when a program with the seed's id already exists with
`origin: 'imported'` (refreshing an `origin: 'seed'` row stays fine —
that is how seed updates reach installs). A regression test belongs
with the fix: import over the seed id, re-run seeding, assert the
imported program survives.
