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
import type { LadderPrescription, Program, SubstituteLoad, Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * Substitution start, through the real Workout Mode: swap in the real sheet,
 * read what the Set and Rest screens offer, log, and read what was stored.
 * Track A Phase 2.3 (coach Q4) with A2b ('inverted-row' in the single-arm row's
 * list, which must never ship without this: on its own it measured a dumbbell
 * row's 10 kg stored on a bodyweight row); then the **stopgap** of the owner's
 * ruling of 29 Oct 16:53 ("every swap starts with a blank weight until the
 * coach's set-by-set rule is built"); now that rule, Phase 2b.1.
 *
 * What a loaded substitute gets: for each set, the weight at that position of
 * its own most recent eligible exposure (same program, completed, a normal day,
 * not a pre-fix substitute record: coach CQ1-CQ4, CC1-CC3) and "—" where there
 * is none. Never the slot's rung, never a neighbouring rung, never the weight
 * just lifted (CC3): set 3 stays blank after sets 1 and 2 were lifted when the
 * history has two rungs. A "+" or "−" on a blank starts from the weight last
 * logged this session (OD-e) — a convenience, not a suggestion. Its own
 * implement's step, never the slot's; no ceiling warning; reps, sets and rest
 * from the slot. The slot records the exposure the suggestion came from
 * (`basis`) and no longer any single start weight. A bodyweight substitute gets
 * no weight control at all. The one swap with no substitute load is the swap
 * back to the authored exercise, which gets the slot's own loads again.
 *
 * Negative controls, Phase 2b.1, run 29 Oct: each mutation applied to the
 * source, the five files run together (`substituteLoad.test`,
 * `nextSetTarget.test`, `workout.test`, this file, `WorkoutPage.swapOther.test`:
 * 224 tests), source restored byte-for-byte. Each was traced through the code
 * as it is after the change and run against the finished tree. Only what the
 * screen sees is listed here; the controls on `historyEligibility.ts` and
 * `suggestedWeightsFor` are in `substituteLoad.test.ts`, and those on
 * `nextSetTarget.ts` in `nextSetTarget.test.ts`. Counts are the screen's own.
 * "OD-e x4" is the four press tests below ("+", "−", the most recent set, a
 * blank set); "increment x2" is "the substitute's increment ...".
 *   E1: the session's last weight offered before the suggestion (`carried ??`)
 *                                      -> T20b, T21, E2, E2b, OD-e x4 (8 red)
 *   E1: the last set's weight for every position
 *                                      -> T21, basis, E2, E3 + E13, E5, T26, T24
 *                                         (7 red)
 *   E1: the wrong position (`[setIndex + 1]`)
 *                                      -> T21, E2, E3 + E13, E5, T26, T24 (6 red)
 *   E2b: the press pre-fills `value` instead of passing `startFrom`
 *                                      -> OD-e x4, T20b, E2, E2b (7 red)
 *   E3, E13: L1's easier-day clause dropped
 *                                      -> E3 + E13 (1 red)
 *   E13: "Last time" routed through L1 -> E3 + E13 only (1 red)
 *   E4: L3 dropped                     -> E4 and the OD-e "nothing eligible" test
 *                                         (2 red)
 *   E5: the `substituteLoad` clause of L4 dropped, or Reading A
 *                                      -> E5 (1 red each)
 *   E6: L4 dropped                     -> T25b (1 red)
 *   E7: the old `from === to` early return
 *                                      -> T24, E7, T25, increment (same
 *                                         implement) (4 red)
 *   E9: the swap-back check dropped    -> T26 (1 red)
 *   E10: the Stepper's `step` from the slot
 *                                      -> T23 and increment x2 (3 red)
 *   E15: a stored legacy `startWeightKg` honoured
 *                                      -> E15 (1 red)
 *   `basis` omitted                    -> the basis test (1 red)
 *   `programId` not threaded (`''` in `handleSwap`)
 *                                      -> T21, basis, E2, E3 + E13, E5, T26, T24
 *                                         (7 red)
 *   the delta guard removed            -> T20b (1 red)
 *   the substitute branch of `nextSetTarget` bypassed
 *                                      -> 21 red, and the 24 Oct end-to-end test
 *                                         in `WorkoutPage.swapOther.test`: T19b
 *                                         among them, and NOT T19
 *   the suggestion replaced by the slot's rung
 *                                      -> 20 red, and the 24 Oct end-to-end test
 *   `loaded` always `weightKg !== null`
 *                                      -> 18 red, and the 24 Oct end-to-end test
 *   SetScreen passes no substitute load to `nextSetTarget`
 *                                      -> 23 red, T19 among them ('10kg' offered
 *                                         on a bodyweight movement), and the 24
 *                                         Oct end-to-end test
 *
 * The 2.3 mechanism, re-run 30 Oct against the WHOLE suite (mutation applied, the
 * suite run, restored and `cmp`ed). The 29 Oct record ran this file and the domain
 * tests only, and so missed `WorkoutPage.swapOther.test.tsx`, which most of these
 * redden (the 24 Oct end-to-end test); it is named below wherever it is red. "Stale
 * key" means `workoutExercise.exerciseId` removed from the Set screen's motion key in
 * WorkoutPage.tsx, so a swap does not remount it.
 *   stale key                          -> 14 red: remounts, T21, T22, T24, T25, T25b,
 *                                         T26, E2, E3 + E13, E4, E5, E7, the OD-e
 *                                         "nothing eligible" press, and (swapOther) the
 *                                         24 Oct end to end
 *   stale key AND the log guard
 *     `weightKg: target.loaded ? weightKg : null` reverted to `weightKg`
 *                                      -> 15 red: the above AND T19 (10 stored on
 *                                         the inverted row)
 *   the log guard alone                -> NOTHING: 1803/1803 green. With the key in
 *     place no stale weight can reach it, so it is defence in depth that only
 *     the pair above can see.
 *   the ceiling warning not gated on substitutes (`!isSubstitute` dropped from
 *     `showAboveCeiling`)              -> 5 red: ceiling T4, T20, T24, (swapBack) "a
 *                                         genuine substitute still shows none of the
 *                                         four", and (swapOther) the 24 Oct end to end
 *   `target.loaded` gate reverted to `weightKg !== null`
 *                                      -> 20 red: ceiling T4, the five OD-e presses,
 *                                         remounts, T20, T20b, T23, E2, E2b, E4, E7,
 *                                         E15, T25, T25b, both increment tests, and
 *                                         (swapOther) the 24 Oct end to end
 *   fr: raw number in the caption      -> both T27 tests
 *   fr: raw number in "Last time"      -> the first T27 test only
 *   swapExercise keeps the old substituteLoad (`withoutSwapState` no longer drops it)
 *                                      -> 6 red: T26, the `withoutSwapState` unit
 *                                         test, "a genuine return", workout.test's
 *                                         "clears the stored load", and (swapBack)
 *                                         "the ceiling returns" and "stored with no
 *                                         swap state"
 *   'inverted-row' removed from the single-arm row's list
 *                                      -> T19, T19b, the Rest screen per-side
 *                                         test, and the Library test (recorded 29
 *                                         Oct, NOT re-run: it mutates the Library seed)
 *
 * The first press on a blank weight (OD-e, owner 29 Oct 17:02)
 *   pre-fill `value` with the start instead of passing `startFrom`
 *                                      -> the display-is-blank assertion in the
 *                                         first "+" test, and the "−" test
 *                                         (re-run in 2b.1 as E2b: OD-e x4, T20b,
 *                                         E2 and E2b, 7 red)
 *   the `startFrom` prop removed       -> every press test (the press gives 0)
 *   the first logged set instead of the most recent (`findLast` -> `find`)
 *                                      -> "the most recent set, not the first"
 *                                         and the helper's unit test
 *   a blank set allowed to erase the last weight (`findLast(...)` -> `.at(-1)`)
 *                                      -> the blank-set test and a unit test
 *   the `target.weightKg !== null` condition dropped
 *                                      -> the helper's unit test only (on the
 *                                         screen `startFrom` is ignored once the
 *                                         value is not blank)
 *   the `!target.loaded` condition dropped
 *                                      -> NOTHING (all green): an unloaded
 *                                         substitute has no weight control and
 *                                         logs no weight, so there is no weight
 *                                         to start from either way
 *   the `substitute === undefined` condition dropped
 *                                      -> NOTHING can see it. A loaded authored
 *                                         exercise never has a blank target (its
 *                                         `loaded` is `weightKg !== null`), so the
 *                                         weight condition already returns nothing.
 *                                         No control was invented: the condition
 *                                         states the owner's scope (substitutes
 *                                         only) rather than leave it to that
 *                                         coincidence. The authored test above
 *                                         pins the outcome, not the condition.
 *
 * The per-side pill — the rule is `showsPerSidePill`: the slot's claim, which a
 * swap may hide but never add (the first 2.3 build also added it; the
 * independent check found it)
 *   the old expression `substitutedForId === undefined ? prescription.perSide
 *     : exercise.isUnilateral` in SetScreen
 *                                      -> T23 and "goblet squat -> split squat"
 *   the same old rule inside the helper
 *                                      -> the helper's "does NOT add it" row, T23,
 *                                         and "goblet squat -> split squat"
 *   the slot's raw `prescription.perSide` in SetScreen (a swap never hides it)
 *                                      -> T19 only
 *   the helper never hiding (`return true`)
 *                                      -> the helper's "hides it" row, T19, and
 *                                         the Rest screen test
 *   the Rest screen reading the raw `prescription.perSide`
 *                                      -> "does not put 'each side' on an inverted
 *                                         row ..." (the Rest screen test) only
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
 * The control that reaches T19 itself is the one above: stop passing the
 * substitute load at all. Re-confirmed in 2b.1: bypassing the substitute branch
 * reddens T19b and not T19; passing no substitute load reddens T19.
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

/** Render Workout Mode for a workout that is already stored, as it is (a record from an older build, say). */
async function startWorkout(workout: Workout) {
  await db.workouts.put(workout)
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

/** Swap through the sheet's "Other exercises" — the way an exercise nobody recommends is reached. */
async function swapViaOther(option: RegExp, heading: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Swap exercise' }))
  const sheet = await screen.findByRole('dialog')
  await userEvent.click(within(sheet).getByRole('button', { name: 'Other exercises' }))
  await userEvent.click(within(sheet).getByRole('button', { name: option }))
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
interface HistoryOptions {
  /** As recorded under a swap: the exercise performed, and the one it replaced. */
  substitutedForId?: string
  /** Present on a swap logged under the exercise-specific rules (CC1, Reading B). */
  substituteLoad?: SubstituteLoad
  /** Default: the program the tests swap in (Mesocycle 2 Build). */
  programId?: string
  /** An easier day. */
  tier?: 'easier'
}

async function putHistory(
  exerciseId: string,
  date: string,
  weights: number[],
  item: LadderPrescription,
  options: HistoryOptions = {},
) {
  let workout: Workout = createWorkout({
    id: `hist-${exerciseId}-${date}`,
    programId: options.programId ?? mesocycle2Build.id,
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
  if (options.substitutedForId !== undefined || options.substituteLoad !== undefined) {
    workout = {
      ...workout,
      exercises: workout.exercises.map((e) => ({
        ...e,
        ...(options.substitutedForId !== undefined ? { substitutedForId: options.substitutedForId } : {}),
        ...(options.substituteLoad !== undefined ? { substituteLoad: options.substituteLoad } : {}),
      })),
    }
  }
  if (options.tier !== undefined) workout = { ...workout, readiness: { tier: options.tier, drivers: [] } }
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

// ---------------------------------------------------------------------------
// A press on a blank weight starts from the weight last logged (owner 29 Oct 17:02)
// ---------------------------------------------------------------------------

/** Log the set on screen, skip the rest, and wait for the next set's screen. */
async function logAndSkipRest(nextSet: string) {
  await logCurrentSet()
  await userEvent.click(await screen.findByRole('button', { name: 'Skip' }))
  await screen.findByText(nextSet)
}

describe('a "+" or "−" on a blank weight of a substitute (OD-e)', () => {
  async function swappedAndLogged(weights: string[]) {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')
    for (const [index, weight] of weights.entries()) {
      if (weight !== '') await typeWeight(weight)
      await logAndSkipRest(`Set ${index + 2} of 3`)
    }
  }

  it('"+" gives the weight last logged — exactly — and the display stays blank until the press; the next "+" steps in the substitute\'s own step', async () => {
    await swappedAndLogged(['41.75'])

    // Blank, no weight in the caption: nothing is pre-filled or recommended.
    expect(weightText()).toBe('—')
    expect(screen.getByText('Rung 2 of 3 · 10 reps')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    // Not 41.75 + a step, and not 0.
    expect(weightText()).toBe('41.75kg')

    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('43.75kg')
  })

  it('"−" gives the same weight, not a step below it', async () => {
    await swappedAndLogged(['41.75'])
    expect(weightText()).toBe('—')

    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(weightText()).toBe('41.75kg')

    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(weightText()).toBe('39.75kg')
  })

  it('the most recent set, not the first: 40 then 42, and set 3 starts from 42', async () => {
    await swappedAndLogged(['40', '42'])

    expect(weightText()).toBe('—')
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('42kg')
  })

  it('a set logged blank does not erase the last weight: 41.75, then nothing, then set 3 starts from 41.75', async () => {
    await swappedAndLogged(['41.75', ''])

    expect(weightText()).toBe('—')
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('41.75kg')
  })

  it('with nothing eligible to suggest, the press right after the swap gives 0, as before — no pre-swap weight, no rung, no ineligible history', async () => {
    // Phase 1 history for the bent-over row (another program: not eligible) and the slot's rung of 10: neither is used.
    await putHistory('bent-over-row', '2026-10-17', [17.75, 21.75, 25.75, 29.75], dumbbellRow(), {
      programId: 'phase-1-home',
    })
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    expect(weightText()).toBe('—')
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('0kg')
  })

  it('an authored exercise is unchanged: it offers its own rung and steps from it', async () => {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    expect(weightText()).toBe('10kg')
    await logAndSkipRest('Set 2 of 3')

    // Set 2 is its own rung (12), not the weight just logged (10), and a press steps from it.
    expect(weightText()).toBe('12kg')
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('14kg')
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

  it('T20: with no history it offers no weight, lets the athlete type one, and steps in the barbell increment', async () => {
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
  })

  it('T20b (CC3): after set 1 the next set is blank too — the weight just lifted is not offered, on the Rest screen or the Set screen', async () => {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')
    await typeWeight('41.75')
    await logCurrentSet()

    // Rest screen: the next set's reps only — no weight, and no "lighter than 41.75".
    expect(await screen.findByText('10 reps')).toBeInTheDocument()
    expect(screen.queryByText(/\bkg\b/)).toBeNull()
    expect(screen.queryByText(/heavier|lighter/)).toBeNull()

    // Set screen: "—", for the athlete to choose.
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await screen.findByRole('heading', { name: 'Barbell bent-over row' })
    expect(weightText()).toBe('—')
    expect(weightText()).not.toBe('41.75kg')
  })

  it("T21 (E1): with history each set starts from its own position of the last eligible exposure, and a different lift does not move the next one", async () => {
    await putHistory('bent-over-row', '2026-10-17', [17.75, 21.75, 25.75, 29.75], dumbbellRow())
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    // Set 1 is the first position, not the last weight (29.75) and not the slot's rung (10).
    expect(weightText()).toBe('17.75kg')
    // "Last time" shows the same exposure as a fact.
    expect(screen.getByText(/12×17\.75 kg/)).toBeInTheDocument()
    expect(screen.getByText('Rung 1 of 3 · 12 reps')).toBeInTheDocument()

    // Log 19.75 instead: set 2 still offers ITS position (21.75), on the Rest screen and the Set screen.
    await typeWeight('19.75')
    await logCurrentSet()
    expect(await screen.findByText('21.75 kg × 10')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await screen.findByText('Set 2 of 3')
    expect(weightText()).toBe('21.75kg')
  })

  it('the exposure a suggestion came from is recorded on the slot (basis), and the retired single start weight is not written', async () => {
    await putHistory('bent-over-row', '2026-10-17', [17.75, 21.75], dumbbellRow())
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    const stored = (await db.workouts.get('sub'))!.exercises[0]
    expect(stored.substituteLoad).toEqual({
      loaded: true,
      startWeightsKg: [17.75, 21.75],
      stepKg: 2,
      basis: { workoutId: 'hist-bent-over-row-2026-10-17', date: '2026-10-17' },
    })
    expect(stored.substituteLoad).not.toHaveProperty('startWeightKg')
  })

  it('E2 (CC3): history has 2 rungs and the slot has 3 — set 3 is blank even after sets 1 and 2, on the Set screen and the Rest screen before it', async () => {
    await putHistory('bent-over-row', '2026-10-17', [17.75, 21.75], dumbbellRow())
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')
    expect(weightText()).toBe('17.75kg')

    await logAndSkipRest('Set 2 of 3')
    expect(weightText()).toBe('21.75kg')

    await logCurrentSet()
    // Rest before set 3: the slot's reps only — not "21.75 kg × 8", not a delta.
    expect(await screen.findByText('8 reps')).toBeInTheDocument()
    expect(screen.queryByText(/\bkg\b/)).toBeNull()
    expect(screen.queryByText(/heavier|lighter/)).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await screen.findByText('Set 3 of 3')
    expect(weightText()).toBe('—')
  })

  it("E2b: at that blank position a deliberate press starts from the weight last logged this session (OD-e), and the display is blank until it", async () => {
    await putHistory('bent-over-row', '2026-10-17', [17.75, 21.75], dumbbellRow())
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    await logAndSkipRest('Set 2 of 3')
    await typeWeight('23.75')
    await logAndSkipRest('Set 3 of 3')

    expect(weightText()).toBe('—')
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    // The set just logged (23.75), not the history's 21.75 for that position.
    expect(weightText()).toBe('23.75kg')
  })

  it('E3 + E13: an easier-day exposure is skipped for the suggestion, but "Last time" still shows it as the actual most recent performance', async () => {
    await putHistory('bent-over-row', '2026-10-10', [17.75, 21.75, 25.75], dumbbellRow())
    await putHistory('bent-over-row', '2026-10-17', [9.75, 11.75], dumbbellRow(), { tier: 'easier' })
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    // The suggestion walks back to the last normal day ...
    expect(weightText()).toBe('17.75kg')
    // ... and "Last time" names the newest actual performance, the easier day.
    expect(screen.getByText(/12×9\.75 kg/)).toBeInTheDocument()
    expect(screen.queryByText(/12×17\.75 kg/)).toBeNull()
  })

  it('E4 (CC2): history from another program (Phase 1) is not used for the suggestion, though "Last time" still shows it', async () => {
    await putHistory('bent-over-row', '2026-10-17', [8, 10, 12], dumbbellRow(), { programId: 'phase-1-home' })
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    expect(weightText()).toBe('—')
    expect(screen.getByText(/12×8 kg/)).toBeInTheDocument()
  })

  it('E5: a substitute log made under the new rules (it carries a substituteLoad) builds the substitute its own history', async () => {
    await putHistory('bench-press', '2026-11-03', [27.75, 29.75], dumbbellBench(), {
      substitutedForId: 'dumbbell-bench-press',
      substituteLoad: { loaded: true, startWeightsKg: [], stepKg: 2 },
    })
    await start(dumbbellBench())
    await screen.findByRole('heading', { name: 'Dumbbell bench press' })

    await swapViaOther(/Barbell bench press/, 'Barbell bench press')

    expect(weightText()).toBe('27.75kg')
  })

  it('E15: a record stored before the suggestion existed (the retired startWeightKg) offers nothing', async () => {
    const slot = createWorkout({
      id: 'sub',
      programId: mesocycle2Build.id,
      session: { id: 's', name: 'S', focus: 'F', items: [dumbbellRow()] },
      date: '2026-10-24',
      startedAt: '2026-10-24T09:00:00.000Z',
    })
    const legacy = { loaded: true, startWeightKg: 29.75, stepKg: 2 } as unknown as SubstituteLoad
    await startWorkout({
      ...slot,
      exercises: slot.exercises.map((e) => ({
        ...e,
        exerciseId: 'bent-over-row',
        substitutedForId: 'single-arm-db-row',
        substituteLoad: legacy,
      })),
    })
    await screen.findByRole('heading', { name: 'Barbell bent-over row' })

    expect(weightText()).toBe('—')
  })

  it('T22: an untouched — is logged as no weight, not as zero and not as the old rung', async () => {
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')

    const stored = await logCurrentSet()
    expect(stored.sets[0].weightKg).toBeNull()
  })

  it('swapping back to the authored exercise gives the slot its own loads again (T26, E9), whatever the substitute had to suggest', async () => {
    await putHistory('bent-over-row', '2026-10-17', [17.75, 21.75, 25.75], dumbbellRow())
    await start(dumbbellRow())
    await screen.findByRole('heading', { name: 'Single-arm dumbbell row' })
    await swapTo(/Barbell bent-over row/, 'Barbell bent-over row')
    expect(weightText()).toBe('17.75kg')

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
  it("T24 (CQ4, E7): takes its OWN history, not the slot's rung — and no ceiling warning, whatever the weight", async () => {
    // The incline press's own last exposure: 14 / 16 / 18 / 20. The slot's rungs are 10 / 12 / 14 / 16.
    await putHistory('incline-dumbbell-press', '2026-10-17', [14, 16, 18, 20], dumbbellBench())
    await start(dumbbellBench())
    await screen.findByRole('heading', { name: 'Dumbbell bench press' })
    await swapTo(/Incline dumbbell press/, 'Incline dumbbell press')

    expect(weightText()).toBe('14kg')
    // The caption is not "told" the slot's kg figure.
    expect(screen.getByText('Rung 1 of 4 · 10 reps')).toBeInTheDocument()
    expect(screen.getByText(/12×14 kg/)).toBeInTheDocument()

    // No ceiling warning on a substitute, even at a weight above the slot's 20.
    await typeWeight('22')
    expect(weightText()).toBe('22kg')
    expect(screen.queryByText(/equipment limit/)).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(weightText()).toBe('24kg')

    const stored = await logCurrentSet()
    expect(stored.exerciseId).toBe('incline-dumbbell-press')
    expect(stored.sets[0].weightKg).toBe(24)
  })

  it("E7: with no history of its own it starts blank — the slot's rung is not inherited because both use dumbbells", async () => {
    await start(dumbbellBench())
    await screen.findByRole('heading', { name: 'Dumbbell bench press' })
    expect(weightText()).toBe('10kg')

    await swapTo(/Incline dumbbell press/, 'Incline dumbbell press')

    expect(weightText()).toBe('—')
  })
})

describe('a different movement on the same implement (Dumbbell bench -> Other exercises -> Lateral raise)', () => {
  it("T25 (I3): starts blank — a bench's 10 kg per hand is not a lateral raise's weight", async () => {
    await start(dumbbellBench())
    await screen.findByRole('heading', { name: 'Dumbbell bench press' })
    expect(weightText()).toBe('10kg')

    await swapViaOther(/Dumbbell lateral raise/, 'Dumbbell lateral raise')

    expect(weightText()).toBe('—')
    expect(weightText()).not.toBe('10kg')
    expect(screen.getByText('Rung 1 of 4 · 10 reps')).toBeInTheDocument()
  })
})

describe('the barbell bench press reached through Other, after the 24 Oct entries', () => {
  it('T25b (I2): starts blank even with 20 kg x 4 logged under the swap in history', async () => {
    // What 24 Oct left behind: exerciseId 'bench-press', substitutedForId the dumbbell bench, clamped at 20.
    await putHistory('bench-press', '2026-10-24', [20, 20, 20, 20], dumbbellBench(), {
      substitutedForId: 'dumbbell-bench-press',
    })
    await start(dumbbellBench())
    await screen.findByRole('heading', { name: 'Dumbbell bench press' })

    await swapViaOther(/Barbell bench press/, 'Barbell bench press')

    expect(weightText()).toBe('—')
    expect(weightText()).not.toBe('20kg')
    // The history itself is still shown as a fact.
    expect(screen.getByText(/12×20 kg/)).toBeInTheDocument()
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

  // The same-implement case: the slot (dumbbell bench) steps in 2, the incline press this program prescribes steps in 1.
  const SAME_IMPLEMENT: Program = {
    ...SYNTHETIC,
    id: 'step-source-same-implement',
    sessions: [
      {
        id: 's',
        name: 'S',
        focus: 'F',
        items: [dumbbellBench(), { ...dumbbellBench(), exerciseId: 'incline-dumbbell-press', weightStepKg: 1 }],
      },
    ],
  }

  it("a same-implement substitute steps in its own prescription's increment, not the slot's", async () => {
    await programRepo.put(SAME_IMPLEMENT)
    try {
      await start(dumbbellBench(), SAME_IMPLEMENT.id)
      await screen.findByRole('heading', { name: 'Dumbbell bench press' })
      await swapTo(/Incline dumbbell press/, 'Incline dumbbell press')

      await typeWeight('20')
      await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
      expect(weightText()).toBe('21kg')
    } finally {
      await db.programs.delete(SAME_IMPLEMENT.id)
    }
  })

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
