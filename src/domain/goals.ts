import type { ResolvedProfile } from './profile'
import type { Trend, TrendDirection } from './trends'

/**
 * Goal progress: **a distance, never a duration.**
 *
 * There is no `weeksRemaining`, no `estimatedDate`, no rate-of-change
 * extrapolation, and no field any of those could be put in. The user sees
 * where they are, where they said they wanted to be, and which way the
 * measurements have actually moved. Joining those three into a date is the
 * forbidden step — CLAUDE.md prohibits promising body-transformation
 * outcomes, and a target weight beside a trend line is precisely the shape
 * that invites one.
 *
 * Rejected: showing a projected date with a disclaimer. A disclaimer beside
 * a date is not a hedge; the date is what gets remembered, and the
 * prohibition is on the promise rather than on its confidence interval.
 *
 * `src/domain/goals.guard.test.ts` asserts no exported symbol here can even
 * be *named* like a forecast, so the rule survives a future reader who has
 * not read this comment.
 */
export interface GoalProgress {
  current: number
  target: number
  /** Signed, in the measurement's own unit: negative means below target. */
  remaining: number
  /**
   * Taken from the measurement trend, **not inferred from the goal**. A user
   * moving away from their target sees that honestly rather than having the
   * direction reported as whatever the goal implies. Null when there is not
   * yet enough data to claim a direction at all.
   */
  direction: TrendDirection | null
}

function progress(current: number | null, target: number | null, trend: Trend): GoalProgress | null {
  if (current == null || target == null) return null
  return {
    current,
    target,
    remaining: target - current,
    direction: trend.status === 'insufficient-data' ? null : trend.status,
  }
}

/** Null unless both a current weight and a target exist — the missing-data contract. */
export function weightGoalProgress(profile: ResolvedProfile, trend: Trend): GoalProgress | null {
  return progress(profile.currentWeightKg, profile.targetWeightKg, trend)
}

/** Null unless both a current body-fat reading and a target exist. */
export function bodyFatGoalProgress(profile: ResolvedProfile, trend: Trend): GoalProgress | null {
  return progress(profile.currentBodyFatPercent, profile.targetBodyFatPercent, trend)
}
