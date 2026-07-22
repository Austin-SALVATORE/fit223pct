import { describe, expect, it } from 'vitest'
import { coachInsight, workoutHighlights } from './highlights'
import type {
  ExercisePrescription,
  LoggedSet,
  RepRangePrescription,
  SessionTemplate,
  Workout,
} from './types'
import { completeWorkout, createWorkout, logSet } from './workout'

function prescription(
  exerciseId: string,
  overrides: Partial<RepRangePrescription> = {},
): RepRangePrescription {
  return {
    exerciseId,
    sets: 2,
    mode: 'reps',
    range: { min: 8, max: 12 },
    targetRir: 2,
    restSeconds: 120,
    perSide: false,
    startWeightKg: 14,
    maxWeightKg: 20,
    weightStepKg: 2,
    ...overrides,
  }
}

function set(reps: number | null, weightKg: number | null, seconds: number | null = null): Omit<LoggedSet, 'setIndex'> {
  return { reps, weightKg, seconds, rir: 2, completedAt: '2026-07-24T18:00:00.000Z' }
}

function buildWorkout(
  id: string,
  date: string,
  items: ExercisePrescription[],
  setsPerExercise: Omit<LoggedSet, 'setIndex'>[][],
  completed = true,
): Workout {
  const sessionTemplate: SessionTemplate = { id: 'A', name: 'A', focus: 'f', items }
  let workout = createWorkout({
    id,
    programId: 'p',
    session: sessionTemplate,
    date,
    startedAt: `${date}T18:00:00.000Z`,
  })
  setsPerExercise.forEach((sets, exerciseIndex) => {
    for (const s of sets) workout = logSet(workout, exerciseIndex, s)
  })
  return completed ? completeWorkout(workout, `${date}T19:00:00.000Z`) : workout
}

const squat = prescription('goblet-squat')
const plank = prescription('side-plank', {
  mode: 'seconds',
  range: { min: 20, max: 40 },
  startWeightKg: null,
  maxWeightKg: null,
  weightStepKg: null,
})

describe('workoutHighlights', () => {
  it('marks a never-before-logged exercise as a first', () => {
    const current = buildWorkout('w1', '2026-07-22', [squat], [[set(10, 14)]])
    const [highlight] = workoutHighlights(current, [])
    expect(highlight.kind).toBe('first')
  })

  it('celebrates a load increase with the delta', () => {
    const previous = buildWorkout('w1', '2026-07-20', [squat], [[set(12, 14), set(12, 14)]])
    const current = buildWorkout('w2', '2026-07-22', [squat], [[set(8, 16), set(8, 16)]])
    const [highlight] = workoutHighlights(current, [previous])
    expect(highlight.kind).toBe('load')
    expect(highlight.label).toEqual({ key: 'domain:highlight.load', params: { delta: 2 } })
  })

  it('celebrates added reps at the same top load', () => {
    const previous = buildWorkout('w1', '2026-07-20', [squat], [[set(9, 14), set(8, 14)]])
    const current = buildWorkout('w2', '2026-07-22', [squat], [[set(11, 14), set(8, 14)]])
    const [highlight] = workoutHighlights(current, [previous])
    expect(highlight.kind).toBe('effort')
    expect(highlight.label).toEqual({ key: 'domain:highlight.effortReps', params: { count: 2 } })
  })

  it('celebrates longer holds for time-based work', () => {
    const previous = buildWorkout('w1', '2026-07-20', [plank], [[set(null, null, 25), set(null, null, 25)]])
    const current = buildWorkout('w2', '2026-07-22', [plank], [[set(null, null, 30), set(null, null, 25)]])
    const [highlight] = workoutHighlights(current, [previous])
    expect(highlight.kind).toBe('effort')
    expect(highlight.label).toEqual({ key: 'domain:highlight.effortSeconds', params: { delta: 5 } })
  })

  it('reports steady work without inventing progress', () => {
    const previous = buildWorkout('w1', '2026-07-20', [squat], [[set(10, 14), set(10, 14)]])
    const current = buildWorkout('w2', '2026-07-22', [squat], [[set(10, 14), set(9, 14)]])
    const [highlight] = workoutHighlights(current, [previous])
    expect(highlight.kind).toBe('steady')
  })

  it('ignores the workout itself when it appears in history', () => {
    const current = buildWorkout('w1', '2026-07-22', [squat], [[set(10, 14)]])
    const [highlight] = workoutHighlights(current, [current])
    expect(highlight.kind).toBe('first')
  })
})

describe('coachInsight', () => {
  it('leads with load progress when present', () => {
    const insight = coachInsight([
      { exerciseId: 'a', kind: 'load', label: { key: 'domain:highlight.load', params: { delta: 2 } } },
      { exerciseId: 'b', kind: 'steady', label: { key: 'domain:highlight.steady' } },
    ])
    expect(insight).toEqual({ key: 'domain:coachInsight.loadsUp', params: { count: 1 } })
  })

  it('frames added reps as the road to more load', () => {
    const insight = coachInsight([
      { exerciseId: 'a', kind: 'effort', label: { key: 'domain:highlight.effortReps', params: { count: 1 } } },
    ])
    expect(insight).toEqual({ key: 'domain:coachInsight.effortsUp' })
  })

  it('treats an all-first session as baseline setting', () => {
    const insight = coachInsight([
      { exerciseId: 'a', kind: 'first', label: { key: 'domain:highlight.first' } },
      { exerciseId: 'b', kind: 'first', label: { key: 'domain:highlight.first' } },
    ])
    expect(insight).toEqual({ key: 'domain:coachInsight.baselines' })
  })

  it('never shames a steady session', () => {
    const insight = coachInsight([{ exerciseId: 'a', kind: 'steady', label: { key: 'domain:highlight.steady' } }])
    expect(insight).toEqual({ key: 'domain:coachInsight.consistent' })
  })

  it('honors a session trained on an adjusted (easier) day', () => {
    const insight = coachInsight(
      [{ exerciseId: 'a', kind: 'steady', label: { key: 'domain:highlight.steady' } }],
      'easier',
    )
    expect(insight).toEqual({ key: 'domain:coachInsight.easier' })
  })
})
