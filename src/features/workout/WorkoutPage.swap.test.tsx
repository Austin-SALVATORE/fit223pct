import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
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
