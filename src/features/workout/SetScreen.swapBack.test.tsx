import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { workoutRepo } from '@/data/repositories'
import { createWorkout } from '@/domain/workout'
import type { LadderPrescription, Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * C4 (Phase 2b.3, CC4): after a genuine swap back, the slot is the original
 * exercise again, so everything the screen withholds from a substitute returns:
 * the prescription note, the warm-up prep, the assistance control, the
 * above-ceiling warning and the per-side pill. The coach (29 Oct): "the
 * governing information is the actual exercise performed and logged, not
 * whether the athlete interacted with the swap control".
 *
 * Two routes into that state are held to the same five assertions, because
 * they are different data: swapping away and back in the real sheet (the slot
 * is then stored with no swap state), and a record stored BEFORE CC4 as
 * "substituted for itself" (`substitutedForId === exerciseId`), which has no
 * migration and must read the same.
 *
 * The slot is goblet squat (bilateral) swapped to split squat (unilateral): a
 * unilateral substitute keeps the slot's per-side claim, so the pill alone
 * cannot tell a substitute from the original while the swap is in place, and is
 * asserted on the return, where the original is bilateral and a misreading
 * would hide it.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored
 * and `cmp`ed; traced against the code after Phase 2b.3). One reader at a time
 * goes back to the raw field (`workoutExercise.substitutedForId === undefined`):
 *   the prescription note (`showNote`)  -> "a record stored before CC4 ...: the note
 *                                          shows" and `substitutions.guard.test`
 *                                          (2 red)
 *   the assistance control             -> "...: the assistance shows" and the guard
 *   the above-ceiling warning          -> "...: the ceiling shows" and the guard
 *   the warm-up prep                   -> "...: the prep shows" and the guard
 *   the per-side pill (`showsPerSidePill`, in substitutions.ts, the one file the
 *     guard may not scan)              -> "...: the pill shows" only (1 red)
 * Each is red on ITS OWN assertion by name, and none of them is red on the
 * "away and back in the real sheet" tests: a slot returned through the sheet has
 * no swap state, so the raw comparison is true for it. The stored-record route
 * is the only one that sees a reader that never learned CC4, which is why both
 * routes are here.
 *   the write side keeps `substitutedForId`
 *                                      -> "away and back ...: the slot is stored
 *                                         with no swap state" only (the read side
 *                                         makes the five return regardless)
 *   the write side keeps `substituteLoad`
 *                                      -> "stored with no swap state" and "the
 *                                         ceiling returns" (the leftover load
 *                                         blanks the weight), and SetScreen.substitute's
 *                                         T26
 *   a second substitute recorded against the first (the slot returns as a
 *     substitute of B)                 -> all five "away and back" tests and the
 *                                         stored-shape test
 *   `isSubstitute` without its own-id clause
 *                                      -> all five "a record stored before CC4"
 *                                         tests (8 red in all, with three elsewhere)
 *   `isSubstitute` false when the record carries a `substituteLoad`
 *                                      -> "while on the substitute ..." (and seven
 *                                         others elsewhere)
 */

const A = 'goblet-squat'
const B = 'split-squat'
const NOTE = 'Keep the load close to your chest.'
const WARMUP_HEADING = 'Before your first set'
const CEILING_WARNING = "Above this program's 20 kg equipment limit. It will be logged as entered."

/** One slot carrying all five things a substitute must not inherit. */
const slotPrescription: LadderPrescription = {
  exerciseId: A,
  sets: 3,
  mode: 'reps',
  restSeconds: 90,
  perSide: true,
  setPlan: [
    { weightKg: 22, reps: 12 },
    { weightKg: 22, reps: 10 },
    { weightKg: 22, reps: 8 },
  ],
  maxWeightKg: 20,
  weightStepKg: 2,
  warmupId: 'mesocycle2-fullbody-hinge-warmup-v1',
  assistable: true,
  note: NOTE,
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

function started(): Workout {
  return createWorkout({
    id: 'swap-back',
    programId: seedProgram.id,
    session: { id: 's-swap-back', name: 'S', focus: 'F', items: [slotPrescription] },
    date: '2026-07-27',
    startedAt: '2026-07-27T09:00:00.000Z',
  })
}

async function show(workout: Workout) {
  await db.workouts.put({ ...workout, readiness: { tier: 'ready', drivers: [] } })
  render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1 })
}

/** The five things, as the athlete sees them. */
function seen() {
  return {
    note: screen.queryByText(NOTE) !== null,
    prep: screen.queryByText(WARMUP_HEADING) !== null,
    assistance: screen.queryByRole('radiogroup', { name: 'Assistance' }) !== null,
    ceiling: screen.queryByText(CEILING_WARNING) !== null,
    pill: screen.queryByText(/each side/) !== null,
  }
}
const ALL = { note: true, prep: true, assistance: true, ceiling: true, pill: true }

async function swapTo(from: string, to: RegExp) {
  await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
  const sheet = await screen.findByRole('dialog', { name: `Swap ${from}` })
  await userEvent.click(within(sheet).getByRole('button', { name: to }))
}

const FIVE = ['note', 'prep', 'assistance', 'ceiling', 'pill'] as const

describe('C4: after a genuine swap back, the slot is the original exercise again', () => {
  it('the original shows all five', async () => {
    await show(started())
    expect(seen()).toEqual(ALL)
  })

  // One test per thing, so a reader that goes back to the raw field fails by
  // name rather than as one object diff.
  async function awayAndBack() {
    await show(started())
    await swapTo('Goblet squat', /Split squat/)
    await screen.findByRole('heading', { level: 1, name: 'Split squat' })
    await swapTo('Split squat', /Goblet squat/)
    await screen.findByRole('heading', { level: 1, name: 'Goblet squat' })
  }

  it.each(FIVE)('away and back in the real sheet: the %s returns', async (key) => {
    await awayAndBack()
    expect(seen()[key]).toBe(true)
  })

  it('away and back in the real sheet: the slot is stored with no swap state', async () => {
    await awayAndBack()
    const stored = (await workoutRepo.getActive())!.exercises[0]
    expect(stored.exerciseId).toBe(A)
    expect('substitutedForId' in stored).toBe(false)
    expect('substituteLoad' in stored).toBe(false)
  })

  it('while on the substitute, the note, prep, assistance and ceiling are withheld and the unilateral pill stays', async () => {
    await show(started())
    await swapTo('Goblet squat', /Split squat/)
    await screen.findByRole('heading', { level: 1, name: 'Split squat' })
    expect(seen()).toEqual({ note: false, prep: false, assistance: false, ceiling: false, pill: true })
  })

  it.each(FIVE)(
    'a record stored before CC4 as "substituted for itself": the %s shows, with no migration',
    async (key) => {
      const w = started()
      await show({ ...w, exercises: w.exercises.map((e) => ({ ...e, substitutedForId: A })) })
      expect(seen()[key]).toBe(true)
    },
  )

  it('a genuine substitute still shows none of the four that follow the exercise (and keeps the unilateral pill)', async () => {
    const w = started()
    await show({ ...w, exercises: w.exercises.map((e) => ({ ...e, exerciseId: B, substitutedForId: A })) })
    expect(seen()).toEqual({ note: false, prep: false, assistance: false, ceiling: false, pill: true })
  })

  it("the sheet on the returned original lists the original's own options again", async () => {
    await awayAndBack()
    await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
    const sheet = await screen.findByRole('dialog', { name: 'Swap Goblet squat' })
    await waitFor(() => expect(within(sheet).getByRole('button', { name: /Split squat/ })).toBeInTheDocument())
  })
})
