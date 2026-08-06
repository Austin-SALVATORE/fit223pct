import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import type { Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * Undo last set, from inside Workout Mode. Logging is write-through, so
 * before this a mis-tapped set was permanent — and the mistake is noticed
 * one second later, during rest, which is why the control lives in the
 * header rather than on SetScreen.
 *
 * Legs & Core is used throughout because its first exercise is a ladder
 * (goblet squat, 10x12 / 12x10 / 15x8), which is what makes the
 * stale-prefill test below meaningful: the rung value is a number the UI
 * can only produce by re-deriving it, never by remembering the logged set.
 */

const LEGS_AND_CORE = seedProgram.sessions[1]

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

/** An active Legs & Core workout with `weights` logged against exercise 0. */
async function insertWorkout(weights: readonly number[] = []): Promise<void> {
  let workout: Workout = createWorkout({
    id: 'test-undo',
    programId: seedProgram.id,
    session: LEGS_AND_CORE,
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
  })
  for (const [i, weightKg] of weights.entries()) {
    workout = logSet(
      workout,
      0,
      {
        weightKg,
        reps: 12,
        seconds: null,
        completedAt: `2026-07-22T09:0${i}:00.000Z`,
      },
      i,
    )
  }
  await db.workouts.put(workout)
}

/** Exercise 0 fully logged, so the position sits at the start of exercise 1. */
async function insertWorkoutWithFirstExerciseComplete(): Promise<void> {
  await insertWorkout([10, 12, 15])
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

const undoButton = () => screen.queryByRole('button', { name: /^Undo last set/ })

describe('undo last set', () => {
  // U1
  it('is absent with nothing logged, and present once a set exists', async () => {
    await insertWorkout()
    const { unmount } = renderWorkout()
    await screen.findByRole('heading', { name: 'Goblet squat' })
    expect(undoButton()).toBeNull()
    unmount()

    await db.workouts.clear()
    await insertWorkout([10])
    renderWorkout()
    await screen.findByRole('heading', { name: 'Goblet squat' })
    await waitFor(() => expect(undoButton()).not.toBeNull())
  })

  // U2 — the one that guards the whole stale-suggestion proof.
  //
  // A suggestion can never be derived from the in-session log (previousSetsFor
  // reads only completed workouts), so the risk isn't the domain — it is
  // SetScreen's useState initializers, which seed the Steppers from the last
  // logged set at mount. If SetScreen stopped remounting when the position
  // steps back, the mistaken 40 kg would survive the undo that removed it.
  // The remount is guaranteed only by the `key` expression in WorkoutPage;
  // this test is what notices if anyone simplifies or memoises it.
  it('re-offers the ladder rung after an undo, not the mistaken weight', async () => {
    await insertWorkout([40])
    renderWorkout()

    // Set 2 is prefilled from its *own rung*, not from the mistaken set 1.
    // This assertion inverted with the 31 Jul ruling: it used to expect 40,
    // on the belief that people keep the weight they just used. That is true
    // of rep-range work and false of a ladder, which ascends by design — the
    // old behaviour meant the pyramid never climbed.
    await screen.findByText(/Set 2 of 3/)
    expect(screen.getByLabelText('Weight')).not.toHaveTextContent('40')

    await userEvent.click(screen.getByRole('button', { name: /^Undo last set/ }))

    // Back at set 1, prefilled from the ladder's first rung — the value the
    // screen offered *before* the mistake, not one derived from it.
    await screen.findByText(/Set 1 of 3/)
    await waitFor(() => expect(screen.getByLabelText('Weight')).toHaveTextContent('10'))
  })

  // U3
  it('leaves the rest phase and lands on the re-offered set', async () => {
    await insertWorkout()
    renderWorkout()

    await screen.findByRole('heading', { name: 'Goblet squat' })
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))
    // Logging auto-starts rest; the set screen is gone.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Log set' })).toBeNull())

    await userEvent.click(screen.getByRole('button', { name: /^Undo last set/ }))

    expect(await screen.findByRole('button', { name: 'Log set' })).toBeInTheDocument()
    expect(await screen.findByText(/Set 1 of 3/)).toBeInTheDocument()
  })

  // U4 — reaching backwards across the exercise boundary.
  it('names the previous exercise when the current one has not started', async () => {
    await insertWorkoutWithFirstExerciseComplete()
    renderWorkout()

    // Position is on exercise 1, but the last logged set belongs to exercise 0.
    await screen.findByRole('heading', { name: 'Bulgarian split squat' })
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Undo last set — Goblet squat, set 3 of 3' }),
      ).toBeInTheDocument(),
    )

    await userEvent.click(screen.getByRole('button', { name: /^Undo last set/ }))
    expect(await screen.findByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()
    expect(await screen.findByText(/Set 3 of 3/)).toBeInTheDocument()
  })

  // U5
  it('persists the removal, and removes exactly one set', async () => {
    await insertWorkout([10, 12])
    renderWorkout()
    await screen.findByText(/Set 3 of 3/)

    await userEvent.click(screen.getByRole('button', { name: /^Undo last set/ }))

    await waitFor(async () => {
      const [stored] = await db.workouts.toArray()
      expect(stored.exercises[0].sets).toHaveLength(1)
    })
    const [stored] = await db.workouts.toArray()
    expect(stored.exercises[0].sets[0].weightKg).toBe(10)
  })

  // U6 — the control removes itself. That is the A1 bug shape: the focused
  // element unmounts as a direct result of the tap.
  it('disappears after undoing the only set, without dropping focus to the body', async () => {
    await insertWorkout([10])
    renderWorkout()
    await screen.findByText(/Set 2 of 3/)

    await userEvent.click(screen.getByRole('button', { name: /^Undo last set/ }))

    await waitFor(() => expect(undoButton()).toBeNull())
    // Re-queried on every poll, never captured first: the undo replaces this
    // subtree, so a reference taken beforehand points at a detached node that
    // can never take focus — a false failure, and in the mirror case a false
    // pass. The element under test here is the one that exists *after* the
    // swap, by definition.
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Goblet squat' })).toHaveFocus(),
    )
    expect(document.body).not.toHaveFocus()
  })

  // U7 — the accessible name states the target before the tap, which is what
  // makes the reach-backwards case legible in advance rather than after.
  it('names the exercise and set it would remove', async () => {
    await insertWorkout([10, 12])
    renderWorkout()
    await screen.findByText(/Set 3 of 3/)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Undo last set — Goblet squat, set 2 of 3' }),
      ).toBeInTheDocument(),
    )
  })

  it('announces which set is now offered, not just the exercise', async () => {
    await insertWorkout([10])
    renderWorkout()
    await screen.findByText(/Set 2 of 3/)

    await userEvent.click(screen.getByRole('button', { name: /^Undo last set/ }))

    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: 'Goblet squat' })
      // The heading is now described by two elements — the set-position line
      // *and* the target caption — so landing announces which set is offered
      // and what the target is. The claim is unchanged and wider; the lookup
      // has to resolve each id rather than treat the whole attribute as one.
      const describedBy = (heading.getAttribute('aria-describedby') ?? '').split(' ')
      const described = describedBy
        .map((id) => document.getElementById(id)?.textContent ?? '')
        .join(' ')
      expect(described).toContain('Set 1 of 3')
    })
  })
})
