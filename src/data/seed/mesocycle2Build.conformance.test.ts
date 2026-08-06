import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'
import { seedExercises } from './exercises'
import { suggestLadderProgression } from '@/domain/progression'
import type { LadderPrescription, LoggedSet, SetVariant } from '@/domain/types'

/**
 * docs/design/Mesocycle2Implementation.md §12.2 — "Spec conformance,
 * replacing what §9 retires." Reads the **seeded** Build program and
 * asserts it against Mesocycle-2-Home-Progressive-Coach-Spec-v2.7.md
 * §6-§8 directly — this is what actually ships, unlike the retired gym
 * program's own Markdown fixture, which never did.
 *
 * `EXPECTED` below is transcribed independently from the same spec
 * tables `program.ts` was written against, not derived from
 * `mesocycle2Build` itself — a circular check (comparing the seed
 * against a copy of the seed) would pass on a shared mistake. This is
 * the guard that catches the exact failure mode the plan names: "the
 * transcription's risk is arithmetic, not code."
 */

interface ExpectedRung {
  weightKg: number | null
  reps: number
  variantKey?: SetVariant
}

interface ExpectedPrescription {
  exerciseId: string
  setPlan: ExpectedRung[]
  restSeconds: number
  perSide?: boolean
  mode?: 'reps' | 'seconds'
  role?: 'main' | 'accessory'
}

const EXPECTED: Record<string, ExpectedPrescription[]> = {
  'mesocycle2-chest-back': [
    {
      exerciseId: 'incline-dumbbell-press',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
        { weightKg: 15, reps: 6 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'single-arm-db-row',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
        { weightKg: 15, reps: 6 },
      ],
      restSeconds: 90,
      perSide: true,
    },
    {
      exerciseId: 'dumbbell-fly',
      setPlan: [
        { weightKg: 4, reps: 15 },
        { weightKg: 6, reps: 12 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
    {
      exerciseId: 'chest-supported-row',
      setPlan: [
        { weightKg: 10, reps: 15 },
        { weightKg: 12, reps: 12 },
      ],
      restSeconds: 90,
      role: 'accessory',
    },
    {
      exerciseId: 'goblet-squat',
      setPlan: [
        { weightKg: 8, reps: 20, variantKey: 'normal' },
        { weightKg: 10, reps: 15, variantKey: 'slow' },
        { weightKg: 12, reps: 12, variantKey: 'slow-pause' },
      ],
      restSeconds: 90,
      role: 'accessory',
    },
    {
      exerciseId: 'dumbbell-lateral-raise',
      setPlan: [
        { weightKg: 6, reps: 15 },
        { weightKg: 8, reps: 12 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
  ],
  'mesocycle2-legs-core': [
    {
      exerciseId: 'bulgarian-split-squat',
      setPlan: [
        { weightKg: 8, reps: 12 },
        { weightKg: 10, reps: 10 },
        { weightKg: 12, reps: 8 },
      ],
      restSeconds: 120,
      perSide: true,
    },
    {
      exerciseId: 'dumbbell-rdl',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
        { weightKg: 15, reps: 6 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'hamstring-walkout',
      setPlan: [
        { weightKg: null, reps: 12, variantKey: 'normal' },
        { weightKg: null, reps: 10, variantKey: 'slow' },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
    {
      exerciseId: 'standing-calf-raise',
      setPlan: [
        { weightKg: 8, reps: 20 },
        { weightKg: 10, reps: 15 },
        { weightKg: 12, reps: 12 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'dead-bug',
      setPlan: [
        { weightKg: null, reps: 10, variantKey: 'normal' },
        { weightKg: null, reps: 8, variantKey: 'longer-reach' },
        { weightKg: null, reps: 6, variantKey: 'reach-pause' },
      ],
      restSeconds: 60,
      perSide: true,
      role: 'accessory',
    },
    {
      exerciseId: 'dumbbell-pullover',
      setPlan: [
        { weightKg: 8, reps: 15 },
        { weightKg: 10, reps: 12 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
    {
      exerciseId: 'push-up',
      setPlan: [
        { weightKg: null, reps: 15, variantKey: 'normal' },
        { weightKg: null, reps: 12, variantKey: 'with-pause' },
      ],
      restSeconds: 90,
      role: 'accessory',
    },
  ],
  'mesocycle2-shoulders-arms': [
    {
      exerciseId: 'dumbbell-shoulder-press',
      setPlan: [
        { weightKg: 6, reps: 12 },
        { weightKg: 8, reps: 10 },
        { weightKg: 10, reps: 8 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'dumbbell-lateral-raise',
      setPlan: [
        { weightKg: 4, reps: 15 },
        { weightKg: 6, reps: 12 },
        { weightKg: 8, reps: 10 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'rear-delt-fly',
      setPlan: [
        { weightKg: 4, reps: 15 },
        { weightKg: 6, reps: 12 },
        { weightKg: 8, reps: 10 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'dumbbell-curl',
      setPlan: [
        { weightKg: 8, reps: 12 },
        { weightKg: 10, reps: 10 },
        { weightKg: 12, reps: 8 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
    {
      exerciseId: 'overhead-triceps-extension',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
    {
      exerciseId: 'single-leg-hip-thrust',
      setPlan: [
        { weightKg: null, reps: 15, variantKey: 'normal' },
        { weightKg: null, reps: 12, variantKey: 'with-pause' },
      ],
      restSeconds: 75,
      perSide: true,
      role: 'accessory',
    },
    {
      exerciseId: 'side-plank',
      setPlan: [
        { weightKg: null, reps: 40, variantKey: 'normal' },
        { weightKg: null, reps: 30, variantKey: 'harder-leverage' },
      ],
      restSeconds: 60,
      perSide: true,
      mode: 'seconds',
      role: 'accessory',
    },
  ],
}

const PRIMARY_EXERCISE_IDS = new Set([
  'incline-dumbbell-press',
  'single-arm-db-row',
  'bulgarian-split-squat',
  'dumbbell-rdl',
  'dumbbell-shoulder-press',
])

describe('mesocycle2Build — spec conformance (v2.7 §6-§8)', () => {
  it('trainingWeekdays and dates match spec §3', () => {
    expect(mesocycle2Build.trainingWeekdays).toEqual([1, 3, 5])
    expect(mesocycle2Build.startDate).toBe('2026-08-10')
    expect(mesocycle2Build.endDate).toBe('2026-09-13')
    expect(mesocycle2Build.schedulingMode).toBe('weekday-pinned')
  })

  it('every session in EXPECTED exists in the seeded program, and vice versa', () => {
    const seededIds = mesocycle2Build.sessions.map((s) => s.id).sort()
    const expectedIds = Object.keys(EXPECTED).sort()
    expect(seededIds).toEqual(expectedIds)
  })

  for (const session of mesocycle2Build.sessions) {
    describe(`session ${session.id}`, () => {
      const expectedItems = EXPECTED[session.id]

      it('has the exact set of prescriptions the spec table names, in order', () => {
        expect(session.items.map((i) => i.exerciseId)).toEqual(expectedItems.map((e) => e.exerciseId))
      })

      for (const expected of expectedItems) {
        it(`${expected.exerciseId} matches its spec row exactly`, () => {
          const actual = session.items.find((i) => i.exerciseId === expected.exerciseId)
          expect(actual, `${expected.exerciseId} is missing from ${session.id}`).toBeDefined()
          const ladder = actual as LadderPrescription

          expect(ladder.setPlan, `${session.id}/${expected.exerciseId} setPlan`).toEqual(expected.setPlan)
          expect(ladder.restSeconds, `${session.id}/${expected.exerciseId} restSeconds`).toBe(
            expected.restSeconds,
          )
          expect(ladder.perSide, `${session.id}/${expected.exerciseId} perSide`).toBe(expected.perSide ?? false)
          expect(ladder.mode, `${session.id}/${expected.exerciseId} mode`).toBe(expected.mode ?? 'reps')
          expect(ladder.role, `${session.id}/${expected.exerciseId} role`).toBe(expected.role ?? 'main')
        })
      }
    })
  }

  it('no weightKg exceeds the 15 kg/hand equipment tier ceiling', () => {
    const overCeiling: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        const ladder = item as LadderPrescription
        for (const rung of ladder.setPlan) {
          if (rung.weightKg !== null && rung.weightKg > 15) {
            overCeiling.push(`${session.id}/${item.exerciseId}: ${rung.weightKg} kg`)
          }
        }
      }
    }
    expect(overCeiling).toEqual([])
  })

  it('every exerciseId resolves to a real Library entry', () => {
    const libraryIds = new Set(seedExercises.map((e) => e.id))
    const unresolved: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        if (!libraryIds.has(item.exerciseId)) unresolved.push(`${session.id}/${item.exerciseId}`)
      }
    }
    expect(unresolved).toEqual([])
  })

  /**
   * §10: "Monday and Friday lateral raises deliberately begin with
   * different Pyramids." Both-directions by construction — this fails
   * if a well-meaning refactor ever deduplicates the two prescriptions
   * into one shared setPlan.
   */
  it('Session A and Session C lateral raises are different Pyramids, never deduplicated', () => {
    const sessionA = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-chest-back')!
    const sessionC = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-shoulders-arms')!
    const raiseA = sessionA.items.find((i) => i.exerciseId === 'dumbbell-lateral-raise') as LadderPrescription
    const raiseC = sessionC.items.find((i) => i.exerciseId === 'dumbbell-lateral-raise') as LadderPrescription

    expect(raiseA.setPlan).not.toEqual(raiseC.setPlan)
    expect(raiseA.setPlan).toEqual([
      { weightKg: 6, reps: 15 },
      { weightKg: 8, reps: 12 },
    ])
    expect(raiseC.setPlan).toEqual([
      { weightKg: 4, reps: 15 },
      { weightKg: 6, reps: 12 },
      { weightKg: 8, reps: 10 },
    ])
  })

  /** §8/§10: a timed hold, not a rep Pyramid — 40s then 30s, never reps. */
  it('side plank is a two-level timed hold, 40 sec then 30 sec, never reps', () => {
    const sessionC = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-shoulders-arms')!
    const plank = sessionC.items.find((i) => i.exerciseId === 'side-plank') as LadderPrescription

    expect(plank.mode).toBe('seconds')
    expect(plank.setPlan).toEqual([
      { weightKg: null, reps: 40, variantKey: 'normal' },
      { weightKg: null, reps: 30, variantKey: 'harder-leverage' },
    ])
  })

  /**
   * Found by an independent numeric read-back of this program against the
   * spec, outside what the assertions above check: the seeded prescription
   * is a seconds-mode ladder, the repo's first, and
   * `suggestLadderProgression`'s completion gate used to read
   * `LoggedSet.reps` unconditionally — `SetScreen` logs a timed hold into
   * `seconds`, never `reps`, so the check was `0 >= 40` forever. The
   * digits were always right; the completion signal was silently deleted,
   * so spec §10's "complete the 40-second hold before progressing the
   * 30-second one" had nothing to fire on. Fixed in progression.ts to
   * read through `effortOf`, which already existed for exactly this
   * branch. This proves the fix against the real seeded data, not just a
   * synthetic fixture.
   */
  it('the seeded side plank actually reaches load-not-the-lever from a perfect seconds log', () => {
    const sessionC = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-shoulders-arms')!
    const plank = sessionC.items.find((i) => i.exerciseId === 'side-plank') as LadderPrescription

    const perfectLog: LoggedSet[] = plank.setPlan.map((rung, setIndex) => ({
      setIndex,
      weightKg: null,
      reps: null,
      seconds: rung.reps,
      completedAt: '2026-08-10T09:00:00.000Z',
    }))

    const result = suggestLadderProgression(plank, perfectLog)
    expect(result.type).toBe('load-not-the-lever')
  })

  it('the five primary movements are role: main; everything else in Sessions A-C is role: accessory (spec §4)', () => {
    const misclassified: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        const expectedRole = PRIMARY_EXERCISE_IDS.has(item.exerciseId) ? 'main' : 'accessory'
        if ((item.role ?? 'main') !== expectedRole) {
          misclassified.push(`${session.id}/${item.exerciseId}: expected ${expectedRole}, got ${item.role}`)
        }
      }
    }
    expect(misclassified).toEqual([])
  })

  /**
   * Item 11 (display only) — spec §3/§12/§13/§14. The boundary moved with
   * docs/design/ActivityPrescriptionPhaseA.md: weekdayActivities may now
   * claim a training weekday (it renders as that day's post-strength
   * cardio), so the question is no longer "which weekdays may carry an
   * activity" but "does every prescribed day carry what the coach
   * prescribed."
   */
  it('weekdayActivities covers every day the coach prescribes work on', () => {
    const activityWeekdays = Object.keys(mesocycle2Build.weekdayActivities ?? {})
      .map(Number)
      .sort()
    expect(activityWeekdays).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('every training day carries its own post-strength ride (§12)', () => {
    for (const weekday of mesocycle2Build.trainingWeekdays) {
      const items = mesocycle2Build.weekdayActivities?.[weekday as 1 | 3 | 5]?.items ?? []
      // "Zone 2" lives in the item's label, not its detail — matching the
      // established convention every other weekday's ride item already
      // uses (e.g. weekday 2/4/6's `{ label: 'Zone 2 ride', detail: … }`).
      expect(
        items.some((i) => /Zone 2/.test(i.label) || /Zone 2/.test(i.detail ?? '')),
        `training weekday ${weekday} has no Zone 2 ride item`,
      ).toBe(true)
    }
  })

  /**
   * Corrected against coach spec v2.11 §12, row 1 — the ride figure
   * seeded here was originally v2.7's 30 min (Wednesday reducible to 20
   * on a Yellow day); v2.11 collapsed the row to 20 min on all three
   * training days with nothing to reduce (§15 keeps it at the prescribed
   * 20 minutes regardless of readiness). Unlike "Zone 2", the actual
   * number lives in the item's `detail`, not its `label` — checked there
   * specifically, since a check against the wrong field would pass
   * whether the number were right or stale.
   */
  it('every training day\'s ride is 20 min, never the retired 30 min figure (§12)', () => {
    for (const weekday of mesocycle2Build.trainingWeekdays) {
      const items = mesocycle2Build.weekdayActivities?.[weekday as 1 | 3 | 5]?.items ?? []
      expect(
        items.some((i) => /20 min/.test(i.detail ?? '')),
        `training weekday ${weekday} ride is not 20 min`,
      ).toBe(true)
      expect(
        items.some((i) => /30 min/.test(i.detail ?? '')),
        `training weekday ${weekday} still carries the retired 30 min figure`,
      ).toBe(false)
    }
  })

  /**
   * v2.10 removed the Yellow-day ride reduction — §15 now keeps the ride
   * at the prescribed 20 minutes regardless of readiness, so there is
   * nothing to branch on and the clause must not survive as dead text
   * anywhere in the program.
   */
  it('no weekday activity carries a Yellow-day ride reduction — v2.10 retired it', () => {
    for (const activity of Object.values(mesocycle2Build.weekdayActivities ?? {})) {
      for (const item of activity.items) {
        expect(item.detail ?? '').not.toMatch(/reduce to 20 min|Yellow day/)
      }
    }
  })

  it('Morning Activation is one round of six items (§13)', () => {
    expect(mesocycle2Build.morningActivation?.items).toHaveLength(6)
  })
})
