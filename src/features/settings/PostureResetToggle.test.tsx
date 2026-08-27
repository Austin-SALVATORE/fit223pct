import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { settingsRepo } from '@/data/repositories'
import { PostureResetToggle } from './PostureResetToggle'
import { TodayPage } from '@/features/today/TodayPage'

/**
 * Phase 4 (plan `~/.claude/plans/morning-posture-reset.md` §8) — the one
 * settings surface writing `morningPostureResetActivatedAt`. The
 * cross-feature consequence (Morning section appears/disappears on Today)
 * is covered in `TodayPage.morningSection.test.tsx`'s "the flag gate"
 * describe block, which already proves the flag drives the section; this
 * file proves the toggle itself writes the right value and touches
 * nothing else.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  const settings = await db.settings.get('user')
  if (settings) await db.settings.put({ ...settings, morningPostureResetActivatedAt: null })
})

function renderToggle() {
  return render(
    <MemoryRouter>
      <PostureResetToggle />
    </MemoryRouter>,
  )
}

describe('PostureResetToggle', () => {
  /**
   * `useLiveQuery` renders once with `settings === undefined` before its
   * async Dexie query resolves, so `screen.findByRole('switch')` alone can
   * resolve against that first, not-yet-live-updated render — invisible
   * running this file alone (fast), real under the full suite's load
   * (three of these went red there, all "expected true, got false", the
   * exact shape of that race). `findByRole('switch', { checked })` retries
   * until the attribute matches, so it waits out the live query instead of
   * sampling it once.
   */
  it('starts off by default, aria-checked false', async () => {
    renderToggle()
    expect(await screen.findByRole('switch', { checked: false })).toBeInTheDocument()
  })

  it('toggling on writes a date, not a boolean', async () => {
    renderToggle()
    const toggle = await screen.findByRole('switch', { checked: false })
    fireEvent.click(toggle)
    await screen.findByText('On')

    const settings = await settingsRepo.get()
    expect(settings?.morningPostureResetActivatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('toggling off writes null', async () => {
    await settingsRepo.update({ morningPostureResetActivatedAt: '2026-08-27' })
    renderToggle()
    const toggle = await screen.findByRole('switch', { checked: true })

    fireEvent.click(toggle)
    await screen.findByText('Off')

    const settings = await settingsRepo.get()
    expect(settings?.morningPostureResetActivatedAt).toBeNull()
  })

  it('the setting survives a reload — a fresh mount reads the persisted value', async () => {
    await settingsRepo.update({ morningPostureResetActivatedAt: '2026-08-27' })
    const { unmount } = renderToggle()
    await screen.findByRole('switch', { checked: true })
    unmount()

    renderToggle()
    expect(await screen.findByRole('switch', { checked: true })).toBeInTheDocument()
  })

  it('touches only settings — workouts, activity records, and programs are untouched', async () => {
    const [beforeWorkouts, beforeActivityRecords, beforePrograms] = await Promise.all([
      db.workouts.toArray(),
      db.activityRecords.toArray(),
      db.programs.toArray(),
    ])

    renderToggle()
    const toggle = await screen.findByRole('switch', { checked: false })
    fireEvent.click(toggle)
    await screen.findByText('On')

    expect(await db.workouts.toArray()).toEqual(beforeWorkouts)
    expect(await db.activityRecords.toArray()).toEqual(beforeActivityRecords)
    expect(await db.programs.toArray()).toEqual(beforePrograms)
  })
})

/**
 * The actual round trip the lead's brief asks for — through the real
 * toggle UI, through `settingsRepo`, into Dexie, read back by `TodayPage`.
 * Not a shortcut `settingsRepo.update` call standing in for it.
 */
describe('PostureResetToggle → Today, end to end', () => {
  it('toggling on makes the Morning section appear on Today; toggling off makes it disappear', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) }) // Monday 20 Jul — an ordinary training day
    try {
      const settingsRender = renderToggle()
      const toggle = await screen.findByRole('switch', { checked: false })

      fireEvent.click(toggle)
      await screen.findByText('On')
      settingsRender.unmount()

      const todayRenderOn = render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<TodayPage />} />
          </Routes>
        </MemoryRouter>,
      )
      expect(await screen.findByText('Morning Posture Reset')).toBeInTheDocument()
      todayRenderOn.unmount()

      const settingsRenderAgain = renderToggle()
      const toggleAgain = await screen.findByRole('switch', { checked: true })
      fireEvent.click(toggleAgain)
      await screen.findByText('Off')
      settingsRenderAgain.unmount()

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<TodayPage />} />
          </Routes>
        </MemoryRouter>,
      )
      await screen.findByRole('button', { name: 'Start session' })
      expect(screen.queryByText('Morning Posture Reset')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
