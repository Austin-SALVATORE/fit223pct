import { describe, expect, it } from 'vitest'
import { seedWarmups, warmupById } from './warmups'
import { mesocycle2Build } from './program'
import { seedExercises } from './exercises'
import enSeed from '@/locales/en/seed.json'
import type { ExercisePrescription, SessionTemplate } from '@/domain/types'
import type { Warmup, WarmupStep } from '@/domain/warmup'

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
  id?: string
  dose?: Record<string, unknown>
  exerciseId?: string
  implement?: 'dumbbell' | 'barbell'
  weightKg?: number
  reps?: number
  perSide?: boolean
  variantId?: string
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
  // 21 Oct 2026 optimization (coach arbitration Q6), replacing -v1: Session C
  // now opens on the Dumbbell Reverse Lunge, so the warm-up rehearses that and
  // the hip-thrust ramps are gone (acceptance 8). Glute bridge stays,
  // unweighted (acceptance 9). The OHP ramp is NOT here — it belongs to
  // overhead-press (acceptance 10), see the exercise-level entry below.
  'mesocycle2-fullbody-hipext-shoulder-warmup-v2': [
    { kind: 'cycle', minutes: 3 },
    { kind: 'movement', exerciseId: 'glute-bridge', reps: 8 },
    { kind: 'movement', exerciseId: 'reverse-lunge', reps: 5, perSide: true, variantId: 'bodyweight-reverse-lunge' },
    { kind: 'ramp', exerciseId: 'reverse-lunge', implement: 'dumbbell', weightKg: 2, reps: 5, perSide: true },
    { kind: 'ramp', exerciseId: 'reverse-lunge', implement: 'dumbbell', weightKg: 4, reps: 3, perSide: true },
  ],
  // Exercise-level (Q6): "Empty barbell, 7.75 kg total x 5", before the OHP.
  'mesocycle2-overhead-press-prep-v1': [
    { kind: 'ramp', exerciseId: 'overhead-press', implement: 'barbell', weightKg: 7.75, reps: 5 },
  ],
  // Exercise-level (Q6 A), in the coach's order, before the Parallel Bar Dip.
  'mesocycle2-parallel-bar-dip-prep-v1': [
    { kind: 'drill', id: 'shoulder-circles', dose: { unit: 'reps-each-direction', reps: 8 } },
    { kind: 'movement', exerciseId: 'scapular-push-up', reps: 6 },
    { kind: 'drill', id: 'supported-dip-hold', dose: { unit: 'seconds', seconds: 8 } },
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

  it('every exerciseId referenced by a movement or ramp step resolves to a real Library entry, and every drill has an English name (R4)', () => {
    const libraryIds = new Set(seedExercises.map((e) => e.id))
    expect(checkStepReferences(seedWarmups, libraryIds, drillNamesInEnglish(), variantNamesInEnglish())).toEqual([])
  })

  it('R1: every session warm-up ramp targets the session\'s first exercise and sits below its first working load', () => {
    const sessionsWithWarmup = mesocycle2Build.sessions.filter((s) => s.warmupId)
    expect(sessionsWithWarmup.length, 'no session references a warmupId — guard is checking nothing').toBeGreaterThan(0)

    for (const session of sessionsWithWarmup) {
      const warmup = warmupById(session.warmupId!)
      expect(warmup, `${session.id} references ${session.warmupId}, which does not exist`).toBeDefined()
      expect(checkSessionWarmup(session, warmup!)).toEqual([])
    }
  })

  it('R2: every exercise-level warm-up resolves, ramps only its own exercise, and sits below that exercise\'s first working load', () => {
    // Phase 4: real content now carries `warmupId`. The precondition keeps
    // this loop from silently going vacuous again if the pointers are deleted
    // (the checker itself is exercised by the synthetic tests below).
    const carriers = mesocycle2Build.sessions.flatMap((session) => session.items.filter((item) => item.warmupId !== undefined))
    expect(carriers.length, 'no prescription references an exercise-level warmupId — guard is checking nothing').toBeGreaterThan(0)
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        if (item.warmupId === undefined) continue
        const warmup = warmupById(item.warmupId)
        expect(warmup, `${session.id}/${item.exerciseId} references ${item.warmupId}, which does not exist`).toBeDefined()
        expect(checkExerciseWarmup(item, warmup!)).toEqual([])
      }
    }
  })

  it('R3: the session\'s first item never carries an exercise-level warmupId — the session warm-up owns it', () => {
    for (const session of mesocycle2Build.sessions) {
      expect(session.items[0].warmupId, `${session.id}'s first item carries a warmupId`).toBeUndefined()
    }
  })
})

// ---- the checkers, with their own synthetic proof ---------------------------------------

type Ramp = Extract<WarmupStep, { kind: 'ramp' }>
const isRamp = (s: WarmupStep): s is Ramp => s.kind === 'ramp'

/**
 * The load a prescription's first working set uses: a ladder's first rung, or
 * a rep-range item's `startWeightKg`. `null` when unloaded. This replaces the
 * old `as LadderPrescription` cast, which threw a TypeError the moment a
 * rep-range exercise opened a session.
 */
function firstWorkingLoadKg(item: ExercisePrescription): number | null {
  return item.setPlan !== undefined ? (item.setPlan[0]?.weightKg ?? null) : item.startWeightKg
}

function rampOrderViolations(label: string, ramps: Ramp[]): string[] {
  const out: string[] = []
  for (let i = 1; i < ramps.length; i += 1) {
    if (ramps[i].weightKg <= ramps[i - 1].weightKg) out.push(`${label}: ramp ${i + 1} does not increase load over ramp ${i}`)
    if (ramps[i].reps >= ramps[i - 1].reps) out.push(`${label}: ramp ${i + 1} does not decrease reps over ramp ${i}`)
  }
  return out
}

function rampsFor(item: ExercisePrescription, ramps: Ramp[], label: string): string[] {
  const first = firstWorkingLoadKg(item)
  if (first === null) return ramps.length > 0 ? [`${label}: ramps need a loaded first working set`] : []
  return [
    ...ramps.flatMap((r) =>
      r.exerciseId !== item.exerciseId
        ? [`${label}: ramp rehearses ${r.exerciseId}, not ${item.exerciseId}`]
        : r.weightKg >= first
          ? [`${label}: ramp ${r.weightKg} kg is not below the first working load ${first} kg`]
          : [],
    ),
    ...rampOrderViolations(label, ramps),
  ]
}

/** R1 — the 13 Aug rule: the session warm-up ramps the session's first exercise, and has at least one ramp. */
function checkSessionWarmup(session: SessionTemplate, warmup: Warmup): string[] {
  const ramps = warmup.steps.filter(isRamp)
  const label = session.id
  return [...(ramps.length === 0 ? [`${label}: warm-up has no ramp step`] : []), ...rampsFor(session.items[0], ramps, label)]
}

/** R2 — an exercise-level warm-up ramps only its own exercise. Zero ramps is allowed (the Dip prep is drills only). */
function checkExerciseWarmup(item: ExercisePrescription, warmup: Warmup): string[] {
  return rampsFor(item, warmup.steps.filter(isRamp), `${item.exerciseId}/${warmup.id}`)
}

/** R4 — Library ids for movement and ramp steps; an English name for every drill id and every movement variantId (C11). */
function checkStepReferences(
  warmups: readonly Warmup[],
  libraryIds: Set<string>,
  drillNames: Set<string>,
  variantNames: Set<string> = new Set(),
): string[] {
  const out: string[] = []
  for (const w of warmups) {
    for (const step of w.steps) {
      if (step.kind === 'cycle') continue
      if (step.kind === 'drill') {
        if (!drillNames.has(step.id)) out.push(`${w.id}/drill:${step.id} has no seed:warmupDrill.${step.id}.name`)
      } else {
        if (!libraryIds.has(step.exerciseId)) out.push(`${w.id}/${step.exerciseId}`)
        if (step.kind === 'movement' && step.variantId !== undefined && !variantNames.has(step.variantId)) {
          out.push(`${w.id}/variant:${step.variantId} has no seed:warmupVariant.${step.variantId}.name`)
        }
      }
    }
  }
  return out
}

function variantNamesInEnglish(): Set<string> {
  const variants = (enSeed as { warmupVariant?: Record<string, { name?: string }> }).warmupVariant ?? {}
  return new Set(Object.entries(variants).filter(([, v]) => typeof v.name === 'string').map(([k]) => k))
}

function drillNamesInEnglish(): Set<string> {
  const drills = (enSeed as { warmupDrill?: Record<string, { name?: string }> }).warmupDrill ?? {}
  return new Set(Object.entries(drills).filter(([, v]) => typeof v.name === 'string').map(([k]) => k))
}

describe('the warm-up rule checkers catch what they claim to (synthetic, because the real content cannot yet)', () => {
  const ladder = (weights: number[]): ExercisePrescription => ({
    exerciseId: 'overhead-press',
    sets: weights.length,
    mode: 'reps',
    restSeconds: 120,
    perSide: false,
    setPlan: weights.map((weightKg) => ({ weightKg, reps: 8 })),
    maxWeightKg: 43.75,
    weightStepKg: 2,
  })
  const repRange = (start: number | null): ExercisePrescription => ({
    exerciseId: 'reverse-lunge',
    sets: 3,
    mode: 'reps',
    restSeconds: 90,
    perSide: true,
    range: { min: 8, max: 12 },
    startWeightKg: start,
    maxWeightKg: 20,
    weightStepKg: 2,
  })
  const ramp = (exerciseId: string, weightKg: number, reps: number): WarmupStep => ({
    kind: 'ramp',
    exerciseId,
    implement: 'barbell',
    weightKg,
    reps,
  })
  const warmup = (...steps: WarmupStep[]): Warmup => ({ id: 'synthetic', steps })

  it('firstWorkingLoadKg reads a ladder\'s first rung and a rep-range item\'s start weight', () => {
    expect(firstWorkingLoadKg(ladder([11.75, 13.75]))).toBe(11.75)
    expect(firstWorkingLoadKg(repRange(6))).toBe(6) // the branch that used to throw
    expect(firstWorkingLoadKg(repRange(null))).toBeNull()
  })

  it('R2 accepts a drills-only warm-up (zero ramps) and a valid ramp on its own exercise', () => {
    const drillsOnly = warmup({ kind: 'drill', id: 'x', dose: { unit: 'seconds', seconds: 8 } })
    expect(checkExerciseWarmup(ladder([11.75]), drillsOnly)).toEqual([])
    expect(checkExerciseWarmup(ladder([11.75]), warmup(ramp('overhead-press', 7.75, 5)))).toEqual([])
  })

  it('R2 rejects a ramp for another exercise, a ramp not below the first rung, and a non-rising pair', () => {
    const item = ladder([11.75, 13.75])
    expect(checkExerciseWarmup(item, warmup(ramp('reverse-lunge', 7.75, 5)))).toHaveLength(1) // wrong exercise
    expect(checkExerciseWarmup(item, warmup(ramp('overhead-press', 11.75, 5)))).toHaveLength(1) // equal to first rung
    expect(checkExerciseWarmup(item, warmup(ramp('overhead-press', 7.75, 5), ramp('overhead-press', 9.75, 5)))).toHaveLength(1) // reps do not fall
  })

  it('R1 works for a rep-range first item and rejects a session warm-up with no ramp or a retargeted ramp', () => {
    const session = (first: ExercisePrescription): SessionTemplate => ({ id: 's', name: 'S', focus: 'F', items: [first] })
    expect(checkSessionWarmup(session(repRange(6)), warmup(ramp('reverse-lunge', 2, 5)))).toEqual([])
    expect(checkSessionWarmup(session(repRange(6)), warmup({ kind: 'cycle', minutes: 3 }))).toHaveLength(1)
    expect(checkSessionWarmup(session(ladder([11.75])), warmup(ramp('reverse-lunge', 7.75, 5)))).toHaveLength(1)
  })

  it('R4 flags a drill with no English name and a movement that is not a Library id', () => {
    const w = warmup({ kind: 'drill', id: 'ghost', dose: { unit: 'reps-each-direction', reps: 8 } }, { kind: 'movement', exerciseId: 'nope', reps: 5 })
    expect(checkStepReferences([w], new Set(['goblet-squat']), new Set())).toEqual([
      'synthetic/drill:ghost has no seed:warmupDrill.ghost.name',
      'synthetic/nope',
    ])
    expect(checkStepReferences([w], new Set(['nope']), new Set(['ghost']))).toEqual([])
  })

  it('R4 flags a movement variantId with no English name', () => {
    const w = warmup({ kind: 'movement', exerciseId: 'goblet-squat', reps: 5, variantId: 'ghost-variant' })
    expect(checkStepReferences([w], new Set(['goblet-squat']), new Set(), new Set())).toEqual([
      'synthetic/variant:ghost-variant has no seed:warmupVariant.ghost-variant.name',
    ])
    expect(checkStepReferences([w], new Set(['goblet-squat']), new Set(), new Set(['ghost-variant']))).toEqual([])
  })
})
