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

  it('rejects a missing required field, naming the field via the schema-error descriptor', () => {
    const bad = validProgram()
    delete (bad as Record<string, unknown>).startDate
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.key).toBe('plan:import.schemaErrorWithPath')
      expect(result.error.params?.path).toBe('startDate')
    }
  })

  it('rejects a malformed date', () => {
    const result = validateProgramImport(validProgram({ startDate: '10 Aug 2026' }), libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.params?.path).toBe('startDate')
  })

  it('rejects endDate before startDate', () => {
    const result = validateProgramImport(
      validProgram({ startDate: '2026-08-10', endDate: '2026-08-01' }),
      libraryIds,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.params?.path).toBe('endDate')
  })

  it('rejects an unknown exercise id and names it', () => {
    const bad = validProgram()
    ;(bad.sessions as Array<{ items: Array<{ exerciseId: string }> }>)[0].items[0].exerciseId =
      'barbell-squat'
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({
        key: 'plan:import.exerciseNotInLibrary',
        params: { exerciseId: 'barbell-squat', sessionId: 'A' },
      })
    }
  })

  it('rejects a rotation entry with no matching session', () => {
    const result = validateProgramImport(validProgram({ rotation: ['A', 'C'] }), libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.key).toBe('plan:import.unknownRotationSession')
      expect(result.error.params?.rotationId).toBe('C')
    }
  })

  it('rejects duplicate session ids', () => {
    const bad = validProgram()
    ;(bad.sessions as Array<{ id: string }>)[1].id = 'A'
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.key).toBe('plan:import.duplicateSessionId')
      expect(result.error.params?.sessionId).toBe('A')
    }
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
      expect(result.error).toEqual({
        key: 'plan:import.substitutionListsSelf',
        params: { exerciseId: 'goblet-squat', sessionId: 'A' },
      })
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
      expect(result.error).toEqual({
        key: 'plan:import.duplicateSubstitution',
        params: { exerciseId: 'goblet-squat', sessionId: 'A', substitutionId: 'split-squat' },
      })
    }
  })

  it('rejects a substitution id that does not exist in the Library, naming it', () => {
    const bad = validProgram()
    ;(bad.sessions[0].items[0] as Record<string, unknown>).substitutionIds = ['leg-press']
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({
        key: 'plan:import.substitutionNotInLibrary',
        params: { substitutionId: 'leg-press', exerciseId: 'goblet-squat', sessionId: 'A' },
      })
    }
  })

  it('accepts a well-formed weekdayActivities map', () => {
    const good = validProgram({
      weekdayActivities: {
        2: {
          kind: 'recovery',
          title: 'Recovery walk & stretch',
          items: [{ label: '20-minute easy walk — conversational pace' }],
        },
        7: {
          kind: 'checkpoint',
          title: 'Weekly checkpoint',
          items: [{ label: 'Weight and waist measurement', detail: 'Same time of day each week' }],
        },
      },
    })
    const result = validateProgramImport(good, libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.program.weekdayActivities?.[2]?.title).toBe('Recovery walk & stretch')
      expect(result.program.weekdayActivities?.[7]?.kind).toBe('checkpoint')
    }
  })

  it('imports unchanged when weekdayActivities is absent', () => {
    const result = validateProgramImport(validProgram(), libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.program.weekdayActivities).toBeUndefined()
  })

  it('rejects an activity kind outside the closed set', () => {
    const bad = validProgram({
      weekdayActivities: {
        2: { kind: 'yoga', title: 'Yoga', items: [{ label: '20 minutes' }] },
      },
    })
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('rejects an activity with an empty title', () => {
    const bad = validProgram({
      weekdayActivities: {
        2: { kind: 'recovery', title: '', items: [{ label: '20-minute walk' }] },
      },
    })
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('rejects an activity with no items', () => {
    const bad = validProgram({
      weekdayActivities: {
        2: { kind: 'recovery', title: 'Recovery walk', items: [] },
      },
    })
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('rejects an activity item with an empty label', () => {
    const bad = validProgram({
      weekdayActivities: {
        2: { kind: 'recovery', title: 'Recovery walk', items: [{ label: '' }] },
      },
    })
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('rejects a weekday key outside 1-7', () => {
    const bad = validProgram({
      weekdayActivities: {
        8: { kind: 'recovery', title: 'Recovery walk', items: [{ label: '20-minute walk' }] },
      },
    })
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('rejects an activity claiming a training weekday, naming it', () => {
    const bad = validProgram({
      weekdayActivities: {
        1: { kind: 'recovery', title: 'Recovery walk', items: [{ label: '20-minute walk' }] },
      },
    })
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({
        key: 'plan:import.weekdayIsTrainingDay',
        params: { weekdayKey: 'plan:import.weekdayName.1' },
      })
    }
  })
})
