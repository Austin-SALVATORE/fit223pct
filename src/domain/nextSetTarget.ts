import type { ExercisePrescription, LoggedSet, SetVariant } from './types'

/**
 * The numbers the user is about to be offered for one set — resolved **once**,
 * so the set screen and the rest screen cannot disagree.
 *
 * **This exists because they could, and the disagreement would be invisible.**
 * The set screen pre-fills weight as "whatever you just lifted, else the
 * ladder rung" — within a session, people keep the weight they just used. A
 * rest screen that recomputed from the prescription would show the *rung*:
 * the user reads 22.5 kg, walks over and loads 22.5 kg, and the next screen
 * offers 20 kg. A number that is wrong is worse than a number that is
 * absent, and the redesign that prompted this exists to make that number
 * prominent.
 *
 * **Progression replacement (28 Aug 2026 coach ruling, Phase 3 of
 * `~/.claude/plans/progression-carry-forward.md`).** This function used to
 * dispatch to `progression.ts`'s two engines to compute a next target from
 * raw cross-session history. That is gone: `progression.ts` is deleted, and
 * `prescription` here is expected to already be the **carried** prescription
 * — `carryForwardPrescription`'s output (`domain/carryForward.ts`), resolved
 * by the caller before this function ever runs. Carry-forward's whole point
 * is "each set starts where that set finished last time"; once that number
 * is baked into `prescription.setPlan`, this function's job collapses to
 * *reading a rung*, never computing one. There is no longer a cross-session
 * `previousSets` parameter, and no `readinessTier` — neither is read
 * anywhere below; the one place `readinessTier` mattered was choosing
 * whether an engine should defer an advance, and there is no advance to
 * defer any more. (An eased day still shortens a ladder — `adjustments.ts`'s
 * `applyReadiness` truncates `setPlan` before `createWorkout` ever stores it,
 * upstream of both carry-forward and this function; that mechanism is
 * unrelated to progression and untouched by this rewrite.)
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
 * not 13.5 carrying the deviation forward. Rep-range work keeps carrying
 * *within this session*, because there the prescription genuinely *is*
 * constant across sets and the carry is still correct: the rule is
 * narrowed, not deleted. (Under carry-forward, a rep-range prescription with
 * any completed history has already become a `setPlan` — see
 * `carryForward.ts`'s own docblock, "every prescription becomes a `setPlan`
 * after its first completed exposure" — so this within-session carry now
 * only fires for an exercise's genuinely first-ever exposure, or a custom
 * added set, which never gets its own rung either way.)
 *
 * Pure, per `.claude/rules/architecture.md`: no React, no i18next. It returns
 * numbers and discriminants — `source` — and never prose. Wording is the
 * UI's job, from those discriminants.
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
   *  - `carried`  — the set just logged in this session (rep-range work, or
   *    a custom added set)
   *  - `rung`     — this set's rung of the (already carried-forward) ladder
   *  - `authored` — no session log yet, and no ladder rung either: reading
   *    the coach's own authored `startWeightKg`/`range` verbatim, a
   *    genuinely first-ever exposure to this exercise
   *
   * **Renamed from `'suggestion'`, 28 Aug 2026 (Phase 3).** Nothing is
   * suggested any more — carry-forward computes nothing, so this state is
   * simply "reading the authored prescription because there is no history
   * (session-local or carried-forward) to read instead."
   *
   * **A ladder is never `'carried'`** — every set of one reports `'rung'`,
   * including set 3 after a deviating set 2. A consumer branching on this to
   * word a caption must not assume `'carried'` means "same exercise, later
   * set"; it means "rep-range work continuing at the weight you just used".
   */
  source: 'carried' | 'rung' | 'authored'
  /**
   * How this target differs from the set just logged in this session, or null
   * when there is no previous set or nothing changed. **Never a zero delta** —
   * "↑ +0 kg" is noise, and the absence is what the UI branches on.
   */
  delta: { weightKg: number; reps: number } | null
  /**
   * The target **before** this session's own history is applied — the ladder
   * rung as carried forward (or authored, on a first exposure).
   *
   * Distinct from the fields above, which carry the weight you just lifted.
   * The card shows what you are about to log; a caption shows what you were
   * *told* to do, and those are different questions. Exposed here rather than
   * recomputed by the caption because reading `prescription.setPlan[i]`
   * directly is exactly what this field already is for a rung — kept as its
   * own field for the rep-range case, where the two genuinely diverge.
   */
  prescribed: { weightKg: number | null; reps: number | null; seconds: number | null }
  /**
   * How this rung differs from the default form, when the coach prescribed
   * one — never prose (see `SetVariant`). Read from the **offered** rung
   * (the same one `weightKg`/`reps` above come from). Carry-forward
   * preserves an authored `variantKey` onto the carried rung
   * (`carryForward.ts`'s `carriedRung`), so a coach-authored tempo variant
   * keeps rendering here with no special-casing in this function — see the
   * coach's Q2 ruling: tempo *content* survives retiring the automatic
   * tempo-progression *pathway* (`variationLadder.ts`, deleted in this
   * same batch).
   */
  variantKey?: SetVariant
}

/**
 * @param prescription    the **carried** prescription — already resolved by
 *   the caller via `carryForwardPrescription`/`mostRecentCompleteExposureFor`
 *   (`domain/carryForward.ts`), and already readiness-truncated if this is
 *   an eased day (`adjustments.ts`'s `applyReadiness`, further upstream
 *   still). This function reads it; it computes nothing from history.
 * @param setsThisSession sets already logged for this exercise, this session
 * @param setIndex        0-based position of the set being resolved
 */
export function nextSetTarget(
  prescription: ExercisePrescription,
  setsThisSession: readonly LoggedSet[],
  setIndex: number,
): NextSetTarget {
  const isSeconds = prescription.mode === 'seconds'
  const carried = setsThisSession.at(-1) ?? null

  /*
    A custom slot (`Add Set`, coach spec §4) — an index at or beyond the
    ladder's own rungs (`prescription.sets`, which equals `setPlan.length`
    structurally, see workout.ts's `plannedSetIndices`). It is never a rung
    — `rung` below is already null for it — so it cannot offer a
    prescribed target the way a rung does. §4: "inherits ... the most
    recently completed set values ... If no set is complete yet, use the
    first prescribed level as the initial value." This does not contradict
    "a ladder is never carried" below: that rule is about rungs, and a
    custom slot has no rung to offer in the first place.
  */
  const isCustomSlot = prescription.setPlan !== undefined && setIndex >= prescription.sets
  const rung = prescription.setPlan?.[setIndex] ?? null

  // The prescribed target, before this session's own history is considered.
  const prescribedWeight = isCustomSlot
    ? (carried?.weightKg ?? prescription.setPlan?.[0]?.weightKg ?? null)
    : prescription.setPlan
      ? (rung?.weightKg ?? null)
      : (prescription.startWeightKg ?? null)
  const prescribedEffort = isCustomSlot
    ? (carried ? ((isSeconds ? carried.seconds : carried.reps) ?? 0) : (prescription.setPlan?.[0]?.reps ?? 0))
    : prescription.setPlan
      ? (rung?.reps ?? 0)
      : prescription.range.min

  /*
    **Carrying applies to rep-range work and custom slots only.** A ladder
    ascends by design — 12x12 -> 14x10 -> 15x8 — so letting the last logged
    set win meant the pyramid never climbed: set 2 offered set 1's weight,
    and set 3 offered set 2's. Under carry-forward the numbers *do* still
    change week to week — but only across sessions, in `prescription` itself
    (already carried by the caller), never within one, which is exactly the
    31 Jul ruling above.
  */
  const isRung = prescription.setPlan !== undefined && !isCustomSlot
  const carriedEffort = carried ? ((isSeconds ? carried.seconds : carried.reps) ?? 0) : null
  const weightKg = isRung ? prescribedWeight : (carried?.weightKg ?? prescribedWeight)
  const effort = isRung ? prescribedEffort : (carriedEffort ?? prescribedEffort)

  const source: NextSetTarget['source'] = isRung
    ? 'rung'
    : carried
      ? 'carried'
      : 'authored'

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
    variantKey: rung?.variantKey,
  }
}
