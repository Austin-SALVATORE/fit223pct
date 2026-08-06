import { describe, expect, it } from 'vitest'
import { validateProgramImport } from './programImport'
import enPlanJson from '@/locales/en/plan.json'

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

  it('always sets origin to "imported", regardless of id or claimed origin in the input', () => {
    // Reusing the seed's own id is exactly the scenario that shadowed
    // authored content before origin existed — id can never be trusted
    // to distinguish "seed" from "imported".
    const reusingSeedId = validateProgramImport(
      validProgram({ id: 'phase-1-home' }),
      libraryIds,
    )
    expect(reusingSeedId.ok).toBe(true)
    if (reusingSeedId.ok) expect(reusingSeedId.program.origin).toBe('imported')

    // origin isn't part of the import schema — an input file can't claim
    // to be seed content, whatever value it sets.
    const claimsSeed = validateProgramImport(validProgram({ origin: 'seed' }), libraryIds)
    expect(claimsSeed.ok).toBe(true)
    if (claimsSeed.ok) expect(claimsSeed.program.origin).toBe('imported')
  })

  it('accepts a legacy export carrying a pre-purge targetRir key and silently drops it', () => {
    // RIR is purged from the schema (M8 Phase 6) — an old backup exported
    // before the purge must stay importable forever, per
    // docs/PyramidProgression.md, not rejected for carrying a field the
    // schema no longer declares.
    const legacy = validProgram()
    ;(legacy.sessions[0].items[0] as Record<string, unknown>).targetRir = 2
    const result = validateProgramImport(legacy, libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.program.sessions[0].items[0]).not.toHaveProperty('targetRir')
    }
  })

  it('rejects a missing required field, naming the field via the schema-error descriptor', () => {
    const bad = validProgram()
    delete (bad as Record<string, unknown>).startDate
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.key).toBe('plan:import.schemaAtPath')
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

  it('accepts a well-formed ladder prescription', () => {
    const good = validProgram()
    ;(good.sessions[0].items as unknown[])[0] = {
      exerciseId: 'goblet-squat',
      sets: 3,
      mode: 'reps',
      restSeconds: 120,
      perSide: false,
      setPlan: [
        { weightKg: 8, reps: 12 },
        { weightKg: 10, reps: 10 },
        { weightKg: 12, reps: 8 },
      ],
      maxWeightKg: 14,
      weightStepKg: 2,
    }
    const result = validateProgramImport(good, libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const item = result.program.sessions[0].items[0]
      expect(item.setPlan).toEqual([
        { weightKg: 8, reps: 12 },
        { weightKg: 10, reps: 10 },
        { weightKg: 12, reps: 8 },
      ])
      expect(item.range).toBeUndefined()
    }
  })

  it('rejects a prescription carrying both a Range and a setPlan, naming it plainly', () => {
    const bad = validProgram()
    ;(bad.sessions[0].items[0] as Record<string, unknown>).setPlan = [{ weightKg: 8, reps: 12 }]
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({
        key: 'plan:import.ambiguousPrescriptionModel',
        params: { sessionId: 'A', exerciseId: 'goblet-squat' },
      })
    }
  })

  it('rejects a seconds-mode ladder, naming it plainly rather than an unenforced assumption', () => {
    const bad = validProgram()
    ;(bad.sessions[0].items as unknown[])[0] = {
      exerciseId: 'goblet-squat',
      sets: 1,
      mode: 'seconds',
      restSeconds: 60,
      perSide: false,
      setPlan: [{ weightKg: null, reps: 20 }],
      maxWeightKg: null,
      weightStepKg: null,
    }
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({
        key: 'plan:import.ladderRequiresRepsMode',
        params: { sessionId: 'A', exerciseId: 'goblet-squat' },
      })
    }
  })

  it('rejects an empty setPlan', () => {
    const bad = validProgram()
    ;(bad.sessions[0].items as unknown[])[0] = {
      exerciseId: 'goblet-squat',
      sets: 0,
      mode: 'reps',
      restSeconds: 120,
      perSide: false,
      setPlan: [],
      maxWeightKg: 14,
      weightStepKg: 2,
    }
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('rejects a setPlan with a descending rung weight', () => {
    const bad = validProgram()
    ;(bad.sessions[0].items as unknown[])[0] = {
      exerciseId: 'goblet-squat',
      sets: 2,
      mode: 'reps',
      restSeconds: 120,
      perSide: false,
      setPlan: [
        { weightKg: 12, reps: 8 },
        { weightKg: 10, reps: 10 },
      ],
      maxWeightKg: 14,
      weightStepKg: 2,
    }
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('rejects a ladder whose sets count does not match setPlan.length', () => {
    const bad = validProgram()
    ;(bad.sessions[0].items as unknown[])[0] = {
      exerciseId: 'goblet-squat',
      sets: 2,
      mode: 'reps',
      restSeconds: 120,
      perSide: false,
      setPlan: [{ weightKg: 8, reps: 12 }],
      maxWeightKg: 14,
      weightStepKg: 2,
    }
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('accepts a well-formed weekdaySessions map for a weekday-pinned program', () => {
    const good = validProgram({
      schedulingMode: 'weekday-pinned',
      weekdaySessions: { 1: 'A', 3: 'B', 5: 'A' },
    })
    const result = validateProgramImport(good, libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.program.schedulingMode).toBe('weekday-pinned')
      expect(result.program.weekdaySessions).toEqual({ 1: 'A', 3: 'B', 5: 'A' })
    }
  })

  it('rejects weekday-pinned scheduling with no weekdaySessions entries', () => {
    const bad = validProgram({ schedulingMode: 'weekday-pinned' })
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
  })

  it('rejects a weekdaySessions entry naming a weekday outside trainingWeekdays', () => {
    const bad = validProgram({
      schedulingMode: 'weekday-pinned',
      weekdaySessions: { 2: 'A' }, // Tuesday — not in trainingWeekdays [1, 3, 5]
    })
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({
        key: 'plan:import.weekdaySessionNotTrainingDay',
        params: { weekdayKey: 'plan:import.weekdayName.2' },
      })
    }
  })

  it('rejects a weekdaySessions entry naming an unknown session id', () => {
    const bad = validProgram({
      schedulingMode: 'weekday-pinned',
      weekdaySessions: { 1: 'C' },
    })
    const result = validateProgramImport(bad, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({
        key: 'plan:import.unknownWeekdaySession',
        params: { sessionId: 'C' },
      })
    }
  })

  /**
   * docs/design/ActivityPrescriptionPhaseA.md §3.1 — an activity claiming a
   * training weekday used to be rejected (plan:import.weekdayIsTrainingDay).
   * That guard is gone: a training-weekday entry now renders as that day's
   * post-strength cardio (display only), and the dev already ships this
   * exact content shape for non-training weekdays — rejecting it only for
   * a training weekday would model the same ride two different ways.
   */
  it('accepts an activity claiming a training weekday, and round-trips it', () => {
    const withTrainingDayActivity = validProgram({
      weekdayActivities: {
        1: {
          kind: 'recovery',
          title: 'Recovery walk',
          items: [{ label: 'Zone 2 ride', detail: '30 min, after lifting' }],
        },
      },
    })
    const result = validateProgramImport(withTrainingDayActivity, libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.program.weekdayActivities?.[1]).toEqual({
        kind: 'recovery',
        title: 'Recovery walk',
        items: [{ label: 'Zone 2 ride', detail: '30 min, after lifting' }],
      })
    }
  })
})

/**
 * I2: every JSON validation error used to render raw English in all three
 * locales — `plan:import.schemaError` was a bare `{{message}}` passthrough
 * carrying `issue.message`. The Markdown import path next door has always
 * returned keyed descriptors, so the JSON path was the outlier.
 *
 * These tests pin the mapping from the *outside*: given a malformed file,
 * the descriptor must name a key, and that key (plus the nested message
 * key) must actually exist in en/fr/zh-CN.
 */
describe('JSON import errors are keyed, never English prose', () => {
  const enPlan = enPlanJson as Record<string, unknown>

  function keyExists(qualified: string): boolean {
    const path = qualified.replace(/^plan:/, '').split('.')
    let node: unknown = enPlan
    for (const segment of path) {
      if (typeof node !== 'object' || node === null) return false
      node = (node as Record<string, unknown>)[segment]
    }
    return typeof node === 'string'
  }

  /** Each case is one malformed program and the message key it must produce. */
  const cases: { name: string; input: unknown; messageKey: string }[] = [
    {
      name: 'a malformed startDate',
      input: validProgram({ startDate: '10 Aug 2026' }),
      messageKey: 'plan:import.schema.dateFormat',
    },
    {
      name: 'an endDate before startDate',
      input: validProgram({ startDate: '2026-08-10', endDate: '2026-08-01' }),
      messageKey: 'plan:import.schema.endDateOrder',
    },
    {
      name: 'weekday-pinned with no weekdaySessions',
      input: validProgram({ schedulingMode: 'weekday-pinned' }),
      messageKey: 'plan:import.schema.pinnedNeedsWeekdaySessions',
    },
    {
      name: 'a weekday key outside 1-7',
      input: validProgram({
        weekdayActivities: { 9: { kind: 'recovery', title: 'Walk', items: [{ label: 'Walk' }] } },
      }),
      messageKey: 'plan:import.schema.weekdayKeyRange',
    },
    {
      name: 'a wrong field type',
      input: validProgram({ phase: 'two' }),
      messageKey: 'plan:import.zod.invalidType',
    },
    {
      name: 'an empty required string',
      input: validProgram({ name: '' }),
      messageKey: 'plan:import.zod.required',
    },
    {
      name: 'a value outside an allowed set',
      input: validProgram({ schedulingMode: 'whenever' }),
      messageKey: 'plan:import.zod.invalidValue',
    },
    {
      name: 'a number below its minimum',
      // Distinct from the empty-string case: "expected at least 1" is the
      // right phrasing for a number and the wrong one for a missing name.
      input: validProgram({ phase: 0 }),
      messageKey: 'plan:import.zod.tooSmall',
    },
  ]

  for (const { name, input, messageKey } of cases) {
    it(`keys the error for ${name}`, () => {
      const result = validateProgramImport(input, libraryIds)
      expect(result.ok).toBe(false)
      if (result.ok) return

      // Either the message key stands alone, or it is nested under the
      // path wrapper — whose punctuation is what localizes per locale.
      const actualMessageKey =
        result.error.key === 'plan:import.schemaAtPath'
          ? result.error.params?.messageKey
          : result.error.key
      expect(actualMessageKey).toBe(messageKey)
      expect(keyExists(String(actualMessageKey)), `${actualMessageKey} missing from en/plan.json`).toBe(true)
    })
  }

  it('never returns a descriptor carrying a raw English message', () => {
    for (const { input } of cases) {
      const result = validateProgramImport(input, libraryIds)
      expect(result.ok).toBe(false)
      if (result.ok) continue
      // The passthrough keys are gone; nothing may smuggle prose through a
      // `message` param either.
      expect(result.error.key).not.toBe('plan:import.schemaError')
      expect(result.error.key).not.toBe('plan:import.schemaErrorWithPath')
      expect(result.error.params?.message).toBeUndefined()
    }
  })

  it('keeps the schema messages as keys, so none of them is prose', () => {
    // A schema message that stopped being a key would render literally.
    const result = validateProgramImport(validProgram({ startDate: 'nope' }), libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(String(result.error.params?.messageKey)).toMatch(/^plan:import\./)
    }
  })
})
