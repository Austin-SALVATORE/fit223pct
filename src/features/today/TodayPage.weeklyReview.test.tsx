import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { TodayPage } from './TodayPage'
import type { Workout } from '@/domain/types'

/**
 * The weekly review is not attendance-dependent (docs/Progress.md): it
 * appears on the first open after the week ends, whichever day that is —
 * not gated to Monday — and disappears for good once seen, persisted via
 * settingsRepo. It also must not vanish mid-session the instant that
 * "seen" write lands, since the write happens as a side effect of showing it.
 */

function workout(id: string, date: string): Workout {
  return {
    id,
    programId: seedProgram.id,
    sessionTemplateId: 'A',
    date,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt: `${date}T10:00:00.000Z`,
    exercises: [
      {
        exerciseId: 'goblet-squat',
        prescription: {
          exerciseId: 'goblet-squat',
          sets: 2,
          mode: 'reps',
          range: { min: 8, max: 12 },
          restSeconds: 120,
          perSide: false,
          startWeightKg: 14,
          maxWeightKg: null,
          weightStepKg: null,
        },
        sets: [
          { setIndex: 0, weightKg: 14, reps: 10, seconds: null, completedAt: `${date}T09:10:00.000Z` },
        ],
      },
    ],
    readiness: { tier: 'ready', drivers: [] },
  }
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const WEEK_START = '2026-07-20'

describe('Weekly review on Today', () => {
  beforeAll(async () => {
    await seedDatabase()
    // Every scheduled Mon/Wed/Fri that week (20/22/24 Jul) gets a completed
    // workout — the "all done" headline branch this suite exercises.
    await db.workouts.bulkPut([
      workout('w1', '2026-07-20'),
      workout('w2', '2026-07-22'),
      workout('w3', '2026-07-24'),
    ])
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  afterAll(async () => {
    await db.workouts.clear()
    await db.settings.clear()
  })

  it('appears on a non-Monday open, reviewing the week that just finished — facts only', async () => {
    await db.settings.update('user', { lastSeenWeeklyReviewWeekStart: null })
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 30, 9, 0, 0) }) // Thursday
    renderApp()
    expect(await screen.findByLabelText('Last week')).toBeInTheDocument()
    expect(screen.getByText('Every scheduled session, done.')).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()

    // Wait for this test's own mark-seen write to land before finishing —
    // otherwise it can resolve mid-way through the NEXT test and clobber
    // that test's reset, a cross-test race the earlier flake was made of.
    await waitFor(async () => {
      const settings = await db.settings.get('user')
      expect(settings?.lastSeenWeeklyReviewWeekStart).toBe(WEEK_START)
    })
  })

  it('stays visible for the rest of this session even after the seen-write commits', async () => {
    await db.settings.update('user', { lastSeenWeeklyReviewWeekStart: null })
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 30, 9, 0, 0) })
    renderApp()
    expect(await screen.findByLabelText('Last week')).toBeInTheDocument()

    // Let the mark-seen write (and the reactive settings refresh it
    // triggers) actually land...
    await waitFor(async () => {
      const settings = await db.settings.get('user')
      expect(settings?.lastSeenWeeklyReviewWeekStart).toBe(WEEK_START)
    })
    // ...and confirm the card is still on screen despite that, because this
    // session's decision to show it was locked in at mount.
    expect(screen.getByLabelText('Last week')).toBeInTheDocument()
  })

  it('does not reappear on a later open once that week has been seen', async () => {
    await db.settings.update('user', { lastSeenWeeklyReviewWeekStart: WEEK_START })
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 1, 9, 0, 0) }) // the following Saturday
    renderApp()
    await screen.findByText(/Saturday/)
    expect(screen.queryByLabelText('Last week')).toBeNull()
  })
})
