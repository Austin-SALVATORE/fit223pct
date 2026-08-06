import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import { workoutRepo } from '@/data/repositories'
import type { Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * docs/design/SessionSetCustomization.md §4 / coach spec §4 — Add Set,
 * Remove (with confirmation for a prescribed level), and Undo, on the set
 * screen. Legs & Core's goblet-squat (session index 1, item 0) is a
 * 3-rung ladder.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

function freshWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    ...createWorkout({
      id: 'test-customization',
      programId: seedProgram.id,
      session: seedProgram.sessions[1], // Legs & Core
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
    }),
    ...overrides,
  }
}

function renderWorkout() {
  return render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Add Set', () => {
  it('opens a custom slot, offered after every prescribed level, session-only', async () => {
    await db.workouts.put(freshWorkout({ readiness: { tier: 'ready', drivers: [] } }))
    renderWorkout()

    expect(await screen.findByText(/Set 1 of 3/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add set' }))

    // Still offers the prescribed level first — the custom slot goes to
    // the end of plannedSetIndices, not in front of it.
    expect(await screen.findByText(/Set 1 of 4/)).toBeInTheDocument()

    const stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].customSlots).toBe(1)
    // Session-only — the canonical prescription is untouched.
    expect(stored?.exercises[0].prescription.sets).toBe(3)
  })

  it('is capped at two custom slots per exercise', async () => {
    await db.workouts.put(
      freshWorkout({
        readiness: { tier: 'ready', drivers: [] },
        exercises: [
          { ...freshWorkout().exercises[0], customSlots: 2 },
          ...freshWorkout().exercises.slice(1),
        ],
      }),
    )
    renderWorkout()

    await screen.findByText(/Set 1 of/)
    expect(screen.queryByRole('button', { name: 'Add set' })).toBeNull()
  })

  it('is unavailable on an eased (Yellow) session', async () => {
    await db.workouts.put(freshWorkout({ readiness: { tier: 'easier', drivers: [] } }))
    renderWorkout()

    await screen.findByText(/Set 1 of/)
    expect(screen.queryByRole('button', { name: 'Add set' })).toBeNull()
  })
})

describe('Remove this set', () => {
  it('requires confirmation before skipping a prescribed level, and the pyramid stays incomplete', async () => {
    await db.workouts.put(freshWorkout({ readiness: { tier: 'ready', drivers: [] } }))
    renderWorkout()

    await screen.findByText(/Set 1 of 3/)
    await userEvent.click(screen.getByRole('button', { name: 'Remove this set' }))

    // Confirmation, not an immediate removal.
    expect(await screen.findByRole('heading', { name: 'Skip this set?' })).toBeInTheDocument()
    let stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].skippedLevels ?? []).toEqual([])

    await userEvent.click(screen.getByRole('button', { name: 'Skip this set' }))

    // Level 0 skipped — position moves to level 1, counter now "of 2".
    expect(await screen.findByText(/Set 1 of 2/)).toBeInTheDocument()
    stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].skippedLevels).toEqual([0])
    // Retained for audit, not erased — the canonical prescription is untouched.
    expect(stored?.exercises[0].prescription.sets).toBe(3)
  })

  it('cancelling the confirmation changes nothing', async () => {
    await db.workouts.put(freshWorkout({ readiness: { tier: 'ready', drivers: [] } }))
    renderWorkout()

    await screen.findByText(/Set 1 of 3/)
    await userEvent.click(screen.getByRole('button', { name: 'Remove this set' }))
    await screen.findByRole('heading', { name: 'Skip this set?' })
    await userEvent.click(screen.getByRole('button', { name: 'Keep it' }))

    expect(await screen.findByText(/Set 1 of 3/)).toBeInTheDocument()
    const stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].skippedLevels ?? []).toEqual([])
  })

  it('removes an unfilled custom slot immediately, no confirmation', async () => {
    // All 3 prescribed levels already logged, one custom slot opened — the
    // set screen is showing that slot (workoutPosition offers it last).
    let workout = freshWorkout({ readiness: { tier: 'ready', drivers: [] } })
    for (let i = 0; i < 3; i += 1) {
      workout = logSet(
        workout,
        0,
        { weightKg: 10, reps: 12, seconds: null, completedAt: '2026-07-22T09:05:00.000Z' },
        i,
      )
    }
    workout = {
      ...workout,
      exercises: [{ ...workout.exercises[0], customSlots: 1 }, ...workout.exercises.slice(1)],
    }
    await db.workouts.put(workout)
    renderWorkout()
    expect(await screen.findByText(/Set 4 of 4/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Remove this set' }))
    // No confirmation heading — removed immediately.
    expect(screen.queryByRole('heading', { name: 'Skip this set?' })).toBeNull()

    const stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].customSlots).toBe(0)
  })
})

describe('Undo after a removal', () => {
  it('restores a skipped level', async () => {
    await db.workouts.put(freshWorkout({ readiness: { tier: 'ready', drivers: [] } }))
    renderWorkout()

    await screen.findByText(/Set 1 of 3/)
    await userEvent.click(screen.getByRole('button', { name: 'Remove this set' }))
    await screen.findByRole('heading', { name: 'Skip this set?' })
    await userEvent.click(screen.getByRole('button', { name: 'Skip this set' }))
    await screen.findByText(/Set 1 of 2/)

    await userEvent.click(screen.getByRole('button', { name: /^Undo skip/ }))

    expect(await screen.findByText(/Set 1 of 3/)).toBeInTheDocument()
    const stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].skippedLevels ?? []).toEqual([])
  })
})
