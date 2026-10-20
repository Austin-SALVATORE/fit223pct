import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import i18n from '@/i18n/i18next'
import { useExerciseCues } from './seedExercise'

/**
 * F4 (QA, 20 Oct). hammer-curl and incline-push-up carry a name and no cues in
 * every locale — on purpose: `exercises.ts` records "names only … none given
 * by the coach", and the coach's 11 Aug spec has prescription notes but no
 * technique text for either. Absent cues are legitimate content, not a
 * translation gap, so reading them must not raise the dev-only
 * `[i18n] missing key` error that exists to flag real gaps. A real error that
 * cries wolf on every open of two exercises trains people to ignore it.
 */
afterEach(() => {
  vi.restoreAllMocks()
})

describe('useExerciseCues', () => {
  it.each(['hammer-curl', 'incline-push-up'])('returns [] for %s without a missing-key error', (id) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useExerciseCues(id))

    expect(result.current).toEqual([])
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('missing key'))
  })

  it('still returns authored cues', async () => {
    await i18n.changeLanguage('en')
    const { result } = renderHook(() => useExerciseCues('goblet-squat'))
    expect(result.current.length).toBeGreaterThan(0)
  })
})
