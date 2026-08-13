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
 * is new (rehearses `barbell-hip-thrust`, now the session's opening
 * movement, replacing the old `dumbbell-shoulder-press` rehearsal) and
 * its movement step is `glute-bridge`, promoted to the Library for
 * exactly this purpose (Phase 1 of the plan above).
 *
 * A `ramp` step's `weightKg` states its own `implement` (U-1) — per
 * dumbbell for Session A, total bar weight for Sessions B and C.
 * `implement: 'barbell'` is load-bearing on Session C: `'dumbbell'` would
 * render "11.75 kg per dumbbell" for a loaded bar, and 11.75 is not even
 * on the dumbbell ladder. Ramp reps fall as ramp load rises on every
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
  {
    id: 'mesocycle2-fullbody-hipext-shoulder-warmup-v1',
    steps: [
      { kind: 'cycle', minutes: 3 },
      { kind: 'movement', exerciseId: 'glute-bridge', reps: 8 },
      // Rehearsal ramp — both loads bar-inclusive (Q1).
      { kind: 'ramp', exerciseId: 'barbell-hip-thrust', implement: 'barbell', weightKg: 11.75, reps: 8 },
      { kind: 'ramp', exerciseId: 'barbell-hip-thrust', implement: 'barbell', weightKg: 19.75, reps: 5 },
    ],
  },
]

/** The warm-up with this id, or undefined — an unknown id degrades to nothing rendered, never a dead link. */
export function warmupById(warmupId: string): Warmup | undefined {
  return seedWarmups.find((warmup) => warmup.id === warmupId)
}
