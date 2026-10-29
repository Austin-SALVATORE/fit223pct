import type { Exercise, Program, SubstituteLoad, Workout } from './types'
import { previousSetsFor } from './workout'

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
 * The last weight the athlete logged for this exercise, from the **same
 * lookup as the "Last time" line** above the weight control
 * (`previousSetsFor`), so the offered weight is by construction the weight
 * that line shows. "Valid" is: a completed workout, and a non-null weight —
 * the last non-null `weightKg` of the most recent exposure. Easier-day and
 * other-program logs count, as they do for "Last time" (CQ3).
 *
 * **CQ2 (coach, pending):** "most recent valid logged weight" is read here as
 * ONE value — the last non-null weight of the latest exposure — and later sets
 * carry the weight just lifted. If the coach means a weight per set position
 * (rung i starts from the substitute's own set i), this function, the
 * `carried ?? startWeightKg` branch in `nextSetTarget`, and the shape of
 * `SubstituteLoad.startWeightKg` change together.
 */
export function lastLoggedWeightKg(history: readonly Workout[], exerciseId: string): number | null {
  const withWeight = previousSetsFor(history, exerciseId).filter((set) => set.weightKg !== null)
  return withWeight.at(-1)?.weightKg ?? null
}

/**
 * What a swap starts from, or `undefined` when the slot's own loads still
 * apply: the two exercises are the same class of implement (DB bench ->
 * incline DB press keeps its 10 kg; whether that is right for two *different*
 * dumbbell set-ups is coach question CQ4, not decided here). A swap back to
 * the authored exercise is the degenerate case of that — an exercise is the
 * same class as itself — so it needs no check of its own (one was written and
 * removed: no mutation of it could turn a test red).
 *
 * `authored` is the exercise the slot was prescribed for — the prescription's
 * loads belong to it, however many substitutions have happened since.
 */
export function substituteLoadFor(input: {
  authored: Exercise
  substitute: Exercise
  program: Program | undefined
  exerciseById: ReadonlyMap<string, Exercise>
  history: readonly Workout[]
}): SubstituteLoad | undefined {
  const { authored, substitute } = input

  const from = loadImplementOf(authored)
  const to = loadImplementOf(substitute)
  if (from === to) return undefined

  if (to === null) return { loaded: false, startWeightKg: null, stepKg: null }
  return {
    loaded: true,
    startWeightKg: lastLoggedWeightKg(input.history, substitute.id),
    stepKg: implementStepKg(input.program, input.exerciseById, to, substitute.id),
  }
}
