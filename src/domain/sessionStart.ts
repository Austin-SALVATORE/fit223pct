import { MIN_LADDER_RUNGS } from './adjustments'
import { carrySessionForward } from './carryForward'
import type { Readiness } from './readiness'
import type { ExercisePrescription, SessionTemplate, Workout } from './types'

/**
 * The session a workout is created from: carry-forward first, then — on an
 * easier day — easing applied to the **carried** plan.
 *
 * **Why this order, and why a module of its own** (plan
 * `~/.claude/plans/m2-optimization-addendum-warmups-easier-day.md` §3). Easing
 * the authored session and *then* carrying (what `StartButton` used to do)
 * handed the dropped top rung straight back, because carry treats any logged
 * set past `authored.sets` as an athlete-added set: an eased day stored the
 * full-volume plan. Carrying first, from a basis that excludes easier-day
 * workouts (`isCarryBasisWorkout`), and easing the result gives the coach's
 * Q7: the easier day is one rung shorter than the normal carried plan, and
 * never redefines it. Neither `carryForward.ts` nor `adjustments.ts` imports
 * the other, which is why the composition lives here.
 *
 * **The easing branch is chosen from the AUTHORED item, never the carried
 * shape.** Carry turns every prescription with history into a `setPlan`, so
 * choosing from the carried shape would send a rep-range *main* lift down the
 * ladder branch and drop a set the easing rules say it keeps.
 */
export function prepareSessionForStart(
  session: SessionTemplate,
  completed: readonly Workout[],
  programId: string,
  readiness: Readiness,
): SessionTemplate {
  const carried = carrySessionForward(session.items, completed, programId)
  if (readiness.tier !== 'easier') return { ...session, items: carried }
  return { ...session, items: carried.map((item, index) => easeCarried(session.items[index], item)) }
}

function easeCarried(authored: ExercisePrescription, carried: ExercisePrescription): ExercisePrescription {
  const isLadder = authored.setPlan !== undefined
  const isAccessory = (authored.role ?? 'main') === 'accessory'
  if (!isLadder && !isAccessory) return carried

  if (carried.setPlan !== undefined) {
    if (carried.setPlan.length <= MIN_LADDER_RUNGS) return carried
    const setPlan = carried.setPlan.slice(0, -1)
    return { ...carried, setPlan, sets: setPlan.length }
  }
  // A rep-range accessory with no history: still a plain set count.
  return { ...carried, sets: Math.max(1, carried.sets - 1) }
}
