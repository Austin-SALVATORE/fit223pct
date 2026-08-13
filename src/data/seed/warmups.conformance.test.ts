import { describe, expect, it } from 'vitest'
import { seedWarmups, warmupById } from './warmups'
import { mesocycle2Build } from './program'
import { seedExercises } from './exercises'
import type { LadderPrescription } from '@/domain/types'
import type { WarmupStep } from '@/domain/warmup'

/**
 * Conformance guard for the 13 Aug 2026 Full Body Restructure's warm-up
 * prescriptions (six-question bundle Q1: exact ramp loads, "Do NOT defer
 * these warm-up loads to the future Load Setup engine"), mirroring
 * `mesocycle2Build.conformance.test.ts`'s own method: `EXPECTED` below is
 * transcribed independently from the coach spec, not derived from
 * `seedWarmups` itself — a circular check (the seed compared against a
 * copy of the seed) would pass on a shared mistake.
 */

interface ExpectedStep {
  kind: WarmupStep['kind']
  exerciseId?: string
  implement?: 'dumbbell' | 'barbell'
  weightKg?: number
  reps?: number
  perSide?: boolean
  minutes?: number
}

const EXPECTED: Record<string, ExpectedStep[]> = {
  // New (13 Aug restructure) — rehearses goblet-squat, now the session's
  // opening movement.
  'mesocycle2-fullbody-squat-warmup-v1': [
    { kind: 'cycle', minutes: 3 },
    { kind: 'movement', exerciseId: 'bodyweight-squat', reps: 8 },
    { kind: 'ramp', exerciseId: 'goblet-squat', implement: 'dumbbell', weightKg: 8, reps: 5 },
  ],
  // Byte-identical to what shipped before the restructure — the Romanian
  // deadlift already opened this session, only the id changes.
  'mesocycle2-fullbody-hinge-warmup-v1': [
    { kind: 'cycle', minutes: 3 },
    { kind: 'movement', exerciseId: 'bodyweight-hip-hinge', reps: 8 },
    { kind: 'ramp', exerciseId: 'romanian-deadlift', implement: 'barbell', weightKg: 7.75, reps: 8 },
    { kind: 'ramp', exerciseId: 'romanian-deadlift', implement: 'barbell', weightKg: 15.75, reps: 5 },
  ],
  // New (13 Aug restructure) — rehearses barbell-hip-thrust, now the
  // session's opening movement; movement step is glute-bridge, promoted
  // to the Library for this warm-up (Phase 1 of the transcription plan).
  'mesocycle2-fullbody-hipext-shoulder-warmup-v1': [
    { kind: 'cycle', minutes: 3 },
    { kind: 'movement', exerciseId: 'glute-bridge', reps: 8 },
    { kind: 'ramp', exerciseId: 'barbell-hip-thrust', implement: 'barbell', weightKg: 11.75, reps: 8 },
    { kind: 'ramp', exerciseId: 'barbell-hip-thrust', implement: 'barbell', weightKg: 19.75, reps: 5 },
  ],
}

function stripUndefined(step: WarmupStep): Record<string, unknown> {
  return Object.fromEntries(Object.entries(step).filter(([, v]) => v !== undefined))
}

describe('warm-up catalogue conformance (transcription independent of the seed)', () => {
  for (const [warmupId, expectedSteps] of Object.entries(EXPECTED)) {
    it(`${warmupId} matches the coach spec exactly, step for step`, () => {
      const warmup = warmupById(warmupId)
      expect(warmup, `${warmupId} is missing from seedWarmups`).toBeDefined()
      expect(warmup!.steps.map(stripUndefined)).toEqual(
        expectedSteps.map((s) => Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined))),
      )
    })
  }

  it('every warm-up id in EXPECTED is exactly the set of ids seedWarmups declares (no silent extra, no silent gap)', () => {
    expect(seedWarmups.map((w) => w.id).sort()).toEqual(Object.keys(EXPECTED).sort())
  })

  it('every exerciseId referenced by a movement or ramp step resolves to a real Library entry', () => {
    const libraryIds = new Set(seedExercises.map((e) => e.id))
    const unresolved: string[] = []
    for (const warmup of seedWarmups) {
      for (const step of warmup.steps) {
        if (step.kind === 'cycle') continue
        if (!libraryIds.has(step.exerciseId)) unresolved.push(`${warmup.id}/${step.exerciseId}`)
      }
    }
    expect(unresolved).toEqual([])
  })

  it('every ramp step is strictly below its session\'s first working rung, and reps fall as ramp load rises (coach rules 6 and 8)', () => {
    const sessionsWithWarmup = mesocycle2Build.sessions.filter((s) => s.warmupId)
    expect(sessionsWithWarmup.length, 'no session references a warmupId — guard is checking nothing').toBeGreaterThan(0)

    for (const session of sessionsWithWarmup) {
      const warmup = warmupById(session.warmupId!)
      expect(warmup, `${session.id} references ${session.warmupId}, which does not exist`).toBeDefined()

      const firstItem = session.items[0] as LadderPrescription
      const firstRungKg = firstItem.setPlan[0].weightKg
      expect(firstRungKg, `${session.id}'s first item has no weighted first rung`).not.toBeNull()

      const ramps = warmup!.steps.filter((s): s is Extract<WarmupStep, { kind: 'ramp' }> => s.kind === 'ramp')
      expect(ramps.length, `${session.id}'s warm-up has no ramp step`).toBeGreaterThan(0)

      for (const ramp of ramps) {
        expect(
          ramp.exerciseId,
          `${session.id}'s ramp rehearses ${ramp.exerciseId}, not the session's first exercise ${firstItem.exerciseId}`,
        ).toBe(firstItem.exerciseId)
        expect(
          ramp.weightKg,
          `${session.id}: ramp load ${ramp.weightKg} kg is not below the first working rung ${firstRungKg} kg`,
        ).toBeLessThan(firstRungKg!)
      }

      for (let i = 1; i < ramps.length; i += 1) {
        expect(
          ramps[i].weightKg,
          `${session.id}: ramp ${i + 1} does not increase load over ramp ${i}`,
        ).toBeGreaterThan(ramps[i - 1].weightKg)
        expect(
          ramps[i].reps,
          `${session.id}: ramp ${i + 1} does not decrease reps as load rises over ramp ${i}`,
        ).toBeLessThan(ramps[i - 1].reps)
      }
    }
  })
})
