import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { seedExercises } from '@/data/seed/exercises'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import type { Workout } from '@/domain/types'
import { SessionSummary } from './SessionSummary'

/**
 * docs/design/SessionSetCustomization.md §4, "Skipped this session
 * surfaces in four places" — this is the summary's ("At the end").
 */

const exerciseById = new Map(seedExercises.map((e) => [e.id, e]))

function baseWorkout(): Workout {
  return createWorkout({
    id: 'w-summary',
    programId: seedProgram.id,
    session: seedProgram.sessions[1], // Legs & Core, item 0 = goblet-squat
    date: '2026-08-07',
    startedAt: '2026-08-07T09:00:00.000Z',
  })
}

function renderSummary(workout: Workout) {
  return render(
    <MemoryRouter>
      <SessionSummary workout={workout} exerciseById={exerciseById} history={[]} />
    </MemoryRouter>,
  )
}

describe('SessionSummary — custom sets and skipped levels', () => {
  it('notes a custom set on the exercise line', () => {
    let workout = baseWorkout()
    workout = logSet(
      workout,
      0,
      { weightKg: 10, reps: 12, seconds: null, completedAt: '2026-08-07T09:05:00.000Z', custom: true },
      3,
    )
    workout = { ...workout, exercises: [{ ...workout.exercises[0], customSlots: 1 }, ...workout.exercises.slice(1)] }
    renderSummary(workout)

    expect(screen.getByText('1 custom set')).toBeInTheDocument()
  })

  it('notes skipped levels on the exercise line', () => {
    let workout = baseWorkout()
    workout = logSet(
      workout,
      0,
      { weightKg: 12, reps: 10, seconds: null, completedAt: '2026-08-07T09:05:00.000Z' },
      1,
    )
    workout = {
      ...workout,
      exercises: [{ ...workout.exercises[0], skippedLevels: [0] }, ...workout.exercises.slice(1)],
    }
    renderSummary(workout)

    expect(screen.getByText('1 level skipped')).toBeInTheDocument()
  })

  it('shows both on the same line when an exercise has both', () => {
    let workout = baseWorkout()
    workout = logSet(
      workout,
      0,
      { weightKg: 12, reps: 10, seconds: null, completedAt: '2026-08-07T09:05:00.000Z' },
      1,
    )
    workout = logSet(
      workout,
      0,
      { weightKg: 10, reps: 12, seconds: null, completedAt: '2026-08-07T09:06:00.000Z', custom: true },
      3,
    )
    workout = {
      ...workout,
      exercises: [
        { ...workout.exercises[0], skippedLevels: [0], customSlots: 1 },
        ...workout.exercises.slice(1),
      ],
    }
    renderSummary(workout)

    expect(screen.getByText('1 custom set · 1 level skipped')).toBeInTheDocument()
  })

  /**
   * QA finding (blocking) — a fully-skipped exercise (every prescribed
   * level in skippedLevels, zero logged sets, no custom slots) vanished
   * from this list entirely: the exercise filter was `sets.length > 0`,
   * and plannedSetIndices correctly returns [] here, so sets never grows
   * past 0. Coach spec §4: "retain it in the audit history" — the worst
   * case (nothing done at all), not an edge one.
   */
  it('shows a fully-skipped exercise — every prescribed level skipped, zero logged sets', () => {
    const workout = {
      ...baseWorkout(),
      exercises: [
        { ...baseWorkout().exercises[0], skippedLevels: [0, 1, 2] }, // goblet-squat, 3-rung ladder, all skipped
        ...baseWorkout().exercises.slice(1),
      ],
    }
    renderSummary(workout)

    expect(screen.getByText('Goblet squat')).toBeInTheDocument()
    expect(screen.getByText('3 levels skipped')).toBeInTheDocument()
  })

  it('shows neither line for an exercise with no custom sets or skips — unchanged behavior', () => {
    let workout = baseWorkout()
    workout = logSet(
      workout,
      0,
      { weightKg: 10, reps: 12, seconds: null, completedAt: '2026-08-07T09:05:00.000Z' },
      0,
    )
    renderSummary(workout)

    expect(screen.queryByText(/custom set/)).toBeNull()
    expect(screen.queryByText(/level skipped/)).toBeNull()
  })
})
