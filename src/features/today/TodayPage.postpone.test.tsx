import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { TodayPage } from './TodayPage'
import type { ScheduleShift, Workout } from '@/domain/types'

/**
 * Postpone-day plan §8.6 — the Postpone control and its undo, on
 * `mesocycle-2-build` (Mon/Wed/Fri, rotation, active from Mon 10 Aug
 * 2026). Friday 14 Aug is the driving case throughout.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  await seedDatabase()
})

afterAll(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

afterEach(async () => {
  await db.workouts.clear()
  const settings = await db.settings.get('user')
  if (settings) await db.settings.put({ ...settings, scheduleShift: null })
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

async function putShift(overrides: Partial<ScheduleShift> = {}): Promise<void> {
  const settings = await db.settings.get('user')
  if (!settings) throw new Error('seedDatabase did not create a settings row')
  const shift: ScheduleShift = {
    programId: 'mesocycle-2-build',
    weekStart: '2026-08-10',
    fromDate: '2026-08-14',
    days: 1,
    createdAt: '2026-08-14T09:00:00.000Z',
    ...overrides,
  }
  await db.settings.put({ ...settings, scheduleShift: shift })
}

function makeWorkout(date: string, id: string, completed = false): Workout {
  return {
    id,
    programId: 'mesocycle-2-build',
    sessionTemplateId: 'mesocycle2-fullbody-squat',
    date,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt: completed ? `${date}T10:00:00.000Z` : null,
    exercises: [],
  }
}

describe('PostponeButton', () => {
  it('renders enabled, with no blocked reason, on a training day', async () => {
    vi.setSystemTime(new Date(2026, 7, 14, 9, 0, 0)) // Friday 14 Aug
    renderApp()

    const button = await screen.findByRole('button', { name: "Postpone today's session" })
    expect(button).toBeEnabled()
  })

  it('is absent on a rest day', async () => {
    vi.setSystemTime(new Date(2026, 7, 13, 9, 0, 0)) // Thursday 13 Aug — not a training weekday
    renderApp()

    // Thursday carries its own authored recovery activity, so the day
    // renders the activity hero rather than the bare rest hero — either
    // way, it's a rest-classified day, and that's what's under test.
    await screen.findByRole('heading', { name: 'Recovery day' })
    expect(screen.queryByRole('button', { name: "Postpone today's session" })).toBeNull()
  })

  it('is disabled with a reason when a shift already exists this week', async () => {
    // Monday 10 Aug is itself unaffected by a Wed-postponement shift
    // (the cascade only moves dates >= fromDate), so it still renders as
    // an ordinary training day — the only way to see "already-shifted"
    // on a day the button is otherwise offered on.
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0, 0))
    await putShift({ fromDate: '2026-08-12' })
    renderApp()

    const button = await screen.findByRole('button', { name: "Postpone today's session" })
    expect(button).toBeDisabled()
    expect(screen.getByText('A session has already been postponed this week.')).toBeInTheDocument()
  })

  it('is not offered once a workout exists for today', async () => {
    vi.setSystemTime(new Date(2026, 7, 14, 9, 0, 0))
    await db.workouts.put(makeWorkout('2026-08-14', 'w-today'))
    renderApp()

    // InProgress's resume control is a Link, not a button.
    await screen.findByRole('link', { name: 'Resume session' })
    expect(screen.queryByRole('button', { name: "Postpone today's session" })).toBeNull()
  })

  it('pressing writes the shift; Friday shows the moved-to state and undo', async () => {
    vi.setSystemTime(new Date(2026, 7, 14, 9, 0, 0))
    renderApp()

    await userEvent.click(await screen.findByRole('button', { name: "Postpone today's session" }))

    expect(await screen.findByRole('heading', { name: /Moved to/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo — keep it today' })).toBeInTheDocument()

    const settings = await db.settings.get('user')
    expect(settings?.scheduleShift?.fromDate).toBe('2026-08-14')
    expect(settings?.scheduleShift?.weekStart).toBe('2026-08-10')
  })

  it('undo clears the shift and returns Friday to its training view', async () => {
    vi.setSystemTime(new Date(2026, 7, 14, 9, 0, 0))
    await putShift()
    renderApp()

    await userEvent.click(await screen.findByRole('button', { name: 'Undo — keep it today' }))

    expect(await screen.findByRole('button', { name: "Postpone today's session" })).toBeInTheDocument()
    const settings = await db.settings.get('user')
    expect(settings?.scheduleShift).toBeNull()
  })

  it('undo is absent once a workout exists on the shifted (receiving) date', async () => {
    vi.setSystemTime(new Date(2026, 7, 14, 9, 0, 0))
    await putShift()
    // Completed, not in-progress — `workoutRepo.getActive()` has no date
    // scoping at all, so an in-progress workout on any date (even a
    // future one) would hijack Today into the InProgress branch and this
    // test would never reach the postponed-Friday view under test.
    await db.workouts.put(makeWorkout('2026-08-15', 'w-saturday', true))
    renderApp()

    await screen.findByRole('heading', { name: /Moved to/ })
    // PostponedDay's own workoutRepo.getByDate query settles a tick after
    // the page's outer query does — wait for it rather than asserting
    // synchronously against a loading-frame flash.
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Undo — keep it today' })).toBeNull(),
    )
  })
})
