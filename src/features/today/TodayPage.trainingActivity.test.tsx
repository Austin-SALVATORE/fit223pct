import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { programRepo, workoutRepo } from '@/data/repositories'
import { TodayPage } from './TodayPage'
import type { Workout } from '@/domain/types'

/**
 * docs/design/ActivityPrescriptionPhaseA.md §1/§2/§4 — a training day may
 * now carry its own weekday activity (post-strength cardio, display only)
 * and the program-level morning activation, alongside the session it
 * already offers. Wednesday (weekday 3) is a training day for seedProgram
 * (Mon/Wed/Fri).
 */

// origin: 'imported' — synthetic fixtures, not the real seed's own content,
// same reasoning as TodayPage.activity.test.tsx's fixture comment.
const rideProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  weekdayActivities: {
    3: {
      kind: 'recovery' as const,
      title: 'Zone 2 ride',
      items: [{ label: 'Zone 2 ride', detail: '30 min, after lifting' }],
    },
  },
}

const activationProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  morningActivation: {
    kind: 'mobility' as const,
    title: 'Morning Activation',
    items: [
      { label: 'Cat-cow', detail: '6 controlled reps' },
      { label: 'Bodyweight squat', detail: '8 reps' },
    ],
  },
}

/**
 * A strength session already completed today (Wed 22 Jul) — the fixture
 * for the "owner finished lifting, still needs to log the ride" defect
 * (M2 first live session, 10 Aug). `sessionTemplateId` only needs to
 * resolve for `summarizeWorkout`'s set/volume math; `DoneToday` never
 * looks up the session template itself, unlike `InProgress`.
 */
function completedWorkout(programId: string): Workout {
  return {
    id: 'wed-completed-workout',
    programId,
    sessionTemplateId: seedProgram.sessions[0].id,
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
    completedAt: '2026-07-22T09:45:00.000Z',
    exercises: [],
  }
}

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) }) // Wed 22 Jul — a training day
  await seedDatabase()
})

afterEach(async () => {
  await programRepo.put(seedProgram) // restore the plain program between tests
  await db.workouts.clear()
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

describe('Today on a training day carrying its own weekday activity', () => {
  it('shows the ride below the session, without replacing the session hero or Start button', async () => {
    await programRepo.put(rideProgram)
    renderApp()

    // The session is still the point of the day — untouched by the ride.
    expect(await screen.findByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start session' })).toBeInTheDocument()

    // The ride renders too, display only.
    expect(screen.getByText('Zone 2 ride', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText(/30 min, after lifting/)).toBeInTheDocument()

    // Display only — no completion affordance for the ride either.
    expect(screen.queryByText(/mark complete/i)).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('shows nothing extra when the program has no activity for the weekday — unchanged behavior', async () => {
    // The real seed's every weekday now carries some activity (6 Aug
    // content batch — seed/program.ts's weekdayActivities comment), so
    // this needs a program that genuinely has none for the weekday,
    // same reasoning as TodayPage.activity.test.tsx's bare-rest fixture.
    await programRepo.put({ ...seedProgram, weekdayActivities: undefined })
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
    expect(screen.queryByText('Zone 2 ride')).toBeNull()
  })
})

describe('Today on a training day with morning activation', () => {
  it('shows the preparation round above the session hero', async () => {
    await programRepo.put(activationProgram)
    renderApp()

    expect(await screen.findByText('Before you start')).toBeInTheDocument()
    expect(screen.getByText('Cat-cow')).toBeInTheDocument()
    expect(screen.getByText(/6 controlled reps/)).toBeInTheDocument()
    expect(screen.getByText('Bodyweight squat')).toBeInTheDocument()

    // The session itself is unaffected.
    expect(screen.getByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
  })

  it('shows nothing extra when the program has no morning activation set — unchanged behavior', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
    expect(screen.queryByText('Before you start')).toBeNull()
  })
})

/**
 * Owner-reported defect (M2 first live session, Mon 10 Aug): the ride
 * record card lived only inside the `training` branch of `PlannedDay`,
 * which `TodayBody` never reaches once `doneToday` is true — so the
 * moment the strength session was completed, the post-lift ride became
 * unreachable, which is exactly when it's supposed to be logged.
 */
describe('Today after the strength session is already completed', () => {
  it('still shows the weekday ride record card below Done for today', async () => {
    await programRepo.put(rideProgram)
    await workoutRepo.put(completedWorkout(rideProgram.id))
    renderApp()

    // Completion state is still shown — this isn't replacing DoneToday.
    expect(await screen.findByText('Done for today')).toBeInTheDocument()

    // The ride is still reachable, same content as the training-day branch.
    expect(screen.getByText('Zone 2 ride', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText(/30 min, after lifting/)).toBeInTheDocument()
  })

  it('still shows the morning activation control below Done for today', async () => {
    await programRepo.put(activationProgram)
    await workoutRepo.put(completedWorkout(activationProgram.id))
    renderApp()

    expect(await screen.findByText('Done for today')).toBeInTheDocument()
    expect(screen.getByText('Before you start')).toBeInTheDocument()
    expect(screen.getByText('Cat-cow')).toBeInTheDocument()
  })

  it('shows nothing extra when the program has neither a weekday ride nor morning activation', async () => {
    await workoutRepo.put(completedWorkout(seedProgram.id))
    renderApp()

    expect(await screen.findByText('Done for today')).toBeInTheDocument()
    expect(screen.queryByText('Also today')).toBeNull()
    expect(screen.queryByText('Before you start')).toBeNull()
  })
})
