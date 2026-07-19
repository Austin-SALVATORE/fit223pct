import { describe, expect, it } from 'vitest'
import { validateProgramImport } from './programImport'

const libraryIds = new Set(['goblet-squat', 'bench-press', 'split-squat', 'bulgarian-split-squat'])

function validProgram(overrides: Record<string, unknown> = {}) {
  return {
    id: 'phase-2-gym',
    name: 'Phase 2 — Gym',
    phase: 2,
    startDate: '2026-08-10',
    endDate: null,
    trainingWeekdays: [1, 3, 5],
    rotation: ['A', 'B'],
    sessions: [
      {
        id: 'A',
        name: 'Session A',
        focus: 'Squat & pull',
        items: [
          {
            exerciseId: 'goblet-squat',
            sets: 3,
            mode: 'reps',
            range: { min: 8, max: 12 },
            targetRir: 2,
            restSeconds: 120,
            perSide: false,
            startWeightKg: 14,
            maxWeightKg: 20,
            weightStepKg: 2,
          },
        ],
      },
      {
        id: 'B',
        name: 'Session B',
        focus: 'Hinge & press',
        items: [
          {
            exerciseId: 'bench-press',
            sets: 3,
            mode: 'reps',
            range: { min: 8, max: 12 },
            targetRir: 2,
            restSeconds: 120,
            perSide: false,
            startWeightKg: 25,
            maxWeightKg: 30,
            weightStepKg: 2.5,
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('validateProgramImport', () => {
  it('accepts a well-formed program', () => {
    const result = validateProgramImport(validProgram(), libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.program.id).toBe('phase-2-gym')
      expect(result.program.sessions).toHaveLength(2)
    }
  })

  it('rejects a missing required field with a human sentence', () => {
    const bad = validProgram()
    delete (bad as Record<string, unknown>).startDate
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/startDate/)
      expect(result.error).not.toMatch(/at \[object|ZodError|issues/i)
    }
  })

  it('rejects a malformed date', () => {
    const result = validateProgramImport(validProgram({ startDate: '10 Aug 2026' }), libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/startDate/)
  })

  it('rejects endDate before startDate', () => {
    const result = validateProgramImport(
      validProgram({ startDate: '2026-08-10', endDate: '2026-08-01' }),
      libraryIds,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/endDate/)
  })

  it('rejects an unknown exercise id and names it', () => {
    const bad = validProgram()
    ;(bad.sessions as Array<{ items: Array<{ exerciseId: string }> }>)[0].items[0].exerciseId =
      'barbell-squat'
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe(
      'Exercise id "barbell-squat" in session "A" doesn\'t exist in the Library.',
    )
  })

  it('rejects a rotation entry with no matching session', () => {
    const result = validateProgramImport(validProgram({ rotation: ['A', 'C'] }), libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/"C"/)
  })

  it('rejects duplicate session ids', () => {
    const bad = validProgram()
    ;(bad.sessions as Array<{ id: string }>)[1].id = 'A'
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/"A"/)
  })

  it('rejects a whole file on one bad exercise — no partial import', () => {
    const bad = validProgram()
    ;(bad.sessions as Array<{ items: Array<{ exerciseId: string }> }>)[1].items[0].exerciseId =
      'unknown-machine-row'
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('accepts a well-formed program-defined substitutionIds field', () => {
    const good = validProgram()
    ;(good.sessions[0].items[0] as Record<string, unknown>).substitutionIds = ['split-squat']
    const result = validateProgramImport(good, libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.program.sessions[0].items[0].substitutionIds).toEqual(['split-squat'])
    }
  })

  it('imports unchanged when substitutionIds is absent', () => {
    const result = validateProgramImport(validProgram(), libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.program.sessions[0].items[0].substitutionIds).toBeUndefined()
    }
  })

  it('rejects a substitution id that names the prescription\'s own exerciseId', () => {
    const bad = validProgram()
    ;(bad.sessions[0].items[0] as Record<string, unknown>).substitutionIds = ['goblet-squat']
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(
        'Exercise "goblet-squat" in session "A" lists itself as a substitution.',
      )
    }
  })

  it('rejects a duplicate substitution id', () => {
    const bad = validProgram()
    ;(bad.sessions[0].items[0] as Record<string, unknown>).substitutionIds = [
      'split-squat',
      'split-squat',
    ]
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(
        'Exercise "goblet-squat" in session "A" lists substitution "split-squat" twice.',
      )
    }
  })

  it('rejects a substitution id that does not exist in the Library, naming it', () => {
    const bad = validProgram()
    ;(bad.sessions[0].items[0] as Record<string, unknown>).substitutionIds = ['leg-press']
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(
        'Substitution "leg-press" for exercise "goblet-squat" in session "A" doesn\'t exist in the Library.',
      )
    }
  })
})
