/**
 * A guided recovery routine — a sequence the app *plays*, not data it
 * accumulates (docs/RecoveryRoutines.md, owner ruling 1: no completion
 * tracking of any kind).
 *
 * The defining property of these types is what they deliberately lack.
 * `RoutineStep` has no `sets`, no `weightKg`, no `mode`, no `restSeconds`,
 * no `range`, no `setPlan` — so it is not an `ExercisePrescription`, and
 * every function in domain/progression.ts takes a prescription plus logged
 * sets. Nothing here can be fed to the progression engine without someone
 * first writing a conversion, which is a visible, reviewable act rather
 * than a quiet field addition.
 *
 * There are also no prose fields at all: names and cues are locale keys
 * resolved in the i18n layer from `RoutineStep.id`. That keeps routines
 * entirely outside the seed-field guard's surface rather than inside it
 * with an exemption.
 */

export interface RoutineStep {
  /** Stable id — serves as both the locale key and the art id. Never displayed. */
  id: string
  holdSeconds: number
  /** Held once per side; routinePlaylist expands this into two plays. */
  perSide?: boolean
}

export interface Routine {
  id: string
  steps: RoutineStep[]
}

export type PlaySide = 'left' | 'right'

/** One thing the player shows at one time. */
export interface RoutinePlay {
  stepId: string
  holdSeconds: number
  side: PlaySide | null
  /** 1-based position in the expanded list — "3 of 12". */
  index: number
  total: number
}

/**
 * Left before right, so the copy can name the side. Weaker-side-first is a
 * coach question (program-content.md) and would change only this constant.
 */
const SIDES: readonly PlaySide[] = ['left', 'right']

/** A play before its position in the expanded sequence is known. */
type PlayDraft = Omit<RoutinePlay, 'index' | 'total'>

/**
 * The flat sequence the player walks, with per-side steps expanded into two
 * plays so the player never has to know sides exist.
 *
 * Unlike a workout, position here is not derived from stored data — nothing
 * is stored — so the whole sequence is computed up front and position is
 * ordinary component state.
 */
export function routinePlaylist(routine: Routine): RoutinePlay[] {
  // The callback's return type is annotated, not the result: without it the
  // ternary resolves to its first branch's type (`side: PlaySide`) and the
  // single-sided branch is then rejected for having `side: null`.
  const expanded = routine.steps.flatMap((step): PlayDraft[] =>
    step.perSide
      ? SIDES.map((side) => ({ stepId: step.id, holdSeconds: step.holdSeconds, side }))
      : [{ stepId: step.id, holdSeconds: step.holdSeconds, side: null }],
  )
  // total is known only after expansion, so index/total are stamped in a
  // second pass rather than guessed during it.
  return expanded.map((play, position) => ({
    ...play,
    index: position + 1,
    total: expanded.length,
  }))
}

/** What a routine looks like before you commit to it. */
export interface RoutineOverview {
  /**
   * Authored stretches — deliberately **not** the play count.
   *
   * `RoutinePlay.total` is the number of screens the player will show, which
   * is larger: a per-side step becomes two plays. Standing in a living room
   * looking at eight stretches, "14" is not a number anyone recognises, so
   * the preview counts what was authored and the position line inside the
   * routine keeps counting plays. The two disagreeing is correct.
   */
  stretches: number
  /**
   * Whole-routine duration, with **one lead-in per play** rather than per
   * stretch — which is why `recovery-stretch-v1` runs 547 s (9:07) against
   * the coach spec's 8:20 arithmetic. Changing a hold in the seed moves this
   * number with no edit here, which is the reason it is computed at all.
   */
  seconds: number
}

/**
 * The two numbers a ready screen needs, from one place so they cannot be
 * sourced inconsistently.
 *
 * `leadInSeconds` is a parameter rather than a constant here because the
 * value is coach content (ruling A) and lives with its own docblock beside
 * the player that issues it. Domain owns the arithmetic, not the policy.
 */
export function routineOverview(routine: Routine, leadInSeconds: number): RoutineOverview {
  const plays = routinePlaylist(routine)
  return {
    stretches: routine.steps.length,
    seconds: plays.reduce((total, play) => total + leadInSeconds + play.holdSeconds, 0),
  }
}
