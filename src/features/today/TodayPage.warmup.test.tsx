import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
import type { Workout } from '@/domain/types'
import { TodayPage } from './TodayPage'

/**
 * The pre-strength warm-up (11 Aug plan §4b) — must be reachable on Today
 * both before the session starts and while it's in progress. Placed only
 * in the planned branch is precisely the defect `dc5a119` fixed for the
 * post-lift ride: the card vanishes the moment the owner taps Start,
 * exactly when a ramp-up load is needed at the dumbbells.
 *
 * `warmupId: 'mesocycle2-chest-back-warmup-v1'` is a real, shipped
 * catalogue entry (src/data/seed/warmups.ts) — only the link on this
 * synthetic fixture's session is test-only, following
 * TodayPage.trainingActivity.test.tsx's own override pattern.
 */

const SEED_PROGRAM_ID = 'phase-1-home'
const SEED_SESSION_ID = 'chest-back'

const warmupProgram = {
  ...seedProgram,
  sessions: seedProgram.sessions.map((s) =>
    s.id === SEED_SESSION_ID ? { ...s, warmupId: 'mesocycle2-chest-back-warmup-v1' } : s,
  ),
}

beforeAll(async () => {
  // Monday 20 Jul 2026 — a training day for the seed's weekday-pinned schedule.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) })
  await seedDatabase()
})

afterEach(async () => {
  await programRepo.put(seedProgram) // restore the plain program between tests
  await db.workouts.clear()
})

afterAll(async () => {
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

async function startWorkout(): Promise<void> {
  const workout: Workout = {
    id: 'workout-in-progress',
    programId: SEED_PROGRAM_ID,
    sessionTemplateId: SEED_SESSION_ID,
    date: '2026-07-20',
    startedAt: '2026-07-20T09:00:00.000Z',
    completedAt: null,
    exercises: [],
  }
  await db.workouts.put(workout)
}

describe('the warm-up card before the session starts', () => {
  it('renders above the session hero, with the ramp-up loads as text', async () => {
    await programRepo.put(warmupProgram)
    renderApp()

    expect(await screen.findByText('Warm-up')).toBeInTheDocument()
    expect(screen.getByText('Easy cycling · 2–3 min')).toBeInTheDocument()
    expect(screen.getByText('Scapular push-up')).toBeInTheDocument()
    expect(screen.getByText('5.2 kg per dumbbell × 8')).toBeInTheDocument()
    expect(screen.getByText('8.2 kg per dumbbell × 5')).toBeInTheDocument()

    // Still the session's day — the warm-up doesn't replace anything.
    expect(screen.getByRole('button', { name: 'Start session' })).toBeInTheDocument()
  })

  it('shows nothing extra when the session has no warmupId — unchanged behavior', async () => {
    renderApp()
    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
    expect(screen.queryByText('Warm-up')).toBeNull()
  })
})

describe('the warm-up card while the session is in progress', () => {
  it('stays visible after the owner taps Start — the dc5a119 lesson, not reproduced here', async () => {
    await programRepo.put(warmupProgram)
    await startWorkout()
    renderApp()

    expect(await screen.findByRole('link', { name: 'Resume session' })).toBeInTheDocument()
    expect(screen.getByText('Warm-up')).toBeInTheDocument()
    expect(screen.getByText('Scapular push-up')).toBeInTheDocument()
    expect(screen.getByText('5.2 kg per dumbbell × 8')).toBeInTheDocument()
  })

  it('shows nothing extra in progress when the session has no warmupId', async () => {
    await startWorkout()
    renderApp()
    expect(await screen.findByRole('link', { name: 'Resume session' })).toBeInTheDocument()
    expect(screen.queryByText('Warm-up')).toBeNull()
  })
})
