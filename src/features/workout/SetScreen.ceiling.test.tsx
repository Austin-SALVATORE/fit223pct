import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import type { LadderPrescription } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * Owner ruling, 21 Oct: at the equipment ceiling the set screen says so, in
 * one line under the weight. "+" stays inert there (Stepper clamp, untouched)
 * — without the line it just looked broken.
 */

const CAPTION = 'Your equipment tops out here.'

function ladderAt(weights: number[], maxWeightKg: number): LadderPrescription {
  return {
    exerciseId: 'goblet-squat',
    sets: weights.length,
    mode: 'reps',
    restSeconds: 120,
    perSide: false,
    setPlan: weights.map((weightKg) => ({ weightKg, reps: 10 })),
    maxWeightKg,
    weightStepKg: 2,
  }
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

async function start(prescription: LadderPrescription) {
  await db.workouts.put(
    createWorkout({
      id: 'ceiling',
      programId: seedProgram.id,
      session: { id: 's', name: 'S', focus: 'Squat', items: [prescription] },
      date: '2026-07-27',
      startedAt: '2026-07-27T09:00:00.000Z',
    }),
  )
  render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { name: 'Goblet squat' })
}

describe('the equipment-ceiling caption', () => {
  it('shows at the ceiling, and "+" leaves the weight unchanged', async () => {
    await start(ladderAt([14, 14], 14))

    expect(screen.getByText(CAPTION)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(screen.getByLabelText('Weight')).toHaveTextContent('14')
    expect(screen.getByText(CAPTION)).toBeInTheDocument()
  })

  it('is absent below the ceiling, and appears once "+" reaches it', async () => {
    await start(ladderAt([12, 12], 14))

    expect(screen.queryByText(CAPTION)).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(screen.getByLabelText('Weight')).toHaveTextContent('14')
    expect(screen.getByText(CAPTION)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(screen.queryByText(CAPTION)).toBeNull()
  })
})
