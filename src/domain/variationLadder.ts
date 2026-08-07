import type { LadderPrescription, LoggedSet, SetVariant, Workout } from './types'

/**
 * §10 "Load-ceiling progression" (coach spec v2.16) — the tempo states a
 * load-ceiling pyramid steps through, in prescribed order.
 * `ceilingVariationFor` clamps at the last member rather than wrapping:
 * once a pyramid earns `slow-pause`, it holds there through the rest of
 * the mesocycle (§10:419, "maintain that prescription through Week 5").
 */
export const CEILING_VARIATION_LADDER: readonly SetVariant[] = ['normal', 'slow', 'slow-pause']

/**
 * Mirrors `progression.ts`'s own private `effortOf` exactly — duplicated
 * rather than exported and shared, since this module answers a different
 * question ("how many times was this pyramid completed") from
 * `progression.ts`'s ("should the load step up next set"), and keeping
 * the two modules independent is the point of the module boundary
 * (`~/.claude/plans/variation-ladder.md` D4).
 */
function effortOf(set: LoggedSet, mode: LadderPrescription['mode']): number {
  const value = mode === 'seconds' ? set.seconds : set.reps
  return value ?? 0
}

/**
 * Whether every rung of *this workout's own stored prescription snapshot*
 * for `exerciseId` was hit to its target reps — the same completion test
 * `suggestLadderProgression` applies set-to-set, asked instead of one
 * workout at a time over history.
 *
 * **Deliberately reads the workout's own snapshot, not a prescription
 * passed in from outside.** `WorkoutExercise.prescription` is exactly
 * what the athlete was actually asked to do that day — on an eased day,
 * `applyReadiness` truncates the stored `setPlan` before it ever reaches
 * `createWorkout` (`adjustments.ts`'s `.slice(0, -1)`, floored at one
 * rung), so a Yellow day's *own* pyramid can be genuinely, fully hit
 * while still being short a rung of the real ceiling pyramid. That is
 * exactly the gap `completeCeilingExposures`'s explicit readiness filter
 * below has to close — checking against an external, always-full
 * prescription would hide the gap by construction instead of naming it.
 */
function isCompleteExposure(workout: Workout, exerciseId: string): boolean {
  const workoutExercise = workout.exercises.find((e) => e.exerciseId === exerciseId)
  if (!workoutExercise || workoutExercise.prescription.setPlan === undefined) return false
  const { setPlan, mode } = workoutExercise.prescription
  return setPlan.every((rung, index) => {
    const logged = workoutExercise.sets.find((set) => set.setIndex === index)
    return logged !== undefined && effortOf(logged, mode) >= rung.reps
  })
}

/**
 * How many times this ceiling pyramid has been performed completely —
 * D2: the tempo level is a pure function of this count, never of the
 * calendar, so a missed exposure repeats the same tempo rather than
 * skipping ahead (§10:396, P5).
 *
 * **Program-scoped from birth (D3).** Several ceiling lifts (e.g.
 * `incline-dumbbell-press`) also appear in `phase-1-home`, which also
 * ends at 15 kg — an unscoped count would credit the athlete with
 * exposures earned under a different program's pyramid and over-advance
 * by weeks on day one (measured,
 * `~/.claude/plans/variation-ladder.md` §2 P4).
 *
 * **Excludes eased exposures (D8).** See `isCompleteExposure`'s doc for
 * why a Yellow day's own truncated pyramid can still read as "complete"
 * on its own terms — this filter is what stops that from counting.
 * Absent `readiness` counts as neutral, not eased, matching
 * `nextSetTarget`'s own documented convention ("an unrated day is
 * neutral, not a missing input").
 */
export function completeCeilingExposures(
  workouts: readonly Workout[],
  programId: string,
  prescription: LadderPrescription,
): number {
  return workouts.filter(
    (w) =>
      w.completedAt !== null &&
      w.programId === programId &&
      w.readiness?.tier !== 'easier' &&
      isCompleteExposure(w, prescription.exerciseId),
  ).length
}

/**
 * The tempo this many complete exposures earns (§10:414-419). Clamped at
 * the ladder's last member — `Math.min`, never a modulus — so a pyramid
 * that has long since earned `slow-pause` holds there instead of
 * wrapping back to `normal`.
 */
export function ceilingVariationFor(exposures: number): SetVariant {
  const index = Math.min(Math.max(exposures - 1, 0), CEILING_VARIATION_LADDER.length - 1)
  return CEILING_VARIATION_LADDER[index]
}
