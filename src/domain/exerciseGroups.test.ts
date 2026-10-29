import { describe, expect, it } from 'vitest'
import { seedExercises } from '@/data/seed/exercises'
import enLibrary from '@/locales/en/library.json'
import frLibrary from '@/locales/fr/library.json'
import zhLibrary from '@/locales/zh-CN/library.json'
import { EXERCISE_GROUPS, exerciseGroupOf, otherExercisesFor } from './exerciseGroups'
import type { Exercise } from './types'

/**
 * The Library's grouping, and the swap sheet's "Other exercises" built on it
 * (Track A Phase 2.5; coach Q2, owner 29 Oct: the barbell bench press leaves
 * every recommended list but stays recordable).
 *
 * Negative controls, run 29 Oct (mutation applied, this file and
 * `WorkoutPage.swapOther.test.tsx` run, restored):
 *   `otherExercisesFor` returns another group's exercises (`=== group` becomes
 *     `!== group`)           -> "lists the current group only", "reaches the
 *                               barbell bench press ...", "an exercise with no
 *                               recommendations still gets its whole group", and
 *                               seven sheet tests
 *   it returns nothing      -> the same three, and eleven sheet tests
 *   it drops barbell exercises (an equipment-suitability filter)
 *                           -> "reaches the barbell bench press ..." and "an
 *                               exercise with no recommendations ...", plus the
 *                               sheet's
 *   the current exercise not excluded / the recommended ones not excluded
 *                           -> "never lists the current exercise or a
 *                               recommended one" (and the sheet's)
 *   chest moved out of the push group
 *                           -> "every Library exercise belongs to a group", "an
 *                               exercise is grouped by its primary muscle", and
 *                               the three reachability tests
 */

const exerciseById = new Map(seedExercises.map((exercise) => [exercise.id, exercise]))
const exercise = (id: string): Exercise => {
  const found = exerciseById.get(id)
  if (!found) throw new Error(`no Library exercise ${id}`)
  return found
}

describe('EXERCISE_GROUPS', () => {
  it('every Library exercise belongs to a group, so none is unreachable from "Other exercises"', () => {
    const ungrouped = seedExercises.filter((e) => exerciseGroupOf(e) === null).map((e) => e.id)
    expect(ungrouped).toEqual([])
  })

  it('a muscle sits in exactly one group', () => {
    const muscles = EXERCISE_GROUPS.flatMap((group) => group.muscles)
    expect(new Set(muscles).size).toBe(muscles.length)
  })

  it.each([
    ['en', enLibrary],
    ['fr', frLibrary],
    ['zh-CN', zhLibrary],
  ])('every group has a %s heading on the Library page', (_locale, library) => {
    for (const group of EXERCISE_GROUPS) {
      expect((library.group as Record<string, string>)[group.key], group.key).toBeTruthy()
    }
  })

  it('an exercise is grouped by its primary muscle, not a secondary one', () => {
    // deficit-push-up: chest first, core last — push, not core.
    expect(exerciseGroupOf(exercise('deficit-push-up'))).toBe('push')
    expect(exerciseGroupOf(exercise('goblet-squat'))).toBe('lower')
    expect(exerciseGroupOf(exercise('single-arm-db-row'))).toBe('pull')
    expect(exerciseGroupOf(exercise('plank'))).toBe('core')
  })
})

describe('otherExercisesFor', () => {
  const library = seedExercises
  const dbBench = exercise('dumbbell-bench-press')
  const recommended = ['db-floor-press', 'incline-dumbbell-press']

  it('lists the current group only', () => {
    const others = otherExercisesFor(dbBench, library, recommended)
    expect(others.length).toBeGreaterThan(0)
    expect(others.every((other) => exerciseGroupOf(other) === 'push')).toBe(true)
    // ...and not another group's.
    const ids = others.map((other) => other.id)
    for (const elsewhere of ['goblet-squat', 'single-arm-db-row', 'plank']) {
      expect(ids).not.toContain(elsewhere)
    }
  })

  it('never lists the current exercise or a recommended one', () => {
    const ids = otherExercisesFor(dbBench, library, recommended).map((other) => other.id)
    expect(ids).not.toContain('dumbbell-bench-press')
    expect(ids).not.toContain('db-floor-press')
    expect(ids).not.toContain('incline-dumbbell-press')
  })

  it('reaches the barbell bench press from the dumbbell bench press', () => {
    const ids = otherExercisesFor(dbBench, library, recommended).map((other) => other.id)
    expect(ids).toContain('bench-press')
  })

  it('keeps Library order, and does not mutate or alias its input', () => {
    const before = library.map((other) => other.id)
    const others = otherExercisesFor(dbBench, library, recommended)
    const order = library.filter((other) => others.includes(other)).map((other) => other.id)
    expect(others.map((other) => other.id)).toEqual(order)
    expect(library.map((other) => other.id)).toEqual(before)
    expect(others).not.toBe(library)
  })

  it('has nothing to offer for an exercise whose primary muscle is in no group', () => {
    const orphan = { id: 'x', muscles: ['neck' as never] }
    expect(otherExercisesFor(orphan, library, [])).toEqual([])
  })

  it('an exercise with no recommendations still gets its whole group (deficit push-up)', () => {
    const ids = otherExercisesFor(exercise('deficit-push-up'), library, []).map((other) => other.id)
    expect(ids).toContain('bench-press')
    expect(ids).toContain('dumbbell-bench-press')
  })
})
