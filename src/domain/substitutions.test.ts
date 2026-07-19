import { describe, expect, it } from 'vitest'
import { effectiveSubstitutions } from './substitutions'
import type { Exercise } from './types'

const barbellSquat: Exercise = {
  id: 'barbell-squat',
  name: 'Barbell back squat',
  muscles: ['quads'],
  equipment: ['barbell', 'machine'],
  cues: [],
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
