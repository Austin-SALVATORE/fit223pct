import { lastEligibleExposureFor } from './historyEligibility'
import type { Exercise, Program, SubstituteLoad, Workout } from './types'

/**
 * The implement a loaded exercise is lifted with. `null` is "unloaded": body
 * weight, band, parallel bars, a bench on its own — nothing whose weight the
 * athlete dials in.
 */
export type LoadImplement = 'barbell' | 'dumbbell' | 'machine'

/**
 * Precedence, because one Library entry carries two load tags
 * (`barbell-squat` is `['barbell', 'machine']`) and the *first present* tag
 * decides. Order-independent on purpose: the result never depends on how an
 * entry happens to order its own `equipment` array.
 */
const IMPLEMENT_PRECEDENCE: readonly LoadImplement[] = ['barbell', 'dumbbell', 'machine']

/**
 * Derived from the Library's equipment tags, not stated per entry — the tags
 * are unambiguous for 59 of 60 exercises, and `substituteLoad.test.ts` pins
 * every id's class so a new Library entry fails the suite until somebody
 * classifies it. `parallel-bars` and `bench` are requirements, not loading
 * methods (`types.ts`' Equipment docblock).
 */
export function loadImplementOf(exercise: Pick<Exercise, 'equipment'>): LoadImplement | null {
  return IMPLEMENT_PRECEDENCE.find((implement) => exercise.equipment.includes(implement)) ?? null
}

/**
 * The increment the substitute is adjusted in, from the **program's own
 * numbers** and never the slot's: a dumbbell slot's 2 kg is not a barbell's
 * increment (coach Q4: "preserve implement-specific adjustment increments").
 *
 *   1. the program's own prescription of this very exercise;
 *   2. otherwise the one step the program uses for every exercise on this
 *      implement, if there is exactly one;
 *   3. otherwise `null` — unknown, and the Stepper falls back to 1.
 *
 * No constants table: it would be new numbers with no source.
 */
export function implementStepKg(
  program: Program | undefined,
  exerciseById: ReadonlyMap<string, Exercise>,
  implement: LoadImplement,
  substituteId: string,
): number | null {
  if (!program) return null
  const items = program.sessions.flatMap((session) => session.items)

  const own = items.find((item) => item.exerciseId === substituteId && item.weightStepKg !== null)
  if (own) return own.weightStepKg

  const steps = new Set<number>()
  for (const item of items) {
    if (item.weightStepKg === null) continue
    const exercise = exerciseById.get(item.exerciseId)
    if (exercise !== undefined && loadImplementOf(exercise) === implement) steps.add(item.weightStepKg)
  }
  return steps.size === 1 ? [...steps][0] : null
}

/**
 * What a swap suggests for each set: the weight at that position of the
 * substitute's **most recent eligible exposure** (coach CQ2): "match by set/rung
 * position ... use only valid historical performance of the substitute exercise
 * ... do not apply the original exercise's weight or increment".
 *
 *   - One exposure, never a mixture. The newest eligible one wins even if it is
 *     shorter than an older one: [12, 14] beats an older [10, 12, 14, 16], and
 *     position 2 then has no suggestion rather than borrowing the 14.
 *   - Eligibility is `historyEligibility.ts`: completed, a normal day, the same
 *     program as the workout being swapped in, an own-identity record, and at
 *     least one weight. The walk goes back past anything that fails, so it is not
 *     "the chronologically newest record".
 *   - A position the exposure did not log (a skipped level) is `null`, and so is
 *     one it logged blank.
 *   - `basis` names the exposure it came from; absent when there was none.
 *
 * Not the "Last time" line, which keeps showing the actual most recent
 * performance whatever it was (CQ3).
 */
export function suggestedWeightsFor(
  history: readonly Workout[],
  programId: string,
  exerciseId: string,
): { startWeightsKg: (number | null)[]; basis?: { workoutId: string; date: string } } {
  const found = lastEligibleExposureFor(history, programId, exerciseId)
  if (found === null) return { startWeightsKg: [] }

  const { workout, exposure } = found
  const size = Math.max(...exposure.sets.map((set) => set.setIndex)) + 1
  const startWeightsKg = Array.from(
    { length: size },
    (_, position) => exposure.sets.find((set) => set.setIndex === position)?.weightKg ?? null,
  )
  return { startWeightsKg, basis: { workoutId: workout.id, date: workout.date } }
}

/**
 * What a swap starts from. **Every swap gets one, except a swap back to the
 * authored exercise** (`undefined`: the slot's own loads apply again).
 *
 * The coach's CQ4: the governing rule is the substitute's own history,
 * regardless of whether the implement changes — the slot's rung weights are not
 * "this exercise's load" merely because both exercises use dumbbells.
 *
 *   - a **loaded** substitute is offered, set by set, the weight at the same
 *     position of its own most recent eligible exposure (`suggestedWeightsFor`);
 *     a position without one is left blank for the athlete to choose (CC3);
 *   - an **unloaded** substitute stays unloaded: no weight control, no weight
 *     stored (the inverted row);
 *   - the **step** is the substitute's own implement's, never the slot's (CQ4:
 *     "preserve the substitute's load convention and increments");
 *   - the ceiling warning stays off every substitute (`SetScreen`).
 *
 * `authored` is the exercise the slot was prescribed for — the prescription's
 * loads belong to it, however many substitutions have happened since.
 * `programId` is the program of the workout being swapped in: only that
 * program's history is eligible (CC2).
 */
export function substituteLoadFor(input: {
  authored: Exercise
  substitute: Exercise
  program: Program | undefined
  exerciseById: ReadonlyMap<string, Exercise>
  history: readonly Workout[]
  programId: string
}): SubstituteLoad | undefined {
  const { authored, substitute } = input

  // Swapped back: the slot's own prescription describes this exercise again.
  if (authored.id === substitute.id) return undefined

  const to = loadImplementOf(substitute)
  if (to === null) return { loaded: false, startWeightsKg: [], stepKg: null }
  return {
    loaded: true,
    ...suggestedWeightsFor(input.history, input.programId, substitute.id),
    stepKg: implementStepKg(input.program, input.exerciseById, to, substitute.id),
  }
}
