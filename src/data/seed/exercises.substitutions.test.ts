import { describe, expect, it } from 'vitest'
import { seedExercises } from './exercises'
import { mesocycle2Build, seedProgram } from './program'

/**
 * Coach Q2 (29 Oct 2026): the barbell bench press is removed from routine
 * substitution recommendations, because the equipment has no rack, and stays
 * in the Library so it can still be recorded truthfully. It is reached through
 * the swap sheet's "Other exercises" (`WorkoutPage.swapOther.test.tsx`).
 *
 * Negative control, run 29 Oct: re-adding 'bench-press' to the
 * `db-floor-press` list turns "is recommended from no list" red, and the
 * failure names `db-floor-press`.
 */
describe('the barbell bench press and the recommended lists', () => {
  it('is an entry in the Library', () => {
    expect(seedExercises.map((exercise) => exercise.id)).toContain('bench-press')
  })

  it('is recommended from no list, Library or program', () => {
    const libraryOffenders = seedExercises
      .filter((exercise) => exercise.substitutionIds.includes('bench-press'))
      .map((exercise) => exercise.id)
    expect(libraryOffenders).toEqual([])

    const programOffenders = [seedProgram, mesocycle2Build].flatMap((program) =>
      program.sessions.flatMap((session) =>
        session.items
          .filter((item) => item.substitutionIds?.includes('bench-press'))
          .map((item) => `${program.id}:${item.exerciseId}`),
      ),
    )
    expect(programOffenders).toEqual([])
  })

  it('still lists its own alternatives when it is the exercise on screen', () => {
    const bench = seedExercises.find((exercise) => exercise.id === 'bench-press')
    expect(bench?.substitutionIds.length).toBeGreaterThan(0)
  })

  it('deficit push-up, whose only entry it was, has an empty list', () => {
    expect(seedExercises.find((exercise) => exercise.id === 'deficit-push-up')?.substitutionIds).toEqual([])
  })
})
