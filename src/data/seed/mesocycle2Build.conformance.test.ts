import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'
import { seedExercises } from './exercises'
import { suggestLadderProgression } from '@/domain/progression'
import { achievableLoads } from '@/domain/equipment'
// Fixture flip to NEW_PROFILE (plan §2 Phase 1's sequencing constraint) —
// landed together with the rung rewrite it depends on. Imported from the
// non-test fixtures module, not from equipment.test.ts directly — a
// test-importing-a-test doubled equipment.test.ts's entire describe/it
// tree as a side effect (12 Aug claim-verification finding).
import { NEW_PROFILE } from '@/domain/equipment.fixtures'
import type { LadderPrescription, LoggedSet, SetVariant } from '@/domain/types'

/**
 * docs/design/Mesocycle2Implementation.md §12.2 — "Spec conformance,
 * replacing what §9 retires." Reads the **seeded** Build program and
 * asserts it against the coach's 12 Aug 2026 equipment upgrade +
 * Mesocycle 2 migration (eight coach documents, resolved order map in
 * `Mesocycle-2-Exercise-Order-Amendment` +
 * `Mesocycle-2-Session-C-Authoritative-Amendment`, both archived
 * `~/.claude/agent-memory/program-spec-validator/spec-archive/`) — this
 * is what actually ships.
 *
 * `EXPECTED` below is transcribed independently from the coach docs, not
 * derived from `mesocycle2Build` itself — a circular check (comparing
 * the seed against a copy of the seed) would pass on a shared mistake.
 * This is the guard §2 of the original revision's own risk register
 * named and the equipment-upgrade plan repeats: "the transcription's
 * risk is arithmetic, not code."
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
  rehearsal?: { weightKg: number; reps: number }
}

const EXPECTED: Record<string, ExpectedPrescription[]> = {
  'mesocycle2-chest-back': [
    {
      exerciseId: 'incline-dumbbell-press',
      setPlan: [
        { weightKg: 12, reps: 12 },
        { weightKg: 14, reps: 10 },
        { weightKg: 16, reps: 8 },
        { weightKg: 18, reps: 6 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'bent-over-row',
      setPlan: [
        { weightKg: 17.75, reps: 12 },
        { weightKg: 21.75, reps: 10 },
        { weightKg: 25.75, reps: 8 },
        { weightKg: 29.75, reps: 6 },
      ],
      restSeconds: 120,
      rehearsal: { weightKg: 13.75, reps: 6 },
    },
    {
      exerciseId: 'dumbbell-bench-press',
      setPlan: [
        { weightKg: 12, reps: 12 },
        { weightKg: 14, reps: 10 },
        { weightKg: 16, reps: 8 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'single-arm-db-row',
      setPlan: [
        { weightKg: 14, reps: 12 },
        { weightKg: 16, reps: 10 },
        { weightKg: 18, reps: 8 },
        { weightKg: 20, reps: 6 },
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
      exerciseId: 'dumbbell-pullover',
      setPlan: [
        { weightKg: 10, reps: 15 },
        { weightKg: 12, reps: 12 },
        { weightKg: 14, reps: 10 },
      ],
      restSeconds: 75,
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
      exerciseId: 'romanian-deadlift',
      setPlan: [
        { weightKg: 23.75, reps: 12 },
        { weightKg: 27.75, reps: 10 },
        { weightKg: 31.75, reps: 8 },
        { weightKg: 35.75, reps: 6 },
      ],
      restSeconds: 120,
    },
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
      exerciseId: 'barbell-hip-thrust',
      setPlan: [
        { weightKg: 27.75, reps: 12 },
        { weightKg: 31.75, reps: 10 },
        { weightKg: 35.75, reps: 8 },
      ],
      restSeconds: 90,
      role: 'accessory',
    },
    {
      exerciseId: 'goblet-squat',
      setPlan: [
        { weightKg: 14, reps: 15 },
        { weightKg: 16, reps: 12 },
        { weightKg: 18, reps: 10 },
      ],
      restSeconds: 90,
      role: 'accessory',
    },
    {
      exerciseId: 'standing-calf-raise',
      setPlan: [
        { weightKg: 12, reps: 20 },
        { weightKg: 14, reps: 15 },
        { weightKg: 16, reps: 12 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'dumbbell-rowboat',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'russian-twist',
      setPlan: [
        { weightKg: 6, reps: 16 },
        { weightKg: 8, reps: 14 },
        { weightKg: 10, reps: 12 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'bicycle-crunch',
      setPlan: [
        { weightKg: null, reps: 16 },
        { weightKg: null, reps: 20 },
        { weightKg: null, reps: 24 },
      ],
      restSeconds: 45,
      role: 'accessory',
    },
    {
      exerciseId: 'plank',
      setPlan: [
        { weightKg: null, reps: 40 },
        { weightKg: null, reps: 50 },
        { weightKg: null, reps: 60 },
      ],
      restSeconds: 60,
      mode: 'seconds',
      role: 'accessory',
    },
  ],
  'mesocycle2-shoulders-arms': [
    {
      exerciseId: 'dumbbell-shoulder-press',
      setPlan: [
        { weightKg: 8, reps: 12 },
        { weightKg: 10, reps: 10 },
        { weightKg: 12, reps: 8 },
      ],
      restSeconds: 120,
    },
    {
      exerciseId: 'dumbbell-lateral-raise',
      setPlan: [
        { weightKg: 4, reps: 15 },
        { weightKg: 6, reps: 12 },
        { weightKg: 6, reps: 10 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'rear-delt-fly',
      setPlan: [
        { weightKg: 4, reps: 15 },
        { weightKg: 6, reps: 12 },
        { weightKg: 6, reps: 10 },
      ],
      restSeconds: 60,
      role: 'accessory',
    },
    {
      exerciseId: 'barbell-curl',
      setPlan: [
        { weightKg: 15.75, reps: 12 },
        { weightKg: 17.75, reps: 10 },
        { weightKg: 19.75, reps: 8 },
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
      exerciseId: 'hammer-curl',
      setPlan: [
        { weightKg: 8, reps: 12 },
        { weightKg: 10, reps: 10 },
        { weightKg: 12, reps: 8 },
      ],
      restSeconds: 75,
      role: 'accessory',
    },
  ],
}

/**
 * D7 — seven primaries as of the equipment upgrade. `bent-over-row` and
 * `romanian-deadlift` are Doc 2 §10's explicit "New primary benchmarks"
 * list; `barbell-hip-thrust`, `dumbbell-rowboat` and `barbell-curl` each
 * carry block-qualified "primary" language in their own coach document
 * but are absent from that program-level list, so they stay accessory
 * (D7/B.8's reading, same test applied to both).
 */
const PRIMARY_EXERCISE_IDS = new Set([
  'incline-dumbbell-press',
  'dumbbell-bench-press',
  'single-arm-db-row',
  'bent-over-row',
  'bulgarian-split-squat',
  'romanian-deadlift',
  'dumbbell-shoulder-press',
])

/**
 * The prescriptions the spec marks "use one dumbbell" — hard-coded with a
 * citation rather than derived from `maxWeightKg`, which would make this
 * test circular with Phase 2's own seed content (plan §6.1).
 */
const SINGLE_IMPLEMENT_EXERCISE_IDS = new Set([
  'dumbbell-pullover', // Session A, "Use one dumbbell"
  'single-arm-db-row', // Session A, "Use one dumbbell"
  'goblet-squat', // Session B, "Use one dumbbell"
  'overhead-triceps-extension', // Session C, "Use one dumbbell"
  'dumbbell-rowboat', // Session B, "Use one dumbbell" (doc 3 §1)
  'russian-twist', // Session B, "ONE dumbbell held with BOTH hands" (doc 4 §7)
])

/**
 * The four barbell prescriptions — total-weight convention (Amendment
 * A.2), routed to `achievableLoads(...).barbell`, never the dumbbell
 * lists. A per-side transcription slip on any of these fails the
 * buildability guard below instead of shipping quietly.
 */
const BARBELL_EXERCISE_IDS = new Set(['bent-over-row', 'romanian-deadlift', 'barbell-hip-thrust', 'barbell-curl'])

describe('mesocycle2Build — spec conformance (12 Aug 2026 equipment upgrade + Mesocycle 2 migration)', () => {
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
          expect(ladder.rehearsal, `${session.id}/${expected.exerciseId} rehearsal`).toEqual(expected.rehearsal)
        })
      }
    })
  }

  /**
   * Replaces the old numeric ceiling guard (plan §6.1) — a cap only
   * catches "too heavy"; this catches "unbuildable", which is the
   * failure mode the spec actually names ("do not assume integer
   * dumbbell weights", "do not silently round"). The lists are imported
   * from `equipment.fixtures.ts`, the same fixture `equipment.test.ts`'s
   * own assertions rest on, not re-transcribed here, so the two can
   * never silently diverge. Barbell exercise ids route to the
   * total-weight `barbell` list (D1) —
   * a per-side transcription slip on a barbell exercise fails here
   * rather than shipping quietly (A.2).
   */
  it('every loaded rung is a member of the appropriate verified achievable-load list (§2)', () => {
    const { bilateral, singleImplement, barbell } = achievableLoads(NEW_PROFILE)
    const bilateralSet = new Set(bilateral)
    const singleSet = new Set(singleImplement)
    const barbellSet = new Set(barbell)
    const unbuildable: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        if (item.setPlan === undefined) continue
        const ladder = item as LadderPrescription
        const list = BARBELL_EXERCISE_IDS.has(item.exerciseId)
          ? barbellSet
          : SINGLE_IMPLEMENT_EXERCISE_IDS.has(item.exerciseId)
            ? singleSet
            : bilateralSet
        for (const rung of ladder.setPlan) {
          if (rung.weightKg === null) continue
          if (!list.has(rung.weightKg)) {
            unbuildable.push(`${session.id}/${item.exerciseId}: ${rung.weightKg} kg`)
          }
        }
        if (ladder.rehearsal !== undefined && !list.has(ladder.rehearsal.weightKg)) {
          unbuildable.push(`${session.id}/${item.exerciseId}: rehearsal ${ladder.rehearsal.weightKg} kg`)
        }
      }
    }
    expect(unbuildable).toEqual([])
  })

  /**
   * A test written for this exact defect class and never seen red is
   * indistinguishable from a test that checks nothing (verification.md).
   * No prescription in this program may carry a retired-hardware weight
   * — every achievable load under the old two-bore profile ends in .2 or
   * .7; the new hardware's ladders are whole numbers (dumbbell/bilateral)
   * or end in .75 (barbell). A stray `.2`/`.7` surviving a find-replace
   * is therefore mechanically detectable without re-deriving the whole
   * achievable-load lists.
   */
  it('no prescription carries a retired-hardware (.2/.7) weight (R-proof)', () => {
    const stale: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        if (item.setPlan === undefined) continue
        const ladder = item as LadderPrescription
        for (const rung of ladder.setPlan) {
          if (rung.weightKg === null) continue
          const cents = Math.round(rung.weightKg * 100) % 100
          if (cents === 20 || cents === 70) stale.push(`${session.id}/${item.exerciseId}: ${rung.weightKg} kg`)
        }
        if (ladder.rehearsal !== undefined) {
          const cents = Math.round(ladder.rehearsal.weightKg * 100) % 100
          if (cents === 20 || cents === 70) stale.push(`${session.id}/${item.exerciseId}: rehearsal ${ladder.rehearsal.weightKg} kg`)
        }
      }
    }
    expect(stale).toEqual([])
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
   * §D8: a timed hold, not a rep Pyramid — 40s/50s/60s, never reps.
   * Retargeted from `side-plank` (12 Aug 2026 equipment upgrade —
   * `side-plank` left the active session; `plank` is its Session B Core
   * block replacement) to keep proving a timed hold can complete — the
   * only test in the suite that does. `plank` is not per-side, unlike
   * side-plank.
   */
  it('plank is a three-level timed hold, 40/50/60 sec, never reps', () => {
    const sessionB = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-legs-core')!
    const plank = sessionB.items.find((i) => i.exerciseId === 'plank') as LadderPrescription

    expect(plank.mode).toBe('seconds')
    expect(plank.perSide).toBe(false)
    expect(plank.setPlan).toEqual([
      { weightKg: null, reps: 40 },
      { weightKg: null, reps: 50 },
      { weightKg: null, reps: 60 },
    ])
  })

  /**
   * Found by an independent numeric read-back of this program against the
   * original 11 Aug spec, outside what the assertions above check: the
   * seeded prescription was a seconds-mode ladder, the repo's first, and
   * `suggestLadderProgression`'s completion gate used to read
   * `LoggedSet.reps` unconditionally — `SetScreen` logs a timed hold into
   * `seconds`, never `reps`, so the check was `0 >= 40` forever. Fixed in
   * progression.ts to read through `effortOf`, which already existed for
   * exactly this branch. Retargeted to `plank` (12 Aug 2026) to keep
   * proving the fix against real seeded data, not just a synthetic
   * fixture — the mechanism plank now exercises is unchanged from what
   * side-plank exercised before it.
   */
  it('the seeded plank actually reaches load-not-the-lever from a perfect seconds log', () => {
    const sessionB = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-legs-core')!
    const plank = sessionB.items.find((i) => i.exerciseId === 'plank') as LadderPrescription

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

  /**
   * D3/doc 7 — `bent-over-row` is the only prescription in the program
   * carrying a `rehearsal` field; doc 7 rules out the same treatment for
   * `barbell-curl` by name. This guard goes red the day someone
   * "helpfully" adds a second one.
   */
  it('exactly one prescription across all three sessions carries a rehearsal set', () => {
    const withRehearsal: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        if (item.setPlan === undefined) continue
        if ((item as LadderPrescription).rehearsal !== undefined) {
          withRehearsal.push(`${session.id}/${item.exerciseId}`)
        }
      }
    }
    expect(withRehearsal).toEqual(['mesocycle2-chest-back/bent-over-row'])
  })

  it('the seven primary movements are role: main; everything else in Sessions A-C is role: accessory (§4, D7)', () => {
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
   * the weighted M2 ladders carries an authored per-rung variant, but a
   * future coach edit could add one silently, and the failure would be
   * the app *erasing a coach-authored label* in favour of a derived one.
   * This is the guard: if a ceiling pyramid ever gains an authored
   * variant, the suite goes red and the question routes to the coach —
   * reconciling two variation systems on one pyramid is a coaching
   * decision, not an engineering one (D6's own rejected alternatives:
   * merging silently, or silently skipping, both hide the conflict
   * instead of surfacing it). Unchanged by the 12 Aug 2026 equipment
   * upgrade — still load-bearing, still asserts the same thing.
   *
   * **Not the same as** `dumbbell-lateral-raise`/`rear-delt-fly`
   * repeating 6 kg across their last two sets (C2/C3, doc 1 — "do NOT
   * force an 8 kg lateral raise"): 6 kg sits nowhere near
   * `BILATERAL_MAX_KG` (20), so neither ladder is "at ceiling" under this
   * test's own definition, and the repeat carries no `variantKey`
   * either way. The real conflict (§0.4/D5) only fires once the
   * equipment gate opens — flagged to the coach, not this guard's to
   * catch.
   *
   * "At ceiling" is asked of the same engine the load path uses
   * (`suggestLadderProgression`, D5) against a synthetic perfect log —
   * same construction as the plank conformance test above — rather than
   * re-deriving the ceiling condition by hand, so this test cannot
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
