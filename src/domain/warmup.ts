/**
 * A pre-strength warm-up — a sequence the app *displays*, not data it feeds
 * to the progression engine (Mesocycle 2 Pre-Strength Warm-up Prescription,
 * 11 Aug 2026, rules 6 and 9: ramp-up sets must not count toward
 * completion, volume or Pyramid progression, and must not auto-progress
 * alongside the working ladder).
 *
 * The defining property of these types is what they deliberately lack —
 * the same guarantee `domain/routine.ts`'s own docblock states for guided
 * stretch routines. `WarmupStep` has no `sets`, no `mode`, no
 * `restSeconds`, no `range`, no `setPlan`, no `recordable`, so it is not an
 * `ExercisePrescription` and cannot reach `domain/progression.ts` without
 * someone first writing a conversion — a visible, reviewable act rather
 * than a quiet field addition. A `ramp` step's `weightKgPerImplement` is
 * display text formatted at the UI layer ("5.2 kg per dumbbell × 8"), never
 * a `setPlan` rung.
 */

export type WarmupStep =
  | { kind: 'cycle'; minutesMin: number; minutesMax: number }
  | { kind: 'movement'; exerciseId: string; reps: number; perSide?: boolean }
  | { kind: 'ramp'; exerciseId: string; weightKgPerImplement: number; reps: number; perSide?: boolean }

export interface Warmup {
  id: string
  steps: WarmupStep[]
}
