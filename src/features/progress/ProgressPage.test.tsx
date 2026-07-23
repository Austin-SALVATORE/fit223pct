import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { ExercisePage } from '@/features/library/ExercisePage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { ProgressPage } from './ProgressPage'
import type { Workout } from '@/domain/types'

/**
 * Milestone 4 acceptance criteria, exercised directly:
 * - no direction is ever shown from fewer than three data points (the
 *   insufficient-data copy renders instead);
 * - stagnation carries its named evidence in the DOM, not just a label.
 *
 * Time is frozen to the program's start date (Tue 21 Jul) so
 * consistencyTrend's "yesterday" window is deterministic regardless of the
 * real wall clock — ProgressPage reads `new Date()` directly.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 21, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  // Unmount before clearing — a still-subscribed useLiveQuery component
  // racing a table mutation is exactly the kind of cross-test flake that
  // undermines confidence in the whole suite.
  cleanup()
  await db.workouts.clear()
})

function renderApp(initialPath = '/progress') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/library/:exerciseId" element={<ExercisePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function squatWorkout(id: string, date: string, weightKg: number, reps: number): Workout {
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
          sets: 3,
          mode: 'reps',
          range: { min: 8, max: 12 },
          restSeconds: 120,
          perSide: false,
          startWeightKg: weightKg,
          maxWeightKg: 20,
          weightStepKg: 2,
        },
        sets: [
          {
            setIndex: 0,
            weightKg,
            reps,
            seconds: null,
            completedAt: `${date}T09:10:00.000Z`,
          },
        ],
      },
    ],
  }
}

describe('Settings entry', () => {
  it('round-trips Progress → Settings → Progress', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('link', { name: 'Settings' }))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Progress/ }))
    expect(await screen.findByRole('heading', { name: 'Progress' })).toBeInTheDocument()
  })
})

describe('ProgressPage — insufficient data is never dressed up as a trend', () => {
  it('shows one honest message, not eight repeated cards, when nothing has been logged', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Progress' })).toBeInTheDocument()
    expect(
      await screen.findByText(/first week is still in progress|check back/i),
    ).toBeInTheDocument()
    // A single consolidated message, not one "no data" card per main lift —
    // repeating the same sentence eight times is noise, not information.
    expect(
      await screen.findByText('Log a few sessions to start seeing strength trends here.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Log this exercise a few more times/)).toBeNull()
    expect(
      await screen.findByText(/A few more waist measurements/),
    ).toBeInTheDocument()
  })

  it('lists an exercise with partial history quietly, without claiming a direction', async () => {
    await db.workouts.bulkPut([
      squatWorkout('w1', '2026-07-21', 14, 10),
      squatWorkout('w2', '2026-07-23', 14, 11),
    ])
    renderApp()
    expect(await screen.findByText('Still gathering data')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Goblet squat/ })).toBeInTheDocument()
    expect(await screen.findByText('2 of 3 sessions')).toBeInTheDocument()
    // No direction word appears anywhere for an exercise with only two sessions.
    expect(screen.queryByText(/trending up|holding steady|trending down/)).toBeNull()
  })
})

describe('ProgressPage — stagnation surfaces named evidence', () => {
  it('shows the exact dated values behind a stagnation claim, plus a substitution', async () => {
    await db.workouts.bulkPut([
      squatWorkout('w1', '2026-07-21', 16, 10),
      squatWorkout('w2', '2026-07-23', 16, 10),
      squatWorkout('w3', '2026-07-25', 16, 9),
    ])
    renderApp()
    // "3 sessions" is its own element (tabular-nums styling); asserted
    // separately from the surrounding sentence, which default text matching
    // can't join across that element boundary.
    expect(await screen.findByText('3 sessions')).toBeInTheDocument()
    expect(screen.getByText(/No increase in/)).toBeInTheDocument()
    // Both dimensions are shown per point — a session's reps still moved
    // even when weight didn't, and hiding that is the exact bug that let
    // double progression misread as a plateau.
    expect(
      screen.getByText(/16 kg × 10 reps → 16 kg × 10 reps → 16 kg × 9 reps/),
    ).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Split squat/ })).toBeInTheDocument()
  })

  it('never shows a stagnation callout for double progression — flat weight, climbing reps', async () => {
    await db.workouts.bulkPut([
      squatWorkout('w1', '2026-07-21', 16, 9),
      squatWorkout('w2', '2026-07-23', 16, 11),
      squatWorkout('w3', '2026-07-25', 16, 12),
    ])
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Progress' })).toBeInTheDocument()
    expect(await screen.findByText(/holding steady|trending up/)).toBeInTheDocument()
    expect(screen.queryByText(/No increase in/)).toBeNull()
    expect(screen.queryByText(/Worth a change of stimulus/)).toBeNull()
  })

  it('round-trips Progress → exercise detail → Progress without landing on Library', async () => {
    await db.workouts.bulkPut([
      squatWorkout('w1', '2026-07-21', 16, 10),
      squatWorkout('w2', '2026-07-23', 16, 10),
      squatWorkout('w3', '2026-07-25', 16, 9),
    ])
    renderApp()
    await userEvent.click(await screen.findByRole('link', { name: 'Goblet squat' }))
    expect(await screen.findByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Progress/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Progress/ }))
    expect(await screen.findByRole('heading', { name: 'Progress' })).toBeInTheDocument()
  })
})
