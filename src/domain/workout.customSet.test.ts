import { describe, expect, it } from 'vitest'
import { seedProgram } from '@/data/seed/program'
import type { LoggedSet } from '@/domain/types'
import {
  addCustomSlot,
  createWorkout,
  logSet,
  skipPrescribedLevel,
  undoLastSet,
  workoutPosition,
} from './workout'

/**
 * `logSet` marks the sets that `Add Set` opened (QA F1, 30 Oct). `LoggedSet.custom` was
 * documented as written by Add Set, read by History's "(Custom)" and by the summary's
 * count, and written by nothing: `git grep` found no production line setting it. Every
 * test that exercised the readers built its sets by hand with the flag already on them, so
 * a suite that was green on both ends could not see the middle.
 *
 * The rule is one comparison, against the same boundary `plannedSetIndices` uses to place
 * custom slots (`prescription.sets + i`): a set at or past `prescription.sets` is a custom
 * set. It is added, never removed: a marker the caller passed is kept.
 *
 * Legs & Core's goblet squat is a 3-rung ladder (`prescription.sets === 3`).
 *
 * Negative controls, run 30 Oct (mutation applied to `logSet` in `workout.ts`, the whole
 * suite run, restored and `cmp`ed):
 *   the marker not written (the code as it was)
 *       -> 11 red: six here (both custom indices, the boundary, the other-exercise row, the
 *          two app-path rows), two in `customFlag.displayOnly.test.ts` (its fixture claims
 *          the marker is there) and three in `WorkoutPage.customSetMark.test.tsx`
 *   `>` for `>=` (the first custom slot, index 3, left unmarked)
 *       -> 9 red: the same families, minus index 4, which `>` still marks
 *   the marker written on every set
 *       -> 67 red in 8 files: three here (a prescribed level, the boundary, the app path),
 *          two in the display-only file, four in the screens test, and 58 in existing
 *          History and summary tests, which now see "(Custom)" on every set. That last
 *          number is the old direction of the same guard: those tests were already
 *          pinning "no marker on a plain set".
 *
 * What it cannot see: a caller that bypasses `logSet` (none exists; `WorkoutPage.handleLog`
 * is the only production caller), and a prescription whose `sets` disagrees with the
 * slots it was given (a stored workout is read as it was stored).
 */

const session = seedProgram.sessions[1]
const at = '2026-07-22T09:05:00.000Z'
const set = (weightKg: number): Omit<LoggedSet, 'setIndex'> => ({ weightKg, reps: 12, seconds: null, completedAt: at })

function fresh() {
  return createWorkout({
    id: 'w-custom',
    programId: seedProgram.id,
    session,
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
  })
}

describe('logSet marks a set in a custom slot', () => {
  it('leaves a prescribed level unmarked: no key at all, not false', () => {
    const w = logSet(fresh(), 0, set(10), 0)
    expect(w.exercises[0].sets[0]).toEqual({ ...set(10), setIndex: 0 })
    expect('custom' in w.exercises[0].sets[0]).toBe(false)
  })

  it.each([3, 4])('marks the set at index %i (prescription.sets is 3)', (index) => {
    const w = logSet(fresh(), 0, set(15), index)
    expect(w.exercises[0].prescription.sets).toBe(3)
    expect(w.exercises[0].sets[0]).toEqual({ ...set(15), setIndex: index, custom: true })
  })

  it('the boundary is exact: the last prescribed level is unmarked, the first custom slot is marked', () => {
    let w = fresh()
    w = logSet(w, 0, set(10), 2)
    w = logSet(w, 0, set(10), 3)
    expect(w.exercises[0].sets.map((s) => s.custom ?? false)).toEqual([false, true])
  })

  it('keeps a marker the caller passed, on a custom slot', () => {
    const w = logSet(fresh(), 0, { ...set(15), custom: true }, 3)
    expect(w.exercises[0].sets[0].custom).toBe(true)
  })

  it('does not touch the workout it was given', () => {
    const before = fresh()
    const snapshot = JSON.stringify(before)
    logSet(before, 0, set(15), 3)
    expect(JSON.stringify(before)).toBe(snapshot)
  })

  it('marks only the exercise it was asked about', () => {
    const w = logSet(fresh(), 1, set(15), 4)
    expect(w.exercises[0].sets).toEqual([])
    expect(w.exercises[1].sets[0].custom).toBe(true)
  })
})

describe('the path the app takes: Add Set, then log at the index workoutPosition offers', () => {
  it('marks exactly the two sets the two opened slots hold, after a skipped level', () => {
    let w = skipPrescribedLevel(fresh(), 0, 0)
    w = addCustomSlot(addCustomSlot(w, 0), 0)
    const logged: number[] = []
    for (;;) {
      const position = workoutPosition(w)
      if (position === 'complete' || position.exerciseIndex !== 0) break
      logged.push(position.setIndex)
      w = logSet(w, 0, set(12), position.setIndex)
    }
    // Level 0 was skipped, levels 1 and 2 are logged, and the two custom slots are 3 and 4.
    expect(logged).toEqual([1, 2, 3, 4])
    const marked = w.exercises[0].sets.filter((s) => s.custom).map((s) => s.setIndex)
    expect(marked).toEqual([3, 4])
  })

  it('an undone custom set is logged again with the marker', () => {
    let w = addCustomSlot(fresh(), 0)
    for (const index of [0, 1, 2, 3]) w = logSet(w, 0, set(12), index)
    expect(w.exercises[0].sets.at(-1)?.custom).toBe(true)
    w = undoLastSet(w).workout
    expect(w.exercises[0].sets).toHaveLength(3)
    w = logSet(w, 0, set(14), 3)
    expect(w.exercises[0].sets.at(-1)).toEqual({ ...set(14), setIndex: 3, custom: true })
  })
})
