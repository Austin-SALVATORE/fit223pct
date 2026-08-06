import { suggestLadderProgression, suggestProgression, type ProgressionType } from './progression'
import type { ReadinessTier } from './readiness'
import type { ExercisePrescription, LoggedSet, SetVariant } from './types'

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
 * **The prescription is not rewritten by performance within a session.** The
 * owner's ruling, 31 Jul, and the sentence to meet before acting on any
 * instinct to follow the user's actual load:
 *
 * > The workout player should always present the coach's prescription. The
 * > user is free to override it, but the app should not silently rewrite the
 * > program based on an earlier deviation. This keeps a clear separation
 * > between prescription — what the coach intended — and performance — what
 * > the user actually completed. **The progression engine should analyse the
 * > completed workout after the session, not modify the prescription during
 * > it.**
 *
 * So a ladder's set N offers rung N, always. If the rung asks 14 kg and the
 * user only has 12.5 and logs that, set 3 still offers its prescribed 15 —
 * not 13.5 carrying the deviation forward. Rep-range work keeps carrying,
 * because there the prescription genuinely *is* constant across sets and the
 * carry is still correct: the rule is narrowed, not deleted.
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
   *
   * **A ladder is never `'carried'`** — every set of one reports `'rung'`,
   * including set 3 after a deviating set 2. A consumer branching on this to
   * word a caption must not assume `'carried'` means "same exercise, later
   * set"; it means "rep-range work continuing at the weight you just used".
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
   * `'load-not-the-lever'` is the other reason a ladder can't take another
   * step: a null-weight top rung (bodyweight work) was never limited by
   * load in the first place, so `'at-equipment-max'`'s copy would assert an
   * equipment ceiling that does not exist. Distinct from `'at-equipment-max'`
   * on purpose — same "can't advance" outcome, different caption.
   *
   * Beyond the spec's stated return shape, deliberately: the alternative is
   * each screen calling `suggestLadderProgression` again to find out, which is
   * the same divergence this function exists to prevent, one field further on.
   */
  progressionType: ProgressionType | 'at-equipment-max' | 'load-not-the-lever' | null
  /**
   * The target **before** this session's own history is applied — the ladder
   * rung as the engine has advanced it, or the suggestion.
   *
   * Distinct from the fields above, which carry the weight you just lifted.
   * The card shows what you are about to log; a caption shows what you were
   * *told* to do, and those are different questions. Exposed here rather than
   * recomputed by the caption because reading `prescription.setPlan[i]`
   * directly gives the **authored** ladder, not the advanced one — so a
   * stepped-up ladder captioned "8 kg" under a card offering 10 kg. That is
   * the same disagreement this function exists to prevent, one field over,
   * and it was caught by a test rather than by review.
   */
  prescribed: { weightKg: number | null; reps: number | null; seconds: number | null }
  /**
   * How this rung differs from the default form, when the coach prescribed
   * one — never prose (see `SetVariant`). Read from the **offered** rung
   * (the same one `weightKg`/`reps` above come from), not the authored
   * one, for the same reason `prescribed` is exposed separately: an
   * advanced or truncated rung must carry its own variant forward, never
   * silently drop it or show the wrong level's.
   */
  variantKey?: SetVariant
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
    ? suggestLadderProgression(prescription, previousSets, readinessTier)
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

  /*
    **Carrying applies to rep-range work only.** A ladder ascends by design —
    12x12 -> 14x10 -> 15x8 — so letting the last logged set win meant the
    pyramid never climbed: set 2 offered set 1's weight, and set 3 offered set
    2's. The owner had been raising every load by hand since M8 without
    knowing the app was meant to.

    That was a leftover rather than a decision. When the carry rule was
    written every loaded lift used double progression, where the same weight
    genuinely does apply across all sets, and carrying was correct. M8 added
    per-set ladders and nobody revisited it. Weight *and* effort are affected:
    both used to carry.
  */
  const isLadder = prescription.setPlan !== undefined
  const carriedEffort = carried ? ((isSeconds ? carried.seconds : carried.reps) ?? 0) : null
  const weightKg = isLadder ? prescribedWeight : (carried?.weightKg ?? prescribedWeight)
  const effort = isLadder ? prescribedEffort : (carriedEffort ?? prescribedEffort)

  const source: NextSetTarget['source'] = isLadder
    ? 'rung'
    : carried
      ? 'carried'
      : 'suggestion'

  /*
    Against the previously *logged* set, not the previous rung — deliberately.
    After logging 12.5 the jump to a prescribed 15 is a real +2.5 on the
    dumbbell, and that is the change the user is about to make. A delta
    against the prescription would report +1 and be a lie about the physical
    load.
  */
  const weightDelta = (weightKg ?? 0) - (carried?.weightKg ?? 0)
  const repsDelta = effort - (carriedEffort ?? 0)
  const delta =
    carried && (weightDelta !== 0 || repsDelta !== 0)
      ? { weightKg: weightDelta, reps: repsDelta }
      : null

  return {
    prescribed: {
      weightKg: prescribedWeight,
      reps: isSeconds ? null : prescribedEffort,
      seconds: isSeconds ? prescribedEffort : null,
    },
    weightKg,
    reps: isSeconds ? null : effort,
    seconds: isSeconds ? effort : null,
    source,
    delta,
    // A ladder that advances *is* an increased load, so it maps onto the same
    // discriminant the rep-range engine uses — otherwise a stepped-up ladder
    // would show no delta while an identical rep-range step-up showed one.
    // 'repeat' is not a state worth captioning: nothing changed.
    progressionType: ladder
      ? ladder.type === 'at-equipment-max'
        ? 'at-equipment-max'
        : ladder.type === 'load-not-the-lever'
          ? 'load-not-the-lever'
          : ladder.type === 'advance'
            ? 'increase-load'
            : null
      : (suggestion?.type ?? null),
    variantKey: rung?.variantKey,
  }
}
