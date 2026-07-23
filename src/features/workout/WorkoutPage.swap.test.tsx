import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import { WorkoutPage } from './WorkoutPage'

/**
 * SwapSheet must resolve options through effectiveSubstitutions, not
 * exercise.substitutionIds directly — program-defined fallbacks first, the
 * two lists deduped, and the whole thing reachable in the real two-tap flow
 * (tap "Swap exercise", tap a listed option).
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

async function insertActiveWorkoutWithProgramDefinedSubstitutions() {
  const session = seedProgram.sessions[1] // Legs & Core, item 0 = goblet-squat
  const workout = createWorkout({
    id: 'test-swap',
    programId: seedProgram.id,
    session,
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
  })
  const withProgramSubs = {
    ...workout,
    exercises: workout.exercises.map((e, i) =>
      i === 0
        ? {
            ...e,
            prescription: {
              ...e.prescription,
              // Overlaps the Library's own ['split-squat', 'tempo-bodyweight-squat']
              // on one id — the overlap must collapse to one entry, not repeat.
              substitutionIds: ['bench-press', 'tempo-bodyweight-squat'],
            },
          }
        : e,
    ),
  }
  await db.workouts.put(withProgramSubs)
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

describe('SwapSheet in workout mode', () => {
  it('lists program-defined substitutions first, deduped against the Library list, no repeats', async () => {
    await insertActiveWorkoutWithProgramDefinedSubstitutions()
    renderWorkout()
    await screen.findByRole('heading', { name: 'Goblet squat' })

    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))

    const sheet = await screen.findByRole('dialog', { name: 'Swap Goblet squat' })
    const options = within(sheet).getAllByRole('button').map((b) => b.textContent)
    // Program-defined (bench press, tempo bodyweight squat) before the
    // remaining Library generic (split squat); tempo bodyweight squat
    // appears exactly once despite being in both lists.
    const names = options.filter((t): t is string => t !== null && t !== 'Keep Goblet squat')
    expect(names.some((t) => t.includes('Barbell bench press'))).toBe(true)
    expect(names.some((t) => t.includes('Tempo bodyweight squat'))).toBe(true)
    expect(names.some((t) => t.includes('Split squat'))).toBe(true)
    expect(names).toHaveLength(3)

    const benchIndex = names.findIndex((t) => t.includes('Barbell bench press'))
    const splitIndex = names.findIndex((t) => t.includes('Split squat'))
    expect(benchIndex).toBeLessThan(splitIndex)
  })

  it('completes the two-tap flow: Swap exercise, then a listed option', async () => {
    await insertActiveWorkoutWithProgramDefinedSubstitutions()
    renderWorkout()
    await screen.findByRole('heading', { name: 'Goblet squat' })

    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' })) // tap 1
    const sheet = await screen.findByRole('dialog', { name: 'Swap Goblet squat' })
    await userEvent.click(within(sheet).getByRole('button', { name: /Barbell bench press/ })) // tap 2

    expect(await screen.findByRole('heading', { name: 'Barbell bench press' })).toBeInTheDocument()
    // The sheet closes on select; its exit animation is still real wall-clock
    // time (300ms), so give it a moment rather than asserting instant removal.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('SwapSheet confirm-clear step', () => {
  async function insertActiveWorkoutWithOneLoggedSet() {
    const session = seedProgram.sessions[1] // Legs & Core, item 0 = goblet-squat
    let workout = createWorkout({
      id: 'test-swap-logged',
      programId: seedProgram.id,
      session,
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
    })
    workout = logSet(workout, 0, { weightKg: 10, reps: 12, seconds: null, completedAt: '2026-07-22T09:05:00.000Z' })
    await db.workouts.put(workout)
  }

  it('shows a confirm step naming the logged-set count, instead of swapping immediately', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    await screen.findByText(/Set 2 of/)

    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
    const sheet = await screen.findByRole('dialog', { name: 'Swap Goblet squat' })
    await userEvent.click(within(sheet).getByRole('button', { name: /Split squat/ }))

    expect(within(sheet).getByText('Swap Goblet squat for Split squat?')).toBeInTheDocument()
    expect(within(sheet).getByText('1 logged set will be cleared.')).toBeInTheDocument()
    // Nothing has actually swapped yet — still on Goblet squat, still 1 set.
    expect(screen.getByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()
  })

  it('cancelling the confirm step returns to the options list without swapping', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    await screen.findByText(/Set 2 of/)

    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
    const sheet = await screen.findByRole('dialog', { name: 'Swap Goblet squat' })
    await userEvent.click(within(sheet).getByRole('button', { name: /Split squat/ }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Cancel' }))

    expect(within(sheet).getByRole('button', { name: /Split squat/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()

    const [workout] = await db.workouts.toArray()
    expect(workout.exercises[0].exerciseId).toBe('goblet-squat')
    expect(workout.exercises[0].sets).toHaveLength(1)
  })

  it('"Swap anyway" proceeds and clears the logged sets, exactly as the underlying reset always has', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    await screen.findByText(/Set 2 of/)

    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
    const sheet = await screen.findByRole('dialog', { name: 'Swap Goblet squat' })
    await userEvent.click(within(sheet).getByRole('button', { name: /Split squat/ }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Swap anyway' }))

    expect(await screen.findByRole('heading', { name: 'Split squat' })).toBeInTheDocument()
    expect(await screen.findByText(/Set 1 of/)).toBeInTheDocument()

    const [workout] = await db.workouts.toArray()
    expect(workout.exercises[0].exerciseId).toBe('split-squat')
    expect(workout.exercises[0].sets).toHaveLength(0)
  })

  it('swaps immediately, no confirm step, when nothing has been logged yet', async () => {
    await insertActiveWorkoutWithProgramDefinedSubstitutions()
    renderWorkout()
    await screen.findByRole('heading', { name: 'Goblet squat' })

    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
    const sheet = await screen.findByRole('dialog', { name: 'Swap Goblet squat' })
    await userEvent.click(within(sheet).getByRole('button', { name: /Split squat/ }))

    expect(await screen.findByRole('heading', { name: 'Split squat' })).toBeInTheDocument()
  })
})
