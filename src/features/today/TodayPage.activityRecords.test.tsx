import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { activityRecordRepo, programRepo, workoutRepo } from '@/data/repositories'
import { TodayPage } from './TodayPage'

/**
 * docs/design/SessionSetCustomization.md, records half — a ride record
 * (actualMinutes + avgHeartRate, both required) and an activation
 * completion mark, each persisted through `activityRecordRepo` and each
 * independent of the day's session and of each other by construction
 * (`ActivityRecord` lives in its own Dexie table, never touching
 * `workouts` — see types.ts/repositories.ts).
 *
 * Wednesday (weekday 3) is a training day for seedProgram (Mon/Wed/Fri);
 * Tuesday (weekday 2) is a rest day.
 */

// origin: 'imported' — synthetic fixtures, not the real seed's own content,
// same reasoning as TodayPage.trainingActivity.test.tsx's fixture comment.
// `recordable: 'ride'` is the structural marker a ride record control
// attaches under (types.ts) — plain content items must NOT show one.
const trainingDayRideProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  weekdayActivities: {
    3: {
      kind: 'recovery' as const,
      title: 'Zone 2 ride',
      items: [{ label: 'Zone 2 ride', detail: '20 min, after lifting', recordable: 'ride' as const }],
    },
  },
}

const restDayRideProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  weekdayActivities: {
    2: {
      kind: 'recovery' as const,
      title: 'Zone 2 ride',
      items: [{ label: 'Zone 2 ride', detail: '20 min easy', recordable: 'ride' as const }],
    },
  },
}

const nonRecordableActivityProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  weekdayActivities: {
    3: {
      kind: 'recovery' as const,
      title: 'Mobility work',
      items: [{ label: 'Hip flexor stretch' }],
    },
  },
}

const activationProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  morningActivation: {
    kind: 'mobility' as const,
    title: 'Morning Activation',
    items: [{ label: 'Cat-cow', detail: '6 controlled reps' }],
  },
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await programRepo.put(seedProgram) // restore the plain program between tests
  await db.activityRecords.clear()
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

describe('Ride record on a training day', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) }) // Wed 22 Jul
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('saves duration and heart rate, and does not touch the session', async () => {
    await programRepo.put(trainingDayRideProgram)
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
    expect(screen.getByText('Ride record')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Increase Duration' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Avg heart rate' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save ride' }))

    const records = await activityRecordRepo.getByDate('2026-07-22')
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ kind: 'ride', actualMinutes: 20, avgHeartRate: 130 })

    // The session is untouched — no workout was created or completed by saving a ride.
    expect(await workoutRepo.getByDate('2026-07-22')).toBeUndefined()
    // No activation record was created as a side effect.
    expect(records.some((r) => r.kind === 'activation')).toBe(false)
  })

  it('does not render a ride record control for a non-recordable activity', async () => {
    await programRepo.put(nonRecordableActivityProgram)
    renderApp()
    expect(await screen.findByText('Hip flexor stretch')).toBeInTheDocument()
    expect(screen.queryByText('Ride record')).toBeNull()
  })
})

describe('Activation record on a training day', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) }) // Wed 22 Jul
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('marks activation done without touching the session or a ride record', async () => {
    await programRepo.put(activationProgram)
    renderApp()

    expect(await screen.findByText('Before you start')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark done' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Mark done' }))

    expect(await screen.findByText('Activation done')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()

    const records = await activityRecordRepo.getByDate('2026-07-22')
    expect(records).toHaveLength(1)
    expect(records[0].kind).toBe('activation')
    expect(await workoutRepo.getByDate('2026-07-22')).toBeUndefined()
  })
})

describe('Ride record on a rest day', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 21, 9, 0, 0) }) // Tue 21 Jul, seedProgram's startDate
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('renders under the rest-day activity hero and saves independently of the rest state', async () => {
    await programRepo.put(restDayRideProgram)
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Zone 2 ride' })).toBeInTheDocument()
    expect(screen.getByText('Ride record')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Increase Duration' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Avg heart rate' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save ride' }))

    const records = await activityRecordRepo.getByDate('2026-07-21')
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ kind: 'ride', actualMinutes: 20, avgHeartRate: 130 })
  })
})
