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
 * Warm-up Prescription (11 Aug 2026), **as amended 12 Aug 2026** by the
 * equipment upgrade (new ramp loads on the current hardware, fixed 3:00
 * cycle — doc 4 §5) and by the Session B Warm-up Amendment (doc 8), which
 * replaces Session B's warm-up wholesale to rehearse the Barbell RDL —
 * now the session's first movement — rather than the Bulgarian Split
 * Squat it used to open with.
 *
 * A `ramp` step's `weightKg` states its own `implement` (U-1) — per
 * dumbbell for Sessions A/C, total bar weight for Session B's two RDL
 * ramps. Ramp reps fall as ramp load rises on every session (rule 8) and
 * every ramp is strictly below its session's first working rung (rule 6)
 * — pinned by `mesocycle2Build.conformance.test.ts`'s warm-up conformance
 * block, not re-derived here. Session B's 30–60 sec inter-ramp rest
 * (doc 8) is deliberately not modelled — `WarmupStep`'s structural
 * guarantee is that it has no `restSeconds`, and the coach's own phrasing
 * is non-prescriptive ("only as needed for setup").
 */
export const seedWarmups: readonly Warmup[] = [
  {
    id: 'mesocycle2-chest-back-warmup-v1',
    steps: [
      { kind: 'cycle', minutes: 3 },
      { kind: 'movement', exerciseId: 'scapular-push-up', reps: 8 },
      { kind: 'ramp', exerciseId: 'incline-dumbbell-press', implement: 'dumbbell', weightKg: 6, reps: 8 },
      { kind: 'ramp', exerciseId: 'incline-dumbbell-press', implement: 'dumbbell', weightKg: 10, reps: 5 },
    ],
  },
  // Replaced wholesale (doc 8) — the Bulgarian Split Squat rehearsal is
  // REMOVED, not relocated: the session now opens with the Barbell RDL,
  // so the specific warm-up prepares that movement instead. BSS itself
  // is now the session's second exercise and gets no rehearsal set.
  {
    id: 'mesocycle2-legs-core-warmup-v1',
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
    id: 'mesocycle2-shoulders-arms-warmup-v1',
    steps: [
      { kind: 'cycle', minutes: 3 },
      { kind: 'movement', exerciseId: 'wall-slide', reps: 8 },
      { kind: 'ramp', exerciseId: 'dumbbell-shoulder-press', implement: 'dumbbell', weightKg: 4, reps: 8 },
      { kind: 'ramp', exerciseId: 'dumbbell-shoulder-press', implement: 'dumbbell', weightKg: 6, reps: 5 },
    ],
  },
]

/** The warm-up with this id, or undefined — an unknown id degrades to nothing rendered, never a dead link. */
export function warmupById(warmupId: string): Warmup | undefined {
  return seedWarmups.find((warmup) => warmup.id === warmupId)
}
