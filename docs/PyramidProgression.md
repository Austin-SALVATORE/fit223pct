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
// …while the existing sets/range shape (minus targetRir) remains valid for
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

**RIR: purged entirely (owner ruling 22 Jul — "forget RIR, reset all
data about RIR", superseding the earlier keep-history position).**
Not just removed from the UI — erased as a concept:

- `LoggedSet.rir` deleted from the type; a one-time Dexie migration
  strips the field from every stored workout's sets. Irreversible by
  design (the values carry no meaning in the pyramid era).
- `targetRir` deleted from prescriptions, seed defaults, and the
  rep-range branch of the type — not "kept but unread."
- No RIR display anywhere, including historical workout detail
  (the old-workouts suffix goes too).
- Import tolerates legacy files: `rir`/`targetRir` keys in old
  exports are accepted and stripped, never errors — old backups must
  stay importable.

The reserve gate in progression is replaced by the completion gate
above. Conservative `weightStepKg` values are the safety margin that
RIR used to provide — program authors should step small.

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
  is deleted from their shape too (full RIR purge — see the RIR
  section).
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

Auto-generating ladders from 1RM; per-set rest overrides; changing
bodyweight/timed progression. (RIR data deletion was originally out
of scope; the 22 Jul owner ruling moved the full purge INTO scope —
see the RIR section.)

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

## The ladder did not climb for eight days, and a comment is why — 31 Jul

The owner asked, plainly: *"I still don't understand why the log values
don't evolve with each set's values."* They were right, and the app had
been wrong since M8 shipped on 23 Jul.

`SetScreen` pre-filled weight as `lastSetThisSession?.weightKg ?? rung
?? suggestion`. **Whatever was logged last beat the rung.** So
`incline-dumbbell-press`, prescribed 12×12 → 14×10 → 15×8, offered 12,
then 12, then whatever set 2 got. The pyramid never ascended by itself;
the owner had been raising every load by hand, believing that was the
design.

**It was a leftover, not a decision.** The carry rule entered in
`f5953b4` (Workout Mode), when every loaded lift used double
progression — the same weight across all sets — so carrying was
correct. `267e9b8` introduced `setPlan` ladders months later and nobody
revisited the pre-fill. **The rule outlived the model it was correct
for**, which is the failure mode to look for whenever a progression
model changes: not code that breaks, code that quietly keeps answering
the old question.

### What actually prevented the catch

Not a missing test. `WorkoutPage.undo.test.tsx` carried this comment:

> "Set 2 is prefilled from the mistaken set 1 — **correct**, people keep
> the weight they just used."

The defect was **documented as intended**, and passed CI for months. The
same file's test title — "re-offers the ladder rung after an undo, not
the mistaken weight" — already wanted the right behaviour for the undo
case and was never generalised to every set. A reader arriving with a
doubt met a sentence telling them the doubt was unfounded.

This project has hit a lot of instruments that read green while
measuring nothing: `tsc --noEmit -p .` against `files: []`, `git diff`
on gitignored art, three test harnesses, an illustration rendering at
623px inside a 200px band. **This one is worse than all of them,
because the others were silent and this one actively reassured.** A
wrong comment is not neutral; it is a guard against being checked.

### The rule, ruled by the owner 31 Jul

- **Ladder: set N always offers rung N**, weight and reps, regardless of
  what was logged. Deviating on set 2 does not move set 3.
- **Rep-range: keeps carrying**, because there the prescription genuinely
  is constant across sets. The rule was narrowed, not deleted — and each
  half has a test that fails without the other, or narrowing would be
  indistinguishable from deleting.

The owner's reasoning, which belongs beside the rule because it decides
the cases this list does not enumerate:

> The workout player should always present the coach's prescription. The
> user is free to override it, but the app should not silently rewrite
> the program based on an earlier deviation. This keeps a clear
> separation between **prescription** — what the coach intended — and
> **performance** — what the user actually completed. The progression
> engine should analyse the completed workout *after* the session, not
> modify the prescription *during* it.

### Three things a ladder set can mean, and they are not two

Collapsing these is what produced a second bug during the fix — a
caption reading the authored ladder under a card showing the advanced
one, so a stepped-up ladder was captioned "8 kg" above a card offering
10:

| | source | means |
|---|---|---|
| **authored** | `prescription.setPlan[i]` | what the coach wrote |
| **advanced** | `nextSetTarget().prescribed` | after the engine's steps |
| **offered** | `nextSetTarget()` top-level | what the user is handed |

For a ladder, *advanced* and *offered* coincide by construction — and a
test asserts it, so the coincidence records the redundancy **and**
catches carrying being reintroduced. For rep-range they genuinely
differ. Do not collapse the field on the grounds that it looks
duplicated.
