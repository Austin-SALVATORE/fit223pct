import { describe, expect, it } from 'vitest'
import { postureResetIsActive } from './postureReset'
import type { UserSettings } from './types'

function settings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    id: 'user',
    name: 'Test',
    weeklyGoal: 3,
    lastSeenWeeklyReviewWeekStart: null,
    ...overrides,
  }
}

describe('postureResetIsActive', () => {
  it('is false for undefined settings', () => {
    expect(postureResetIsActive(undefined)).toBe(false)
  })

  it('is false when the field is absent', () => {
    expect(postureResetIsActive(settings())).toBe(false)
  })

  it('is false when the field is explicitly null (never turned on, or turned off again)', () => {
    expect(postureResetIsActive(settings({ morningPostureResetActivatedAt: null }))).toBe(false)
  })

  it('is true once an activation date is set', () => {
    expect(postureResetIsActive(settings({ morningPostureResetActivatedAt: '2026-08-27' }))).toBe(true)
  })
})
