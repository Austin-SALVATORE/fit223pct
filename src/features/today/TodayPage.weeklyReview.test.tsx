import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { TodayPage } from './TodayPage'
import type { Workout } from '@/domain/types'

/**
 * The weekly review is a Monday-only moment (docs/Progress.md), reviewing
 * the week just finished — never a permanent dashboard tile, and never a
 * claim beyond what that one week actually contained.
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
          targetRir: 2,
          restSeconds: 120,
          perSide: false,
          startWeightKg: 14,
          maxWeightKg: null,
          weightStepKg: null,
        },
        sets: [
          { setIndex: 0, weightKg: 14, reps: 10, seconds: null, rir: 2, completedAt: `${date}T09:10:00.000Z` },
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

describe('Weekly review on Today', () => {
  beforeAll(async () => {
    await seedDatabase()
    await db.workouts.bulkPut([workout('w1', '2026-07-21'), workout('w2', '2026-07-23')])
  })

  afterAll(async () => {
    vi.useRealTimers()
    await db.workouts.clear()
  })

  it('does not appear on a non-Monday', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) }) // Wednesday
    renderApp()
    expect(await screen.findByText(/Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday/))
      .toBeInTheDocument()
    expect(screen.queryByLabelText('Last week')).toBeNull()
    vi.useRealTimers()
  })

  it('appears on Monday, reviewing the week that just finished — facts only', async () => {
    // Monday 27 Jul reviews Mon 20 – Sun 26 Jul; program starts Tue 21 Jul, so
    // Mon 20 isn't scheduled — 2 of 2 scheduled sessions in that window were completed.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 27, 9, 0, 0) })
    renderApp()
    expect(await screen.findByLabelText('Last week')).toBeInTheDocument()
    expect(screen.getByText('Every scheduled session, done.')).toBeInTheDocument()
    expect(screen.getByText('2/2')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
