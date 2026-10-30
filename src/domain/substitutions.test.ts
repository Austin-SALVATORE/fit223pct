import { describe, expect, it } from 'vitest'
import { effectiveSubstitutions, showsPerSidePill } from './substitutions'
import type { Exercise, LadderPrescription, WorkoutExercise } from './types'

const barbellSquat: Exercise = {
  id: 'barbell-squat',
  muscles: ['quads'],
  equipment: ['barbell', 'machine'],
  substitutionIds: ['goblet-squat'],
  isUnilateral: false,
}

describe('effectiveSubstitutions', () => {
  it('orders program-defined fallbacks before the Library generics', () => {
    const result = effectiveSubstitutions(
      { substitutionIds: ['bulgarian-split-squat'] },
      barbellSquat,
    )
    expect(result).toEqual(['bulgarian-split-squat', 'goblet-squat'])
  })

  it('dedupes an id that appears in both lists, keeping the program-defined position', () => {
    const result = effectiveSubstitutions({ substitutionIds: ['goblet-squat'] }, barbellSquat)
    expect(result).toEqual(['goblet-squat'])
  })

  it('never includes the exercise itself, even if mistakenly listed', () => {
    const result = effectiveSubstitutions(
      { substitutionIds: ['barbell-squat', 'bulgarian-split-squat'] },
      barbellSquat,
    )
    expect(result).toEqual(['bulgarian-split-squat', 'goblet-squat'])
  })

  it('falls back to Library-only when the prescription field is absent', () => {
    expect(effectiveSubstitutions(undefined, barbellSquat)).toEqual(['goblet-squat'])
    expect(effectiveSubstitutions({ substitutionIds: undefined }, barbellSquat)).toEqual([
      'goblet-squat',
    ])
  })

  it('falls back to Library-only when the prescription declares none', () => {
    expect(effectiveSubstitutions({ substitutionIds: [] }, barbellSquat)).toEqual(['goblet-squat'])
  })

  it('returns an empty list when neither source has anything to offer', () => {
    const noSubs: Exercise = { ...barbellSquat, id: 'x', substitutionIds: [] }
    expect(effectiveSubstitutions(undefined, noSubs)).toEqual([])
  })
})

/**
 * The per-side pill follows the slot's claim, and a swap may hide it but never
 * add it (Phase 2 plan, DD-A3d; the independent check of 34bec42 found the first
 * 2.3 build also *added* it on a unilateral substitute of a bilateral slot).
 *
 * Negative control: the old rule, `substitutedForId === undefined ?
 * prescription.perSide : exercise.isUnilateral`, in place of the helper's two
 * lines. Run 30 Oct against the whole suite it is four red, not the "two rows
 * plus the Rest screen test" this comment recorded on 29 Oct: ONE row here ("a
 * bilateral slot swapped to a unilateral exercise does NOT add it"); on the
 * screens T23 (inverted row -> dumbbell row) and "not added by a same-implement
 * swap to a unilateral exercise" (goblet squat -> split squat) in
 * `SetScreen.substitute.test.tsx`; and, since 2b.3, "a record stored before CC4
 * as 'substituted for itself': the pill shows" in `SetScreen.swapBack.test.tsx`
 * (the old rule reads that stored shape as a substitute). The Rest screen test is
 * not red under this mutation. The rule that decides the pill is now
 * `!isSubstitute(workoutExercise) || exercise.isUnilateral`.
 */
describe('showsPerSidePill', () => {
  const slot = (perSide: boolean): Pick<WorkoutExercise, 'exerciseId' | 'prescription' | 'substitutedForId'> => ({
    exerciseId: 'authored',
    prescription: { perSide } as LadderPrescription,
  })
  const swapped = (perSide: boolean): Pick<WorkoutExercise, 'exerciseId' | 'prescription' | 'substitutedForId'> => ({
    exerciseId: 'substitute',
    prescription: { perSide } as LadderPrescription,
    substitutedForId: 'authored',
  })
  const unilateral = { isUnilateral: true }
  const bilateral = { isUnilateral: false }

  it.each([
    ['a per-side slot, not swapped', slot(true), bilateral, true],
    ['a bilateral slot, not swapped', slot(false), unilateral, false],
    ['a per-side slot swapped to a unilateral exercise keeps the claim', swapped(true), unilateral, true],
    ['a per-side slot swapped to a bilateral exercise hides it', swapped(true), bilateral, false],
    ['a bilateral slot swapped to a unilateral exercise does NOT add it', swapped(false), unilateral, false],
    ['a bilateral slot swapped to a bilateral exercise has none', swapped(false), bilateral, false],
  ] as const)('%s', (_name, workoutExercise, exercise, expected) => {
    expect(showsPerSidePill(workoutExercise, exercise)).toBe(expected)
  })
})

