import type { Warmup } from '@/domain/warmup'

/**
 * The app's closed catalogue of pre-strength warm-ups, linked from
 * `SessionTemplate.warmupId` (domain/warmup.ts). Same shape as
 * `src/data/seed/routines.ts` and the same reason for living here: never
 * written to Dexie (nothing stored references a warm-up, so a table would
 * buy a schema version and a mutable copy of static content for no
 * benefit), and this path is covered by `.claude/rules/program-content.md`'s
 * `src/data/seed/**` glob — which movements, which loads, which order is
 * the coach's call, not this repo's.
 *
 * Content is transcribed verbatim from the coach's 13 Aug 2026 Full Body
 * Restructure and its six-question follow-up bundle (Q1: exact warm-up
 * ramp loads, "Do NOT defer these warm-up loads to the future Load Setup
 * engine"), superseding the 11/12 Aug Mesocycle 2 Pre-Strength Warm-up
 * Prescription below this comment (see git history) — the ids rename
 * with the sessions they warm up (`~/.claude/plans/m2-fullbody-
 * restructure.md` §1.2/§1.3). Session A's warm-up is new (rehearses
 * `goblet-squat`, now the session's opening movement, replacing the old
 * `incline-dumbbell-press` rehearsal). Session B's warm-up is
 * byte-identical to what shipped before — only the `id` changes, since
 * the Romanian deadlift already opened that session. Session C's warm-up
 * was rewritten 21 Oct 2026 (-v2, see its entry) when the Dumbbell Reverse
 * Lunge became the session's opening movement; its `glute-bridge` movement
 * step was promoted to the Library for exactly this purpose (Phase 1 of
 * the plan above). Two further entries are exercise-level (21 Oct): the
 * overhead-press ramp and the Parallel Bar Dip prep, anchored to those
 * prescriptions via `ExercisePrescription.warmupId` so they appear
 * immediately before the movement they prepare, not at session start.
 *
 * A `ramp` step's `weightKg` states its own `implement` (U-1) — per
 * dumbbell for Session A, total bar weight for Sessions B and C.
 * `implement: 'barbell'` is load-bearing on the barbell entries:
 * `'dumbbell'` would render "11.75 kg per dumbbell" for a loaded bar, and
 * 11.75 is not even on the dumbbell ladder. Ramp reps fall as ramp load rises on every
 * session (rule 8) and every ramp is strictly below its session's first
 * working rung (rule 6) — pinned by `warmups.conformance.test.ts`, not
 * re-derived here; Session A carries only one ramp, so the
 * rising-load/falling-reps pairwise check is vacuous for it.
 */
export const seedWarmups: readonly Warmup[] = [
  {
    id: 'mesocycle2-fullbody-squat-warmup-v1',
    steps: [
      { kind: 'cycle', minutes: 3 },
      { kind: 'movement', exerciseId: 'bodyweight-squat', reps: 8 },
      { kind: 'ramp', exerciseId: 'goblet-squat', implement: 'dumbbell', weightKg: 8, reps: 5 },
    ],
  },
  // Byte-identical to what shipped before the restructure — the Romanian
  // deadlift already opened this session, so nothing about its warm-up
  // changes, only the id.
  {
    id: 'mesocycle2-fullbody-hinge-warmup-v1',
    steps: [
      { kind: 'cycle', minutes: 3 },
      { kind: 'movement', exerciseId: 'bodyweight-hip-hinge', reps: 8 },
      // Technique ramp — empty bar.
      { kind: 'ramp', exerciseId: 'romanian-deadlift', implement: 'barbell', weightKg: 7.75, reps: 8 },
      // Load ramp.
      { kind: 'ramp', exerciseId: 'romanian-deadlift', implement: 'barbell', weightKg: 15.75, reps: 5 },
    ],
  },
  // 21 Oct 2026 optimization (coach arbitration Q6), replacing -v1 (the ids
  // version the content). Session C now opens on the Dumbbell Reverse Lunge,
  // so this rehearses it; the hip-thrust ramps are gone with the hip thrust
  // (acceptance 8). Glute bridge stays, unweighted (acceptance 9). The
  // overhead-press ramp is deliberately NOT here: it belongs to the press
  // (acceptance 10), see the exercise-level entry below.
  {
    id: 'mesocycle2-fullbody-hipext-shoulder-warmup-v2',
    steps: [
      { kind: 'cycle', minutes: 3 },
      { kind: 'movement', exerciseId: 'glute-bridge', reps: 8 },
      // Unloaded lunge: its own Library entry, not `reverse-lunge`, which is
      // named "Dumbbell reverse lunge" and would mislabel it.
      { kind: 'movement', exerciseId: 'bodyweight-reverse-lunge', reps: 5, perSide: true },
      { kind: 'ramp', exerciseId: 'reverse-lunge', implement: 'dumbbell', weightKg: 2, reps: 5, perSide: true },
      { kind: 'ramp', exerciseId: 'reverse-lunge', implement: 'dumbbell', weightKg: 4, reps: 3, perSide: true },
    ],
  },
  // Exercise-level warm-ups (coach Q6; domain/types.ts `warmupId`), pointed
  // to from a prescription, not from a session. Once shipped, an
  // exercise-level id is referenced from stored workout snapshots; deleting
  // one later degrades those snapshots' prep block to nothing (SetScreen
  // guards an unknown id), which is safe but should be deliberate.
  //
  // Barbell total load including the bar: "Empty barbell, 7.75 kg total x 5".
  {
    id: 'mesocycle2-overhead-press-prep-v1',
    steps: [{ kind: 'ramp', exerciseId: 'overhead-press', implement: 'barbell', weightKg: 7.75, reps: 5 }],
  },
  // Prep before the Parallel Bar Dip, in the coach's order. The drills are not
  // Library exercises (names from seed:warmupDrill.<id>.name, plain rows, no
  // art); the scapular push-up is.
  {
    id: 'mesocycle2-parallel-bar-dip-prep-v1',
    steps: [
      { kind: 'drill', id: 'shoulder-circles', dose: { unit: 'reps-each-direction', reps: 8 } },
      { kind: 'movement', exerciseId: 'scapular-push-up', reps: 6 },
      { kind: 'drill', id: 'supported-dip-hold', dose: { unit: 'seconds', seconds: 8 } },
    ],
  },
]

/** The warm-up with this id, or undefined — an unknown id degrades to nothing rendered, never a dead link. */
export function warmupById(warmupId: string): Warmup | undefined {
  return seedWarmups.find((warmup) => warmup.id === warmupId)
}
