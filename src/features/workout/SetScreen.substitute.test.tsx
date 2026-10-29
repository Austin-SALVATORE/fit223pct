import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
import i18n from '@/i18n/i18next'
import { completeWorkout, createWorkout, logSet } from '@/domain/workout'
import type { LadderPrescription, Program, Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * Cross-implement substitution start (coach Q4, option b), through the real
 * Workout Mode: swap in the real sheet, read what the Set and Rest screens
 * offer, log, and read what was stored. Track A Phase 2.3, with A2b
 * ('inverted-row' in the single-arm row's list) — which must never ship
 * without this: on its own it measured a dumbbell row's 10 kg stored on a
 * bodyweight row.
 *
 * What a substitute of a *different implement* gets: its own last logged
 * weight or nothing, its own implement's step, no ceiling, no per-dumbbell
 * "each side" it does not have, and no weight at all for a bodyweight
 * movement. What a same-implement substitute gets: the slot's loads, as before.
 *
 * Negative controls, run 29 Oct (mutation applied, this file and the domain
 * tests run, restored byte-for-byte). Test names are shortened: "remounts" is
 * "the swap remounts the screen ...", "increment" is "a barbell substitute
 * steps in the program's barbell increment ...". "Stale key" means
 * `workoutExercise.exerciseId` removed from the Set screen's motion key in
 * WorkoutPage.tsx, so a swap does not remount it.
 *   stale key                          -> remounts, T21, T22, T26
 *   stale key AND the log guard
 *     `weightKg: target.loaded ? weightKg : null` reverted to `weightKg`
 *                                      -> the four above AND T19 (10 stored on
 *                                         the inverted row)
 *   the log guard alone                -> NOTHING: all green. With the key in
 *     place no stale weight can reach it, so it is defence in depth that only
 *     the pair above can see.
 *   SetScreen passes no substituteLoad to nextSetTarget
 *                                      -> T19 ('10kg' offered on a bodyweight
 *                                         movement), remounts, T20, T21, T22,
 *                                         T23, T26
 *   `nextSetTarget` offers the slot's rung where the substitute's weight goes
 *                                      -> remounts, T21, T22, T26, and three
 *                                         nextSetTarget unit tests (not T20)
 *   `nextSetTarget` ignores the weight just lifted (later sets)
 *                                      -> T20 (set 2), and the unit test
 *   the `weightKg` branch of `nextSetTarget` dropped (the rung is offered)
 *                                      -> T19b (Rest screen: "12 kg × 10 ↑ 12 kg
 *                                         heavier"), remounts, T20-T22, T26, and
 *                                         five nextSetTarget unit tests — NOT T19
 *   `target.loaded` gate reverted to `weightKg !== null`
 *                                      -> remounts, T20, T23, T26, increment
 *   every swap treated as incompatible -> T24 and the unit test
 *   the per-side pill — the rule is `showsPerSidePill`: the slot's claim, which a
 *   swap may hide but never add (the first 2.3 build also added it; the
 *   independent check found it)
 *     the old expression `substitutedForId === undefined ? prescription.perSide
 *       : exercise.isUnilateral` in SetScreen
 *                                      -> T23 and "goblet squat -> split squat"
 *     the same old rule inside the helper
 *                                      -> the helper's "does NOT add it" row, T23,
 *                                         and "goblet squat -> split squat"
 *     the slot's raw `prescription.perSide` in SetScreen (a swap never hides it)
 *                                      -> T19 only
 *     the helper never hiding (`return true`)
 *                                      -> the helper's "hides it" row, T19, and
 *                                         the Rest screen test
 *     the Rest screen reading the raw `prescription.perSide`
 *                                      -> "does not put 'each side' on an inverted
 *                                         row ..." (the Rest screen test) only
 *   step from the slot, not the substitute
 *                                      -> T23 and increment
 *   fr: raw number in the caption      -> both T27 tests
 *   fr: raw number in "Last time"      -> the first T27 test only
 *   swapExercise keeps the old substituteLoad
 *                                      -> T26 and the domain test
 *   'inverted-row' removed from the single-arm row's list
 *                                      -> T19 and the Library test
 *
 * **A prescribed control that stayed green, and why.** The plan prescribed,
 * for T19, "drop the `substitute` branch in `nextSetTarget` -> `10kg` shown ->
 * red". Dropping the branch that decides the offered *weight* leaves T19 GREEN:
 * the Set screen's weight control is gated on the separate `loaded` flag, which
 * is still false for a bodyweight substitute, so the Set screen shows and logs
 * no weight. It is NOT harmless on the Rest screen, which reads
 * `target.weightKg` directly: under this mutation it showed "Inverted row 12 kg
 * × 10 ↑ 12 kg heavier than the set you just did" where it should say "10
 * reps". The independent check of 34bec42 found nothing but a unit test
 * guarding that, so T19b now does (it went red under this mutation, on its
 * first assertion, "10 reps"; the "no kg" and "heavier" lines are behind it).
 * The weight expression is also what the
 * loaded-substitute tests see (remounts, T20-T22, T26 and five unit tests went
 * red). The control that reaches T19 itself is the one above: stop passing the
 * substitute load at all.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** The Full Body B row slot: per-dumbbell weights, per-side, 2 kg steps, a 38 ceiling. */
function dumbbellRow(): LadderPrescription {
  return {
    exerciseId: 'single-arm-db-row',
    sets: 3,
    mode: 'reps',
    restSeconds: 90,
    perSide: true,
    setPlan: [
      { weightKg: 10, reps: 12 },
      { weightKg: 12, reps: 10 },
      { weightKg: 14, reps: 8 },
    ],
    maxWeightKg: 38,
    weightStepKg: 2,
  }
}

/** The Full Body C row slot: body weight, no load of any kind. */
function invertedRow(): LadderPrescription {
  return {
    exerciseId: 'inverted-row',
    sets: 3,
    mode: 'reps',
    restSeconds: 90,
    perSide: false,
    setPlan: [
      { weightKg: null, reps: 8 },
      { weightKg: null, reps: 8 },
      { weightKg: null, reps: 8 },
    ],
    maxWeightKg: null,
    weightStepKg: null,
  }
}

function dumbbellBench(): LadderPrescription {
  return {
    exerciseId: 'dumbbell-bench-press',
    sets: 4,
    mode: 'reps',
    restSeconds: 90,
    perSide: false,
    setPlan: [10, 12, 14, 16].map((weightKg) => ({ weightKg, reps: 10 })),
    maxWeightKg: 20,
    weightStepKg: 2,
  }
}

async function start(item: LadderPrescription, programId: string = mesocycle2Build.id) {
  await db.workouts.put(
    createWorkout({
      id: 'sub',
      programId,
      session: { id: 's', name: 'S', focus: 'F', items: [item] },
      date: '2026-10-24',
      startedAt: '2026-10-24T09:00:00.000Z',
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
}

/** Two slots, so there is a "next exercise" for the Rest screen to introduce. */
async function startTwo(first: LadderPrescription, second: LadderPrescription) {
  await db.workouts.put(
    createWorkout({
      id: 'sub',
      programId: mesocycle2Build.id,
      session: { id: 's', name: 'S', focus: 'F', items: [first, second] },
      date: '2026-10-24',
      startedAt: '2026-10-24T09:00:00.000Z',
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
}

async function swapTo(option: RegExp, heading: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
  await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: option }))
  await screen.findByRole('heading', { name: heading })
}

async function typeWeight(value: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Edit Weight' }))
  const input = screen.getByRole('textbox', { name: 'Weight' })
  await userEvent.clear(input)
  await userEvent.type(input, `${value}{Enter}`)
}

const weightControl = () => screen.queryByLabelText('Weight', { selector: 'output' })
const weightText = () => weightControl()?.textContent

async function logCurrentSet() {
  await userEvent.click(screen.getByRole('button', { name: 'Log set' }))
  await waitFor(async () => expect((await db.workouts.get('sub'))?.exercises[0].sets.length).toBeGreaterThan(0))
  return (await db.workouts.get('sub'))!.exercises[0]
}

/** A completed workout that logged `weights` against `exerciseId`, 12 reps each. */
async function putHistory(exerciseId: string, date: string, weights: number[], item: LadderPrescription) {
  let workout: Workout = createWorkout({
    id: `hist-${exerciseId}-${date}`,
    programId: mesocycle2Build.id,
    session: { id: 'h', name: 'H', focus: 'F', items: [{ ...item, exerciseId }] },
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  weights.forEach((weightKg, index) => {
    workout = logSet(
      workout,
      0,
      { weightKg, reps: 12, seconds: null, completedAt: `${date}T09:1${index}:00.000Z` },
      index,
    )
  })
  await db.workouts.put(completeWorkout(workout, `${date}T10:00:00.000Z`))
}

// ---------------------------------------------------------------------------
// A bodyweight substitute of a loaded slot
// ---------------------------------------------------------------------------

describe('a bodyweight substitute (Dumbbell row -> Inverted row)', () => {
  it('T19: the weight control is gone, the caption names no kg, there is no per-side pill, and no weight is stored', async () => {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    // Before the swap the slot's own claims are all there.
    expect(weightText()).toBe('10kg')
    expect(screen.getByText(/each side/)).toBeInTheDocument()

    await swapTo(/Inverted row/, 'Inverted row')

    expect(weightControl()).toBeNull()
    expect(screen.queryByRole('button', { name: 'Edit Weight' })).toBeNull()
    // The rung's reps still apply; its dumbbell weight does not.
    expect(screen.getByText('Rung 1 of 3 · 12 reps')).toBeInTheDocument()
    expect(screen.queryByText(/each side/)).toBeNull()

    const stored = await logCurrentSet()
    expect(stored.exerciseId).toBe('inverted-row')
    expect(stored.substitutedForId).toBe('single-arm-db-row')
    expect(stored.sets[0].weightKg).toBeNull()
    expect(stored.sets[0].reps).toBe(12)
  })
})

describe('the Rest screen after a set on a bodyweight substitute', () => {
  it('T19b: offers reps only — never the dumbbell row\'s weight, nor a "heavier" delta against nothing', async () => {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Inverted row/, 'Inverted row')
    await logCurrentSet()

    // Set 2 of the slot's ladder is 10 reps (and 12 kg on the dumbbell row it replaced).
    expect(await screen.findByText('10 reps')).toBeInTheDocument()
    expect(screen.queryByText(/\bkg\b/)).toBeNull()
    expect(screen.queryByText(/heavier|lighter/)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// A loaded substitute of a different implement
// ---------------------------------------------------------------------------

describe('a loaded substitute of another implement (Dumbbell row -> Barbell bent-over row)', () => {
  it('the swap remounts the screen: the substitute is not offered the weight it replaced', async () => {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    expect(weightText()).toBe('10kg')

    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    // No history for the barbell row: nothing is offered, never the dumbbell's 10.
    expect(weightText()).toBe('—')
    expect(weightText()).not.toBe('10kg')
  })

  it('T20: with no history it offers no weight, lets the athlete type one, steps in the barbell increment, and carries the weight just lifted', async () => {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    // The caption states reps only; the slot's per-dumbbell 10 kg is not a target here.
    expect(screen.getByText('Rung 1 of 3 · 12 reps')).toBeInTheDocument()
    expect(screen.getByText('First time — the numbers below are your starting point.')).toBeInTheDocument()
    // No ceiling line: 41.75 is above the dumbbell slot's 38, and that ceiling is not this exercise's.
    await typeWeight('41.75')
    expect(weightText()).toBe('41.75kg')
    expect(screen.queryByText(/equipment limit/)).toBeNull()

    // The program's own barbell increment is 2.
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('43.75kg')
    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(weightText()).toBe('41.75kg')

    const stored = await logCurrentSet()
    expect(stored.sets[0].weightKg).toBe(41.75)

    // Rest, then set 2: both offer the weight just lifted, not the 12 kg rung.
    expect(await screen.findByText('41.75 kg × 10')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await screen.findByRole('heading', { name: 'Barbell bent-over row' })
    expect(weightText()).toBe('41.75kg')
  })

  it("T21: with history it offers the substitute's own last logged weight, never the slot's rung", async () => {
    await putHistory('bent-over-row', '2026-10-17', [17.75, 21.75, 25.75, 29.75], dumbbellRow())
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    expect(weightText()).toBe('29.75kg')
    // The same number the "Last time" line above it ends on.
    expect(screen.getByText(/12×29\.75 kg/)).toBeInTheDocument()
    expect(screen.getByText('Rung 1 of 3 · 12 reps')).toBeInTheDocument()
  })

  it('T22: an untouched — is logged as no weight, not as zero and not as the old rung', async () => {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    const stored = await logCurrentSet()
    expect(stored.sets[0].weightKg).toBeNull()
  })

  it('swapping back to the authored exercise gives the slot its own loads again (T26)', async () => {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')
    expect(weightText()).toBe('—')

    await swapTo(/Single-arm dumbbell row/, 'Single-arm dumbbell row')

    expect(weightText()).toBe('10kg')
    expect(screen.getByText('Rung 1 of 3 · 10 kg × 12')).toBeInTheDocument()
    const stored = (await db.workouts.get('sub'))!.exercises[0]
    expect('substituteLoad' in stored).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// An unloaded slot swapped to a loaded exercise
// ---------------------------------------------------------------------------

describe('an unloaded slot swapped to a loaded exercise (Inverted row -> Dumbbell row)', () => {
  it('T23: the weight control appears, empty — and the per-side pill is not added, because the slot never claimed it', async () => {
    await start(invertedRow())
    await screen.findByRole('heading', { name: 'Inverted row' })
    // As authored: no control, no pill.
    expect(weightControl()).toBeNull()
    expect(screen.queryByText(/each side/)).toBeNull()

    await swapTo(/Single-arm dumbbell row/, 'Single-arm dumbbell row')

    expect(weightText()).toBe('—')
    // The single-arm row is unilateral in the Library, but the slot it was
    // swapped into is not per-side, and a swap may hide that claim, never add
    // it: what the reps mean is not ours to decide (plan DD-A3d).
    expect(screen.queryByText(/each side/)).toBeNull()

    await typeWeight('12')
    // The program's own prescription of the dumbbell row steps in 2.
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('14kg')

    const stored = await logCurrentSet()
    expect(stored.exerciseId).toBe('single-arm-db-row')
    expect(stored.sets[0].weightKg).toBe(14)
  })
})

// ---------------------------------------------------------------------------
// A same-implement swap keeps the slot's loads (CQ4, unchanged by this work)
// ---------------------------------------------------------------------------

describe('a same-implement substitute (Dumbbell bench -> Incline dumbbell press)', () => {
  it("T24: still offers the slot's own rung and step", async () => {
    await start(dumbbellBench())
    await screen.findByRole('heading', { name: 'Dumbbell bench press' })
    await swapTo(/Incline dumbbell press/, 'Incline dumbbell press')

    expect(weightText()).toBe('10kg')
    expect(screen.getByText('Rung 1 of 4 · 10 kg × 10')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('12kg')

    const stored = await logCurrentSet()
    expect(stored.exerciseId).toBe('incline-dumbbell-press')
    expect(stored.sets[0].weightKg).toBe(12)
  })
})

// ---------------------------------------------------------------------------
// The per-side pill: a swap may hide it, never add it (DD-A3d)
// ---------------------------------------------------------------------------

describe('the "each side" pill on a substitute', () => {
  function gobletSquat(): LadderPrescription {
    return {
      exerciseId: 'goblet-squat',
      sets: 3,
      mode: 'reps',
      restSeconds: 90,
      perSide: false,
      setPlan: [
        { weightKg: 14, reps: 12 },
        { weightKg: 16, reps: 10 },
        { weightKg: 18, reps: 8 },
      ],
      maxWeightKg: 38,
      weightStepKg: 2,
    }
  }

  it('is not added by a same-implement swap to a unilateral exercise (goblet squat -> split squat)', async () => {
    await start(gobletSquat())
    await screen.findByRole('heading', { name: 'Goblet squat' })
    expect(screen.queryByText(/each side/)).toBeNull()

    await swapTo(/Split squat/, 'Split squat')

    // Split squat is unilateral in the Library; the slot's reps were never counted per side.
    expect(screen.queryByText(/each side/)).toBeNull()
  })

  it('is kept when the slot claimed it and the substitute is unilateral too (lunge -> Bulgarian split squat)', async () => {
    const lunge: LadderPrescription = {
      ...gobletSquat(),
      exerciseId: 'reverse-lunge',
      perSide: true,
      // The Library lists no substitutes for the lunge; a program may.
      substitutionIds: ['bulgarian-split-squat'],
    }
    await start(lunge)
    await screen.findByRole('heading', { name: 'Dumbbell reverse lunge' })
    expect(screen.getByText(/each side/)).toBeInTheDocument()

    await swapTo(/Bulgarian split squat/, 'Bulgarian split squat')

    expect(screen.getByText(/each side/)).toBeInTheDocument()
  })
})

describe('the Rest screen introducing a swapped exercise', () => {
  // A swapped slot reaches the next-exercise card by this route: swap the second
  // exercise on its set screen, undo the first exercise's last set to step back
  // into it, and log it again. The card must not carry the slot's "each side"
  // onto an exercise that is not unilateral.
  it('does not put "each side" on an inverted row swapped into the dumbbell row\'s slot', async () => {
    const goblet: LadderPrescription = {
      exerciseId: 'goblet-squat',
      sets: 1,
      mode: 'reps',
      restSeconds: 60,
      perSide: false,
      setPlan: [{ weightKg: 14, reps: 12 }],
      maxWeightKg: 38,
      weightStepKg: 2,
    }
    await startTwo(goblet, dumbbellRow())
    await screen.findByRole('heading', { name: 'Goblet squat' })
    await logCurrentSet()

    // Unswapped, the next exercise really is per side.
    expect(await screen.findByText('Single-arm dumbbell row')).toBeInTheDocument()
    expect(screen.getByText(/each side/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Inverted row/, 'Inverted row')

    // Step back into the first exercise and finish it again.
    await userEvent.click(screen.getByRole('button', { name: /^Undo last set/ }))
    await screen.findByRole('heading', { name: 'Goblet squat' })
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    expect(await screen.findByText('Inverted row')).toBeInTheDocument()
    expect(screen.queryByText(/each side/)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// The step comes from the substitute's implement, not the slot
// ---------------------------------------------------------------------------

describe("the substitute's increment", () => {
  // Every Mesocycle 2 step is 2, so against the real program a correct step
  // source cannot be told from the slot's. This program's barbell steps in 2.5
  // while its dumbbell slot steps in 2.
  const SYNTHETIC: Program = {
    id: 'step-source-test',
    name: 'Step source',
    phase: 1,
    startDate: '2026-10-01',
    endDate: null,
    trainingWeekdays: [1],
    rotation: ['s'],
    sessions: [
      {
        id: 's',
        name: 'S',
        focus: 'F',
        items: [dumbbellRow(), { ...dumbbellRow(), exerciseId: 'bent-over-row', weightStepKg: 2.5 }],
      },
    ],
  }

  it("a barbell substitute steps in the program's barbell increment, not the dumbbell slot's", async () => {
    await programRepo.put(SYNTHETIC)
    try {
      await start(dumbbellRow(), SYNTHETIC.id)
      await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
      await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

      await typeWeight('41.75')
      await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
      expect(weightText()).toBe('44.25kg')
    } finally {
      await db.programs.delete(SYNTHETIC.id)
    }
  })
})

// ---------------------------------------------------------------------------
// French decimals in the caption and "Last time" (ride-along)
// ---------------------------------------------------------------------------

describe('decimal weights in French (T27)', () => {
  function gobletLadder(mode: 'reps' | 'seconds' = 'reps'): LadderPrescription {
    return {
      exerciseId: 'goblet-squat',
      sets: 4,
      mode,
      restSeconds: 90,
      perSide: false,
      setPlan: [17.75, 19.75, 21.75, 23.75].map((weightKg) => ({ weightKg, reps: 12 })),
      maxWeightKg: 38,
      weightStepKg: 2,
    }
  }

  it('the target caption and the "Last time" line write 17,75, not 17.75', async () => {
    await putHistory('goblet-squat', '2026-10-17', [17.75], gobletLadder())
    await i18n.changeLanguage('fr')
    await start(gobletLadder())
    await screen.findByRole('heading', { name: 'Goblet squat' })

    expect(screen.getByText('Palier 1 sur 4 · 17,75 kg × 12')).toBeInTheDocument()
    expect(screen.getByText(/12×17,75 kg/)).toBeInTheDocument()
    expect(screen.queryByText(/17\.75/)).toBeNull()
  })

  it('a weighted hold writes the weight the same way', async () => {
    const hold: LadderPrescription = {
      ...gobletLadder(),
      mode: 'seconds',
      setPlan: [17.75, 19.75].map((weightKg) => ({ weightKg, reps: 30 })),
      sets: 2,
    }
    await i18n.changeLanguage('fr')
    await start(hold)
    await screen.findByRole('heading', { name: 'Goblet squat' })

    expect(screen.getByText('Palier 1 sur 2 · 17,75 kg × 30 s')).toBeInTheDocument()
  })
})
