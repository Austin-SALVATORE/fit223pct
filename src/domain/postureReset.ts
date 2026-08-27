import type { UserSettings } from './types'

/**
 * The Morning Posture Reset render gate. True only once the athlete has
 * activated the module (coach doc 23 §11, 27 Aug 2026 — "THE ATHLETE
 * decides when to activate it… product semantics should simply be
 * equivalent to: Enable Morning Posture Reset — OFF / ON"). Same
 * contract as `hasVerifiedLoadList` (`domain/workout.ts`) and
 * `profileConfirmedAt` (`types.ts`'s `UserSettings`) — absent, or the
 * field unset, means inactive, never defaulted.
 *
 * Takes no `Program` argument, deliberately — this is what makes the
 * gate survive every mesocycle boundary (`UserSettings.
 * morningPostureResetActivatedAt`'s own doc; plan §1.7). A future
 * caller (Phase 3's `TodayBody`) reads this above the program-driven
 * four-way branch, not inside it.
 */
export function postureResetIsActive(settings: UserSettings | undefined): boolean {
  return settings?.morningPostureResetActivatedAt != null
}
