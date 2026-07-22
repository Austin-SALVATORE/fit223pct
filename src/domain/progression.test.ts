import { describe, expect, it } from 'vitest'
import { suggestLadderProgression, suggestProgression } from './progression'
import type { ExercisePrescription, LadderPrescription, LoggedSet } from './types'

const prescription: ExercisePrescription = {
  exerciseId: 'goblet-squat',
  sets: 3,
  mode: 'reps',
  range: { min: 8, max: 12 },
  targetRir: 2,
  restSeconds: 120,
  perSide: false,
  startWeightKg: 16,
  maxWeightKg: 20,
  weightStepKg: 2,
}

function set(reps: number, weightKg: number, rir: number): LoggedSet {
  return {
    setIndex: 0,
    reps,
    weightKg,
    seconds: null,
    rir,
    completedAt: '2026-07-22T18:00:00.000Z',
  }
}

describe('suggestProgression', () => {
  it('starts from the prescribed weight when there is no history', () => {
    const s = suggestProgression(prescription, [])
    expect(s.type).toBe('start')
    expect(s.weightKg).toBe(16)
    expect(s.targetReps).toBe(8)
  })

  it('adds load when every set hits the top of the range with reps in reserve', () => {
    const s = suggestProgression(prescription, [
      set(12, 16, 2),
      set(12, 16, 2),
      set(12, 16, 3),
    ])
    expect(s.type).toBe('increase-load')
    expect(s.weightKg).toBe(18)
    expect(s.targetReps).toBe(8)
  })

  it('adds reps when the range is not yet filled', () => {
    const s = suggestProgression(prescription, [
      set(12, 16, 2),
      set(10, 16, 1),
      set(9, 16, 1),
    ])
    expect(s.type).toBe('add-reps')
    expect(s.weightKg).toBe(16)
    expect(s.targetReps).toBe(10)
  })

  it('holds steady when top of range was reached but too close to failure', () => {
    const s = suggestProgression(prescription, [
      set(12, 16, 0),
      set(12, 16, 0),
      set(12, 16, 1),
    ])
    expect(s.type).toBe('consolidate')
    expect(s.weightKg).toBe(16)
  })

  it('switches to technique progression at the equipment ceiling', () => {
    const s = suggestProgression(prescription, [
      set(12, 20, 3),
      set(12, 20, 3),
      set(12, 20, 2),
    ])
    expect(s.type).toBe('add-technique')
    expect(s.weightKg).toBe(20)
  })

  it('never suggests adding load on an easier readiness day — consolidates instead', () => {
    const s = suggestProgression(
      prescription,
      [set(12, 16, 2), set(12, 16, 2), set(12, 16, 3)],
      'easier',
    )
    expect(s.type).toBe('consolidate')
    expect(s.weightKg).toBe(16)
  })

  it('still allows adding reps within the range on an easier day', () => {
    const s = suggestProgression(prescription, [set(10, 16, 2), set(9, 16, 2)], 'easier')
    expect(s.type).toBe('add-reps')
  })

  it('progresses band/bodyweight work through reps then technique', () => {
    const bandWork: ExercisePrescription = {
      ...prescription,
      exerciseId: 'band-pull-apart',
      range: { min: 15, max: 20 },
      startWeightKg: null,
      maxWeightKg: null,
      weightStepKg: null,
    }
    const below = suggestProgression(bandWork, [set(16, 0, 2), set(15, 0, 2)])
    expect(below.type).toBe('add-reps')

    const topped = suggestProgression(bandWork, [set(20, 0, 3), set(20, 0, 3)])
    expect(topped.type).toBe('add-technique')
  })
})

describe('suggestLadderProgression', () => {
  const ladder: LadderPrescription = {
    exerciseId: 'bench-press',
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

  function ladderSet(setIndex: number, reps: number, weightKg: number): LoggedSet {
    return { setIndex, reps, weightKg, seconds: null, rir: null, completedAt: '2026-07-22T18:00:00.000Z' }
  }

  it('repeats the same targets with no history', () => {
    const result = suggestLadderProgression(ladder, [])
    expect(result).toEqual({ type: 'repeat', setPlan: ladder.setPlan })
  })

  it('repeats unchanged when any rung falls short of its target reps', () => {
    const result = suggestLadderProgression(ladder, [
      ladderSet(0, 12, 8),
      ladderSet(1, 9, 10), // short of 10
      ladderSet(2, 8, 12),
    ])
    expect(result).toEqual({ type: 'repeat', setPlan: ladder.setPlan })
  })

  it('advances every rung by weightStepKg when every rung hits its target', () => {
    const result = suggestLadderProgression(ladder, [
      ladderSet(0, 12, 8),
      ladderSet(1, 10, 10),
      ladderSet(2, 8, 12),
    ])
    expect(result).toEqual({
      type: 'advance',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
      ],
    })
  })

  it('holds the whole ladder unchanged at the equipment ceiling — never a partial advance', () => {
    const atCap: LadderPrescription = { ...ladder, maxWeightKg: 12 }
    const result = suggestLadderProgression(atCap, [
      ladderSet(0, 12, 8),
      ladderSet(1, 10, 10),
      ladderSet(2, 8, 12),
    ])
    expect(result.type).toBe('at-equipment-max')
    // The whole ladder holds — rungs 1 and 2 do NOT advance just because
    // they individually had room; only the top rung's cap decides.
    expect(result.setPlan).toEqual(atCap.setPlan)
  })

  it('treats a null maxWeightKg/weightStepKg as at the ceiling, same as rep-range add-technique', () => {
    const noStep: LadderPrescription = { ...ladder, weightStepKg: null }
    const result = suggestLadderProgression(noStep, [
      ladderSet(0, 12, 8),
      ladderSet(1, 10, 10),
      ladderSet(2, 8, 12),
    ])
    expect(result.type).toBe('at-equipment-max')
  })
})
