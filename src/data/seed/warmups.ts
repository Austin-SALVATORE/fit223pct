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
 * Content is transcribed verbatim from the coach's Mesocycle 2 Pre-Strength
 * Warm-up Prescription (11 Aug 2026). All three sessions share the same
 * shape — a 2–3 min easy cycle, one bodyweight movement-preparation drill,
 * then one or two ramp-up sets rehearsing the session's first working
 * exercise — because that shape *is* the coach's rule 3 ("keep the default
 * routine intentionally minimal"), not a convenience of this file.
 *
 * `weightKgPerImplement` is per-dumbbell, matching every other prescription
 * in this program (program-content.md: "Weights are per dumbbell, for both
 * single- and double-dumbbell lifts"). Ramp reps fall as ramp load rises on
 * every session (rule 8) and every ramp is strictly below its session's
 * first working rung (rule 6) — pinned by
 * `mesocycle2Build.conformance.test.ts`'s warm-up conformance block, not
 * re-derived here.
 *
 * Session B's optional light RDL rehearsal set (spec, "RDL transition") is
 * not modelled — the spec gives it no load, reps or trigger, and
 * program-content.md forbids inventing coach content. Carried as an open
 * question (11 Aug plan §7 Q6), not this file's to guess at.
 */
export const seedWarmups: readonly Warmup[] = [
  {
    id: 'mesocycle2-chest-back-warmup-v1',
    steps: [
      { kind: 'cycle', minutesMin: 2, minutesMax: 3 },
      { kind: 'movement', exerciseId: 'scapular-push-up', reps: 8 },
      { kind: 'ramp', exerciseId: 'incline-dumbbell-press', weightKgPerImplement: 5.2, reps: 8 },
      { kind: 'ramp', exerciseId: 'incline-dumbbell-press', weightKgPerImplement: 8.2, reps: 5 },
    ],
  },
  {
    id: 'mesocycle2-legs-core-warmup-v1',
    steps: [
      { kind: 'cycle', minutesMin: 2, minutesMax: 3 },
      { kind: 'movement', exerciseId: 'bodyweight-squat', reps: 8 },
      // "Bulgarian Split Squat — Bodyweight" — stance/balance rehearsal,
      // no load, distinct from the ramp-up step below it.
      { kind: 'movement', exerciseId: 'bulgarian-split-squat', reps: 5, perSide: true },
      {
        kind: 'ramp',
        exerciseId: 'bulgarian-split-squat',
        weightKgPerImplement: 5.2,
        reps: 5,
        perSide: true,
      },
    ],
  },
  {
    id: 'mesocycle2-shoulders-arms-warmup-v1',
    steps: [
      { kind: 'cycle', minutesMin: 2, minutesMax: 3 },
      { kind: 'movement', exerciseId: 'wall-slide', reps: 8 },
      { kind: 'ramp', exerciseId: 'dumbbell-shoulder-press', weightKgPerImplement: 3.7, reps: 8 },
      { kind: 'ramp', exerciseId: 'dumbbell-shoulder-press', weightKgPerImplement: 5.7, reps: 5 },
    ],
  },
]

/** The warm-up with this id, or undefined — an unknown id degrades to nothing rendered, never a dead link. */
export function warmupById(warmupId: string): Warmup | undefined {
  return seedWarmups.find((warmup) => warmup.id === warmupId)
}
