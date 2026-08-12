import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'
import { seedExercises } from './exercises'
import { suggestLadderProgression } from '@/domain/progression'
import { achievableLoads } from '@/domain/equipment'
// Still the retired two-bore profile in this phase — the fixture flip to
// NEW_PROFILE belongs to Phase 2, in the same commit as the rung
// rewrite (plan §2 Phase 1's sequencing constraint: flipping early makes
// every existing rung unbuildable against the new hardware).
import { RETIRED_PROFILE_2026_08_07 } from '@/domain/equipment.test'
import type { LadderPrescription, LoggedSet, SetVariant } from '@/domain/types'

/**
 * docs/design/Mesocycle2Implementation.md §12.2 — "Spec conformance,
 * replacing what §9 retires." Reads the **seeded** Build program and
 * asserts it against the coach's 11 Aug 2026 Build Prescription Revision
 * (plus the same-day "Six Validation Rulings" that answered the
 * validator's residuals) — this is what actually ships.
 *
 * `EXPECTED` below is transcribed independently from the coach spec, not
 * derived from `mesocycle2Build` itself — a circular check (comparing
 * the seed against a copy of the seed) would pass on a shared mistake.
 * This is the guard §2 of the revision's own risk register names: "the
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
        { weightKg: 11.2, reps: 12 },
        { weightKg: 13.2, reps: 10 },
        { weightKg: 15.2, reps: 8 },
        { weightKg: 15.2, reps: 6 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'dumbbell-bench-press',
      setPlan: [
        { weightKg: 11.2, reps: 12 },
        { weightKg: 13.2, reps: 10 },
        { weightKg: 15.2, reps: 8 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'dumbbell-fly',
      setPlan: [
        { weightKg: 5.2, reps: 15 },
        { weightKg: 5.7, reps: 12 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
    {
      exerciseId: 'dumbbell-pullover',
      setPlan: [
        { weightKg: 9.2, reps: 15 },
        { weightKg: 11.2, reps: 12 },
        { weightKg: 13.2, reps: 10 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
    {
      exerciseId: 'single-arm-db-row',
      setPlan: [
        { weightKg: 11.2, reps: 12 },
        { weightKg: 13.2, reps: 10 },
        { weightKg: 15.2, reps: 8 },
        { weightKg: 17.2, reps: 6 },
      ],
      restSeconds: 90,
      perSide: true,
    },
    {
      exerciseId: 'chest-supported-row',
      setPlan: [
        { weightKg: 9.2, reps: 15 },
        { weightKg: 10.7, reps: 12 },
        { weightKg: 11.2, reps: 10 },
      ],
      restSeconds: 90,
      role: 'accessory',
    },
    {
      exerciseId: 'incline-push-up',
      setPlan: [
        { weightKg: null, reps: 15 },
        { weightKg: null, reps: 12 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
  ],
  'mesocycle2-legs-core': [
    {
      exerciseId: 'bulgarian-split-squat',
      setPlan: [
        { weightKg: 7.2, reps: 12 },
        { weightKg: 9.2, reps: 10 },
        { weightKg: 11.2, reps: 8 },
      ],
      restSeconds: 120,
      perSide: true,
    },
    {
      exerciseId: 'dumbbell-rdl',
      setPlan: [
        { weightKg: 11.2, reps: 12 },
        { weightKg: 13.2, reps: 10 },
        { weightKg: 15.2, reps: 8 },
        { weightKg: 15.2, reps: 6 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'goblet-squat',
      setPlan: [
        { weightKg: 13.2, reps: 15 },
        { weightKg: 15.2, reps: 12 },
        { weightKg: 17.2, reps: 10 },
      ],
      restSeconds: 90,
      role: 'accessory',
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
        { weightKg: 11.2, reps: 20 },
        { weightKg: 13.2, reps: 15 },
        { weightKg: 15.2, reps: 12 },
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
      exerciseId: 'bird-dog',
      setPlan: [
        { weightKg: null, reps: 10, variantKey: 'normal' },
        { weightKg: null, reps: 8, variantKey: 'with-pause' },
      ],
      restSeconds: 60,
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
  'mesocycle2-shoulders-arms': [
    {
      exerciseId: 'dumbbell-shoulder-press',
      setPlan: [
        { weightKg: 7.2, reps: 12 },
        { weightKg: 9.2, reps: 10 },
        { weightKg: 11.2, reps: 8 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'dumbbell-lateral-raise',
      setPlan: [
        { weightKg: 3.7, reps: 15 },
        { weightKg: 5.2, reps: 12 },
        { weightKg: 5.7, reps: 10 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'rear-delt-fly',
      setPlan: [
        { weightKg: 3.7, reps: 15 },
        { weightKg: 5.2, reps: 12 },
        { weightKg: 5.7, reps: 10 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'dumbbell-curl',
      setPlan: [
        { weightKg: 7.2, reps: 12 },
        { weightKg: 8.2, reps: 10 },
        { weightKg: 9.2, reps: 8 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
    {
      exerciseId: 'hammer-curl',
      setPlan: [
        { weightKg: 7.2, reps: 12 },
        { weightKg: 8.2, reps: 10 },
        { weightKg: 9.2, reps: 8 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
    {
      exerciseId: 'overhead-triceps-extension',
      setPlan: [
        { weightKg: 9.2, reps: 12 },
        { weightKg: 11.2, reps: 10 },
        { weightKg: 13.2, reps: 8 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
  ],
}

const PRIMARY_EXERCISE_IDS = new Set([
  'incline-dumbbell-press',
  'dumbbell-bench-press',
  'single-arm-db-row',
  'bulgarian-split-squat',
  'dumbbell-rdl',
  'dumbbell-shoulder-press',
])

/**
 * The four prescriptions the spec marks "use one dumbbell" — hard-coded
 * with a citation rather than derived from `maxWeightKg`, which would
 * make this test circular with Phase 2's own seed content (plan §6.1).
 */
const SINGLE_IMPLEMENT_EXERCISE_IDS = new Set([
  'dumbbell-pullover', // Session A, "Use one dumbbell"
  'single-arm-db-row', // Session A, "Use one dumbbell"
  'goblet-squat', // Session B, "Use one dumbbell"
  'overhead-triceps-extension', // Session C, "Use one dumbbell"
])

describe('mesocycle2Build — spec conformance (11 Aug 2026 Build Prescription Revision)', () => {
  it('trainingWeekdays and dates match spec §3', () => {
    expect(mesocycle2Build.trainingWeekdays).toEqual([1, 3, 5])
    expect(mesocycle2Build.startDate).toBe('2026-08-10')
    expect(mesocycle2Build.endDate).toBe('2026-09-06')
    expect(mesocycle2Build.schedulingMode).toBe('rotation')
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

  /**
   * Replaces the old numeric "no weightKg exceeds 15 kg" ceiling guard
   * (plan §6.1) — a cap only catches "too heavy"; this catches
   * "unbuildable", which is the failure mode the spec actually names
   * ("do not assume integer dumbbell weights", "do not silently round").
   * The lists are imported from the same fixture equipment.test.ts's own
   * assertions rest on (docs/EquipmentProfile.md), not re-transcribed
   * here, so the two can never silently diverge.
   */
  it('every loaded rung is a member of the appropriate verified achievable-load list (§2)', () => {
    const { bilateral, singleImplement } = achievableLoads(RETIRED_PROFILE_2026_08_07)
    const bilateralSet = new Set(bilateral)
    const singleSet = new Set(singleImplement)
    const unbuildable: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        if (item.setPlan === undefined) continue
        const ladder = item as LadderPrescription
        const list = SINGLE_IMPLEMENT_EXERCISE_IDS.has(item.exerciseId) ? singleSet : bilateralSet
        for (const rung of ladder.setPlan) {
          if (rung.weightKg === null) continue
          if (!list.has(rung.weightKg)) {
            unbuildable.push(`${session.id}/${item.exerciseId}: ${rung.weightKg} kg`)
          }
        }
      }
    }
    expect(unbuildable).toEqual([])
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

  /** §8/§10: a timed hold, not a rep Pyramid — 40s then 30s, never reps. Session B since the 11 Aug revision moved side-plank out of Session C. */
  it('side plank is a two-level timed hold, 40 sec then 30 sec, never reps', () => {
    const sessionB = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-legs-core')!
    const plank = sessionB.items.find((i) => i.exerciseId === 'side-plank') as LadderPrescription

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
   * synthetic fixture. Unaffected by the 11 Aug revision — side-plank's
   * prescription content is unchanged, only its session moved.
   */
  it('the seeded side plank actually reaches load-not-the-lever from a perfect seconds log', () => {
    const sessionB = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-legs-core')!
    const plank = sessionB.items.find((i) => i.exerciseId === 'side-plank') as LadderPrescription

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

  it('the six primary movements are role: main; everything else in Sessions A-C is role: accessory (§4)', () => {
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
   * 20 minutes regardless of readiness). Unaffected by the 11 Aug
   * revision. Unlike "Zone 2", the actual number lives in the item's
   * `detail`, not its `label` — checked there specifically, since a
   * check against the wrong field would pass whether the number were
   * right or stale.
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

  /**
   * Owner ruling (11 Aug 2026): morning activation moved from the
   * §13 six-item mobility round to Apple Fitness+, with the owner
   * choosing the program themselves — a single item, not a routine to
   * enumerate.
   */
  it('Morning Activation is a single Apple Fitness+ item (11 Aug ruling)', () => {
    expect(mesocycle2Build.morningActivation?.items).toHaveLength(1)
    expect(mesocycle2Build.morningActivation?.items[0]?.label).toBe('Apple Fitness+')
  })

  /**
   * §10 "Load-ceiling progression", `~/.claude/plans/variation-ladder.md`
   * D6 — the variation ladder writes its derived tempo label onto every
   * rung of a ceiling pyramid at runtime (`withCeilingVariation`). None of
   * the weighted M2 ladders carries an authored per-rung variant (the 11
   * Aug revision keeps that true — A1/incline-dumbbell-press and
   * B2/dumbbell-rdl both repeat their top rung's weight but carry no
   * variantKey, per lead ruling D1), but a future coach edit could add
   * one silently, and the failure would be the app *erasing a
   * coach-authored label* in favour of a derived one. This is the guard:
   * if a ceiling pyramid ever gains an authored variant, the suite goes
   * red and the question routes to the coach — reconciling two variation
   * systems on one pyramid is a coaching decision, not an engineering one
   * (D6's own rejected alternatives: merging silently, or silently
   * skipping, both hide the conflict instead of surfacing it).
   *
   * "At ceiling" is asked of the same engine the load path uses
   * (`suggestLadderProgression`, D5) against a synthetic perfect log —
   * same construction as the side-plank conformance test above — rather
   * than re-deriving the ceiling condition by hand, so this test cannot
   * silently drift from what the engine actually decides.
   */
  it('no at-ceiling pyramid carries an authored per-rung variant (D6)', () => {
    const conflicts: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        if (item.setPlan === undefined) continue
        const ladder = item as LadderPrescription
        const perfectLog: LoggedSet[] = ladder.setPlan.map((rung, setIndex) => ({
          setIndex,
          weightKg: rung.weightKg,
          reps: ladder.mode === 'seconds' ? null : rung.reps,
          seconds: ladder.mode === 'seconds' ? rung.reps : null,
          completedAt: '2026-08-10T09:00:00.000Z',
        }))
        const atCeiling = suggestLadderProgression(ladder, perfectLog).type === 'at-equipment-max'
        if (!atCeiling) continue
        const authored = ladder.setPlan.some((rung) => rung.variantKey !== undefined)
        if (authored) conflicts.push(`${session.id}/${ladder.exerciseId}`)
      }
    }
    expect(conflicts).toEqual([])
  })
})
