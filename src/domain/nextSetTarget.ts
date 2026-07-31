import { suggestLadderProgression, suggestProgression, type ProgressionType } from './progression'
import type { ReadinessTier } from './readiness'
import type { ExercisePrescription, LoggedSet } from './types'

/**
 * The numbers the user is about to be offered for one set — resolved **once**,
 * so the set screen and the rest screen cannot disagree.
 *
 * **This exists because they could, and the disagreement would be invisible.**
 * The set screen pre-fills weight as "whatever you just lifted, else the
 * ladder rung, else the suggestion" — within a session, people keep the weight
 * they just used. A rest screen that recomputed from the prescription would
 * show the *rung*: the user reads 22.5 kg, walks over and loads 22.5 kg, and
 * the next screen offers 20 kg. A number that is wrong is worse than a number
 * that is absent, and the redesign that prompted this exists to make that
 * number prominent.
 *
 * Pure, per `.claude/rules/architecture.md`: no React, no i18next. It returns
 * numbers and discriminants — `source`, `progressionType` — and never prose.
 * Wording is the UI's job, from those discriminants.
 */
export interface NextSetTarget {
  /** Null when the prescription carries no load — bodyweight work. */
  weightKg: number | null
  /** Null in seconds mode. */
  reps: number | null
  /** Null in reps mode. */
  seconds: number | null
  /**
   * Where the numbers came from, so a caption can explain itself without
   * re-deriving it:
   *  - `carried`    — the set just logged in this session
   *  - `rung`       — this set's rung of the ladder
   *  - `suggestion` — the double-progression engine
   */
  source: 'carried' | 'rung' | 'suggestion'
  /**
   * How this target differs from the set just logged in this session, or null
   * when there is no previous set or nothing changed. **Never a zero delta** —
   * "↑ +0 kg" is noise, and the absence is what the UI branches on.
   */
  delta: { weightKg: number; reps: number } | null
  /**
   * The engine's own classification, carried through so the caption can show
   * `MAX` rather than an up-arrow at the equipment ceiling. That state is the
   * reason the engine distinguishes it and it must not read as a failure to
   * progress.
   *
   * Beyond the spec's stated return shape, deliberately: the alternative is
   * each screen calling `suggestLadderProgression` again to find out, which is
   * the same divergence this function exists to prevent, one field further on.
   */
  progressionType: ProgressionType | 'at-equipment-max' | null
}

/**
 * @param setsThisSession sets already logged for this exercise, this session
 * @param previousSets    the same exercise's sets from the last session it appeared in
 * @param setIndex        0-based position of the set being resolved
 * @param readinessTier   absent when the day was not rated — neutral, not missing
 */
export function nextSetTarget(
  prescription: ExercisePrescription,
  setsThisSession: readonly LoggedSet[],
  previousSets: readonly LoggedSet[],
  setIndex: number,
  // Optional, matching `suggestProgression` — an unrated day is neutral,
  // not a missing input.
  readinessTier?: ReadinessTier,
): NextSetTarget {
  const isSeconds = prescription.mode === 'seconds'
  const carried = setsThisSession.at(-1) ?? null

  const ladder = prescription.setPlan
    ? suggestLadderProgression(prescription, previousSets)
    : null
  const rung = ladder?.setPlan[setIndex] ?? null
  const suggestion = prescription.setPlan
    ? null
    : suggestProgression(prescription, previousSets, readinessTier)

  // The prescribed target, before this session's own history is considered.
  const prescribedWeight = prescription.setPlan
    ? (rung?.weightKg ?? null)
    : (suggestion?.weightKg ?? prescription.startWeightKg ?? null)
  const prescribedEffort = prescription.setPlan
    ? (rung?.reps ?? 0)
    : (suggestion?.targetReps ?? 0)

  // Carrying is per-field on the weight and whole on the effort, matching what
  // the set screen already did: `lastSet?.weightKg ?? prescribed` leaves a
  // bodyweight set (weightKg null) falling through to the prescription, while
  // the effort carries whenever any set exists.
  const weightKg = carried?.weightKg ?? prescribedWeight
  const effort = carried ? ((isSeconds ? carried.seconds : carried.reps) ?? 0) : prescribedEffort

  const source: NextSetTarget['source'] = carried
    ? 'carried'
    : prescription.setPlan
      ? 'rung'
      : 'suggestion'

  const previousEffort = carried ? ((isSeconds ? carried.seconds : carried.reps) ?? 0) : null
  const weightDelta = (weightKg ?? 0) - (carried?.weightKg ?? 0)
  const repsDelta = effort - (previousEffort ?? 0)
  const delta =
    carried && (weightDelta !== 0 || repsDelta !== 0)
      ? { weightKg: weightDelta, reps: repsDelta }
      : null

  return {
    weightKg,
    reps: isSeconds ? null : effort,
    seconds: isSeconds ? effort : null,
    source,
    delta,
    progressionType: ladder
      ? ladder.type === 'at-equipment-max'
        ? 'at-equipment-max'
        : null
      : (suggestion?.type ?? null),
  }
}
