import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import i18n from '@/i18n/i18next'
import { seedDatabase } from '@/data/seed'
import { TodayPage } from './TodayPage'
import type { ScheduleShift } from '@/domain/types'

/**
 * Postpone-day plan §8.4 / R1 — the activity travels with a postponed
 * session, but its locale key must travel too, or fr/zh-CN silently
 * render Saturday's own recovery copy over Friday's ride content.
 * English cannot see this: `useLocalizedActivity` falls through
 * `defaultValue` to the English literal regardless of which weekday key
 * was used, so this guard must run in a non-English locale — same
 * pattern as `TodayPage.activityLocale.test.tsx`.
 */

const fridayToSaturday: ScheduleShift = {
  programId: 'mesocycle-2-build',
  weekStart: '2026-08-10',
  fromDate: '2026-08-14',
  days: 1,
  createdAt: '2026-08-14T18:00:00.000Z',
}

beforeAll(async () => {
  // Saturday 15 Aug 2026 — the receiving day of a Fri 14 -> Sat 15 postpone.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 15, 9, 0, 0) })
  await seedDatabase()
  const settings = await db.settings.get('user')
  if (!settings) throw new Error('seedDatabase did not create a settings row')
  await db.settings.put({ ...settings, scheduleShift: fridayToSaturday })
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

afterAll(() => {
  vi.useRealTimers()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('a shifted-in training day, localized (R1)', () => {
  it('renders weekday 5 (Friday)\'s activity content in fr, never weekday 6\'s', async () => {
    await i18n.changeLanguage('fr')
    renderApp()

    expect(await screen.findByText('Étirements Corps entier C')).toBeInTheDocument()

    // Weekday 6 (Saturday)'s own recovery-day content must never leak in.
    expect(screen.queryByText('Jour de récupération')).toBeNull()
    expect(screen.queryByText('Marche normale')).toBeNull()
    // English fallback must never leak in either — the defect this test
    // exists to catch is invisible in English, but a passing key check
    // could still be paired with an accidental English literal elsewhere.
    expect(screen.queryByText('Full Body C Stretching')).toBeNull()
  })

  it('renders weekday 5 (Friday)\'s activity content in zh-CN, never weekday 6\'s', async () => {
    await i18n.changeLanguage('zh-CN')
    renderApp()

    expect(await screen.findByText('全身训练C拉伸')).toBeInTheDocument()

    expect(screen.queryByText('恢复日')).toBeNull()
    expect(screen.queryByText('正常散步')).toBeNull()
    expect(screen.queryByText('Full Body C Stretching')).toBeNull()
  })
})
