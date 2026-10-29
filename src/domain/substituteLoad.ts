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
 * (`previousSetsFor`). "Valid" is: a completed workout, and a non-null weight —
 * the last non-null `weightKg` of the most recent exposure; easier-day and
 * other-program logs count, as they do for "Last time".
 *
 * **Not called while the suggestion is disabled** (owner, 29 Oct 16:53: "every
 * swap starts with a blank weight until the coach's set-by-set rule is built").
 * Kept, with its tests, for Phase 2b.1, which replaces it. It reads the
 * readings the coach has since ruled against: CQ2 asks for the weight at the
 * *same rung position*, not one value, and CQ3 excludes easier days and
 * unrelated programs, which this includes. **CQ2 (coach): the suggestion is
 * disabled pending 2b.1**; this function, the substitute branch of
 * `nextSetTarget`, and the shape of `SubstituteLoad.startWeightKg` change
 * together.
 */
export function lastLoggedWeightKg(history: readonly Workout[], exerciseId: string): number | null {
  const withWeight = previousSetsFor(history, exerciseId).filter((set) => set.weightKg !== null)
  return withWeight.at(-1)?.weightKg ?? null
}

/**
 * What a swap starts from. **Every swap gets one, except a swap back to the
 * authored exercise** (`undefined`: the slot's own loads apply again).
 *
 * **A stopgap, by the owner's ruling of 29 Oct 16:53:** "deploy now, but every
 * swap starts with a blank weight until the coach's set-by-set rule is built."
 * The coach's CQ2-CQ4 rulings (`docs/programs/coach-rulings-cq1-cq7-2026-10-29.md`)
 * ask for the substitute's own valid history, matched rung by rung, for *every*
 * substitute — same implement included (CQ4: "do not preserve the original
 * slot's load merely because both exercises use dumbbells"). That is Phase
 * 2b.1. Until it exists, the two readings Phase 2.3 shipped would each offer a
 * number the rulings forbid: a single weight from the latest exposure (CQ2),
 * which may be an easier day or another program (CQ3); and the slot's own rung
 * weights on a same-implement swap, which put a bench's 10 kg on a lateral
 * raise (CQ4). So a loaded substitute starts empty ("—", the athlete types
 * it), and history is not read at all.
 *
 *   - an **unloaded** substitute stays unloaded: no weight control, no weight
 *     stored (the inverted row);
 *   - the **step** is still the substitute's own implement's, never the slot's
 *     (CQ4: "preserve the substitute's load convention and increments");
 *   - the ceiling warning stays off every substitute (`SetScreen`).
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

  // Swapped back: the slot's own prescription describes this exercise again.
  if (authored.id === substitute.id) return undefined

  const to = loadImplementOf(substitute)
  if (to === null) return { loaded: false, startWeightKg: null, stepKg: null }
  return {
    loaded: true,
    // CQ2 (coach): the suggestion is disabled pending Phase 2b.1 — blank, never
    // `lastLoggedWeightKg(input.history, substitute.id)`. `history` stays in the
    // input for that rework.
    startWeightKg: null,
    stepKg: implementStepKg(input.program, input.exerciseById, to, substitute.id),
  }
}
