import { describe, expect, it } from 'vitest'
import type { ExercisePrescription } from './types'
import type { WarmupStep } from './warmup'

/**
 * Structural guard mirroring routine.test.ts:63's "carries no prose"
 * test — the no-progression property that keeps warm-ups out of
 * domain/progression.ts is what these assertions exist to pin.
 */
describe('WarmupStep', () => {
  it('a cycle step carries only kind/minutes', () => {
    const step: WarmupStep = { kind: 'cycle', minutes: 3 }
    expect(Object.keys(step).sort()).toEqual(['kind', 'minutes'])
  })

  it('a movement step carries only kind/exerciseId/reps — no weightKg, setPlan, mode or recordable', () => {
    const step: WarmupStep = { kind: 'movement', exerciseId: 'scapular-push-up', reps: 8 }
    expect(Object.keys(step).sort()).toEqual(['exerciseId', 'kind', 'reps'])
  })

  it('a movement step adds only perSide when present', () => {
    const step: WarmupStep = {
      kind: 'movement',
      exerciseId: 'bulgarian-split-squat',
      reps: 5,
      perSide: true,
    }
    expect(Object.keys(step).sort()).toEqual(['exerciseId', 'kind', 'perSide', 'reps'])
  })

  it('a ramp step carries only kind/exerciseId/implement/weightKg/reps — never a setPlan rung', () => {
    const step: WarmupStep = {
      kind: 'ramp',
      exerciseId: 'incline-dumbbell-press',
      implement: 'dumbbell',
      weightKg: 6,
      reps: 8,
    }
    expect(Object.keys(step).sort()).toEqual(['exerciseId', 'implement', 'kind', 'reps', 'weightKg'])
  })

  it('is not assignable to ExercisePrescription — a warm-up value cannot reach domain/progression.ts', () => {
    const step: WarmupStep = {
      kind: 'ramp',
      exerciseId: 'incline-dumbbell-press',
      implement: 'dumbbell',
      weightKg: 6,
      reps: 8,
    }
    // Compile-time guard: if WarmupStep ever grows a shape that satisfies
    // ExercisePrescription, this stops being a type error and `npm run
    // typecheck` fails on an unused '@ts-expect-error' directive — that
    // failure is the trip-wire. Verified red by deleting the directive
    // and confirming `tsc -b` reports TS2322 (see the phase 4b commit
    // message for the exact output).
    // @ts-expect-error — WarmupStep must never satisfy ExercisePrescription.
    const prescription: ExercisePrescription = step
    expect(prescription).toBe(step)
  })
})
