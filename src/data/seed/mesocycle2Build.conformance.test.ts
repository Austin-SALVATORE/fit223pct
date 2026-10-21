import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'
import { seedWarmups } from './warmups'
import { seedExercises } from './exercises'
import { carryForwardPrescription } from '@/domain/carryForward'
import { achievableLoads } from '@/domain/equipment'
// Fixture flip to NEW_PROFILE (plan §2 Phase 1's sequencing constraint) —
// landed together with the rung rewrite it depends on. Imported from the
// non-test fixtures module, not from equipment.test.ts directly — a
// test-importing-a-test doubled equipment.test.ts's entire describe/it
// tree as a side effect (12 Aug claim-verification finding).
import { NEW_PROFILE } from '@/domain/equipment.fixtures'
import type { LadderPrescription, LoggedSet, RepRangePrescription, SetVariant, WorkoutExercise } from '@/domain/types'

/**
 * docs/design/Mesocycle2Implementation.md §12.2 — "Spec conformance,
 * replacing what §9 retires." Reads the **seeded** Build program and
 * asserts it against the coach's 13 Aug 2026 Full Body Restructure (the
 * restructure itself, the Session C calf-raise ruling, and the
 * six-question follow-up bundle — three coach documents, archived
 * `~/.claude/agent-memory/program-spec-validator/spec-archive/*-2026-08-13.md`;
 * transcription plan `~/.claude/plans/m2-fullbody-restructure.md`) — this
 * is what actually ships.
 *
 * `EXPECTED` below is transcribed independently from the coach docs, not
 * derived from `mesocycle2Build` itself — a circular check (comparing
 * the seed against a copy of the seed) would pass on a shared mistake.
 * This is the guard the original 12 Aug revision's own risk register
 * named and every migration since repeats: "the transcription's risk is
 * arithmetic, not code."
 */

interface ExpectedRung {
  weightKg: number | null
  reps: number
  variantKey?: SetVariant
}

/** setPlan-bearing prescriptions — primary compound lifts and every ladder accessory. */
interface ExpectedLadderPrescription {
  exerciseId: string
  setPlan: ExpectedRung[]
  restSeconds: number
  perSide?: boolean
  mode?: 'reps' | 'seconds'
  role?: 'main' | 'accessory'
  rehearsal?: { weightKg: number; reps: number }
  /** 21 Oct optimization: present only on the changed-structure prescriptions (see G4). */
  revision?: { id: string; carryFrom: readonly (number | null)[] }
  warmupId?: string
  assistable?: true
}

/**
 * Rep-range prescriptions — `incline-push-up` as of the 13 Aug Full Body
 * Restructure is the first (§3.3 of the transcription plan; the row
 * assertion below used to cast every item to `LadderPrescription`
 * unconditionally, which this union replaces).
 *
 * Weight fields/`perSide` added by the 22 Aug amendment (first *loaded*
 * rep-ranges the seed carries — `incline-push-up`'s own fields are all
 * `null`/`false`, which the assertion below still exercises via the
 * `?? null`/`?? false` defaults): `dumbbell-squeeze-press` and
 * `reverse-lunge`, both bilateral-pair dumbbell prescriptions.
 */
interface ExpectedRepRangePrescription {
  exerciseId: string
  range: { min: number; max: number }
  sets: number
  restSeconds: number
  role?: 'main' | 'accessory'
  perSide?: boolean
  startWeightKg?: number | null
  maxWeightKg?: number | null
  weightStepKg?: number | null
  revision?: { id: string; carryFrom: readonly (number | null)[] }
  warmupId?: string
  assistable?: true
}

type ExpectedPrescription = ExpectedLadderPrescription | ExpectedRepRangePrescription

/**
 * The one structural-revision id, 21 Oct 2026 (`program.ts` docblock; plan
 * `~/.claude/plans/m2-optimization-revision-boundary.md`). Engineering naming,
 * not coach content. Shared by every marker: it is one structural change.
 */
const REVISION_ID = 'mesocycle-2-build@2026-10-21'
const rev = (carryFrom: (number | null)[]) => ({ id: REVISION_ID, carryFrom })

/**
 * Transcribed from the coach's arbitration of 21 Oct 2026
 * (`docs/programs/mesocycle-2-optimization-coach-arbitration-2026-10-21.md`,
 * Q1/Q5/Q6/Q8/Q9 and §3-§5 order columns) and the Phase 4 sheet
 * (`~/.claude/plans/m2-optimization-phase4-transcription-sheet.md` §1); the
 * six unchanged prescriptions are the 28 Aug 2026 Volume Amendment values.
 * Every number below traces to one of those two.
 */
const EXPECTED: Record<string, ExpectedPrescription[]> = {
  'mesocycle2-fullbody-squat': [
    {
      // Unchanged (Volume amendment 28 Aug 2026: fourth rung 20 kg × 6).
      exerciseId: 'goblet-squat',
      setPlan: [
        { weightKg: 14, reps: 12 },
        { weightKg: 16, reps: 10 },
        { weightKg: 18, reps: 8 },
        { weightKg: 20, reps: 6 },
      ],
      restSeconds: 90,
      role: 'accessory',
    },
    {
      // Unchanged (Volume amendment: fourth rung 16 kg × 6).
      exerciseId: 'incline-dumbbell-press',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
        { weightKg: 16, reps: 6 },
      ],
      restSeconds: 120,
    },
    {
      // Unchanged (Volume amendment: fourth rung 29.75 kg × 6, total load
      // including the bar).
      exerciseId: 'bent-over-row',
      setPlan: [
        { weightKg: 17.75, reps: 12 },
        { weightKg: 21.75, reps: 10 },
        { weightKg: 25.75, reps: 8 },
        { weightKg: 29.75, reps: 6 },
      ],
      restSeconds: 120,
    },
    {
      // 21 Oct optimization, ARB Q5 A: 2 × 5-8, bodyweight, 120 s. Opts in
      // to the per-set assistance control (dip assistance ruling, 21 Oct —
      // the only seed opt-in) and carries its own prep (ARB Q6 A).
      exerciseId: 'parallel-bar-dip',
      range: { min: 5, max: 8 },
      sets: 2,
      restSeconds: 120,
      role: 'accessory',
      warmupId: 'mesocycle2-parallel-bar-dip-prep-v1',
      assistable: true,
    },
    {
      // 21 Oct optimization, ARB Q1 A: four rungs -> three, keeping original
      // rungs 1-3 (4x15, 6x12, 6x10). The technique gate is unchanged.
      exerciseId: 'dumbbell-lateral-raise',
      setPlan: [
        { weightKg: 4, reps: 15 },
        { weightKg: 6, reps: 12 },
        { weightKg: 6, reps: 10 },
      ],
      restSeconds: 60,
      role: 'accessory',
      revision: rev([0, 1, 2]),
    },
    {
      // 21 Oct optimization, ARB Q1 A: "keep original rungs 2 and 3" -> 50 s
      // and 60 s; the athlete's logged rungs 2 and 3 seed them (carryFrom
      // [1, 2]).
      exerciseId: 'plank',
      setPlan: [
        { weightKg: null, reps: 50 },
        { weightKg: null, reps: 60 },
      ],
      restSeconds: 60,
      mode: 'seconds',
      role: 'accessory',
      revision: rev([1, 2]),
    },
  ],
  'mesocycle2-fullbody-hinge': [
    {
      // Unchanged: four rungs since the 12 Aug equipment upgrade.
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
      // Unchanged (Volume amendment: fourth rung 16 kg × 6).
      exerciseId: 'dumbbell-bench-press',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
        { weightKg: 16, reps: 6 },
      ],
      restSeconds: 120,
    },
    {
      // 21 Oct optimization, ARB Q1 B: four rungs -> three (10x12, 12x10,
      // 14x8), per side; stays a primary (role omitted -> main).
      exerciseId: 'single-arm-db-row',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
      ],
      restSeconds: 90,
      perSide: true,
      revision: rev([0, 1, 2]),
    },
    {
      // 21 Oct optimization, ARB Q1 B: four rungs -> three; technique gate
      // unchanged.
      exerciseId: 'rear-delt-fly',
      setPlan: [
        { weightKg: 4, reps: 15 },
        { weightKg: 6, reps: 12 },
        { weightKg: 6, reps: 10 },
      ],
      restSeconds: 60,
      role: 'accessory',
      revision: rev([0, 1, 2]),
    },
    {
      // 21 Oct optimization, ARB Q1 B / §4 "Move from C": three rungs
      // (16/20/24 total reps; not per side). Its history follows the
      // exercise id, not the session. Substitution list is Library-level and
      // empty (ARB Q9).
      exerciseId: 'bicycle-crunch',
      setPlan: [
        { weightKg: null, reps: 16 },
        { weightKg: null, reps: 20 },
        { weightKg: null, reps: 24 },
      ],
      restSeconds: 60,
      role: 'accessory',
      revision: rev([0, 1, 2]),
    },
  ],
  'mesocycle2-fullbody-hipext-shoulder': [
    {
      // Unchanged literal, moved to first (ARB §5; Q6: "the first working
      // exercise becomes Dumbbell Reverse Lunge"). 22 Aug amendment: two
      // dumbbells, per side; Volume amendment: 4 sets.
      exerciseId: 'reverse-lunge',
      range: { min: 8, max: 12 },
      sets: 4,
      restSeconds: 105,
      role: 'accessory',
      perSide: true,
      startWeightKg: 6,
      maxWeightKg: 20,
      weightStepKg: 2,
    },
    {
      // 21 Oct optimization, ARB Q1 C: four rungs -> three (11.75x12,
      // 13.75x10, 15.75x8). Role omitted -> main (a primary). Its empty-bar
      // ramp belongs to it (ARB Q6), not to the session warm-up.
      exerciseId: 'overhead-press',
      setPlan: [
        { weightKg: 11.75, reps: 12 },
        { weightKg: 13.75, reps: 10 },
        { weightKg: 15.75, reps: 8 },
      ],
      restSeconds: 120,
      revision: rev([0, 1, 2]),
      warmupId: 'mesocycle2-overhead-press-prep-v1',
    },
    {
      // 21 Oct optimization, ARB Q5 C: 3 × 8-12, bodyweight, 90 s.
      exerciseId: 'inverted-row',
      range: { min: 8, max: 12 },
      sets: 3,
      restSeconds: 90,
      role: 'accessory',
    },
    {
      // 21 Oct optimization, ARB Q1 C: "keep the first three working sets",
      // 3 × 10-15.
      exerciseId: 'incline-push-up',
      range: { min: 10, max: 15 },
      sets: 3,
      restSeconds: 60,
      role: 'accessory',
      revision: rev([0, 1, 2]),
    },
    {
      // 21 Oct optimization, ARB Q1 C: four rungs -> two (8x12, 10x10).
      exerciseId: 'hammer-curl',
      setPlan: [
        { weightKg: 8, reps: 12 },
        { weightKg: 10, reps: 10 },
      ],
      restSeconds: 75,
      role: 'accessory',
      revision: rev([0, 1]),
    },
    {
      // 21 Oct optimization, ARB Q5 C: 3 × 8-12, bodyweight, 75 s.
      exerciseId: 'supported-knee-raise',
      range: { min: 8, max: 12 },
      sets: 3,
      restSeconds: 75,
      role: 'accessory',
    },
  ],
}

/**
 * D7 — seven primaries. Unchanged by the 13 Aug Full Body Restructure
 * itself (six-question bundle Q5: role is not reclassified), but revised
 * the same evening by the Session C Shoulder Press Amendment:
 * `overhead-press` replaces `dumbbell-shoulder-press` in this set — role
 * travels with the slot on a replacement (shipped precedent `0dccd7d`),
 * not from the coach's block-qualified "primary … for Session C"
 * language, which alone would read accessory (same register as
 * `barbell-hip-thrust`/`barbell-curl`, both correctly excluded below).
 * `bent-over-row` and `romanian-deadlift` were Doc 2 §10's explicit "New
 * primary benchmarks" list (12 Aug); `barbell-hip-thrust`, `goblet-squat`
 * and `barbell-curl` each carry block-qualified "primary" language in
 * their own coach document but are absent from that program-level list,
 * so they stay accessory. `bulgarian-split-squat` is no longer seeded
 * (removed from the active program by the restructure) — its continued
 * Set membership is inert, not stale, since the role guard below iterates
 * present items only.
 */
const PRIMARY_EXERCISE_IDS = new Set([
  'incline-dumbbell-press',
  'dumbbell-bench-press',
  'single-arm-db-row',
  'bent-over-row',
  'bulgarian-split-squat',
  'romanian-deadlift',
  'overhead-press',
])

/**
 * The prescriptions the spec marks "use one dumbbell" — hard-coded with a
 * citation rather than derived from `maxWeightKg`, which would make this
 * test circular with Phase 2's own seed content (plan §6.1).
 * `dumbbell-rowboat` left the active program in the 13 Aug restructure;
 * `standing-calf-raise` joined this list the same day (Session C
 * calf-raise ruling: "Use one dumbbell").
 *
 * `dumbbell-pullover` and `standing-calf-raise` are no longer seeded (the
 * 22 Aug amendment replaced both in Session C) — their continued Set
 * membership is inert, not stale, same as `bulgarian-split-squat` in
 * `PRIMARY_EXERCISE_IDS` above: the buildability guard below iterates
 * present items only. Their replacements, `dumbbell-squeeze-press` and
 * `reverse-lunge`, do NOT join this set — both are coach-ruled bilateral
 * (two dumbbells), not single-implement (follow-up rulings #2/#3).
 */
const SINGLE_IMPLEMENT_EXERCISE_IDS = new Set([
  'goblet-squat', // Session A, "Use one dumbbell"
  'overhead-triceps-extension', // Session A, "Use one dumbbell, both hands"
  'single-arm-db-row', // Session B, "Use one dumbbell"
  'russian-twist', // Session B, "ONE dumbbell held with BOTH hands"
  'dumbbell-pullover', // Session C (retired 22 Aug), "Use one dumbbell"
  'standing-calf-raise', // Session C (retired 22 Aug), "Use one dumbbell" (calf-raise ruling, 13 Aug)
])

/**
 * The five barbell prescriptions — total-weight convention (Amendment
 * A.2), routed to `achievableLoads(...).barbell`, never the dumbbell
 * lists. A per-side transcription slip on any of these fails the
 * buildability guard below instead of shipping quietly. `overhead-press`
 * joined this set with the Session C Shoulder Press Amendment (13 Aug
 * evening) — omitting it is self-catching here (11.75/13.75/15.75 sit on
 * neither the bilateral nor single-implement list), unlike the calf-raise
 * case above where the guard was blind; see that negative control's own
 * comment on `mesocycle2-fullbody-hipext-shoulder/overhead-press`'s test
 * below for the failure mode this set membership actually guards
 * against: a per-side transcription slip (2/3/4), not omission.
 */
const BARBELL_EXERCISE_IDS = new Set([
  'bent-over-row',
  'romanian-deadlift',
  'barbell-hip-thrust',
  'barbell-curl',
  'overhead-press',
])

describe('mesocycle2Build — spec conformance (12 Aug 2026 equipment upgrade + Mesocycle 2 migration)', () => {
  it('trainingWeekdays and dates match spec §3', () => {
    expect(mesocycle2Build.trainingWeekdays).toEqual([1, 3, 5])
    expect(mesocycle2Build.startDate).toBe('2026-08-10')
    // endDate extended 6 Sep -> 31 Dec 2026 by owner ruling, 8 Oct 2026
    // (extension after China travel); same program id and prescriptions.
    expect(mesocycle2Build.endDate).toBe('2026-12-31')
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

          expect(actual!.restSeconds, `${session.id}/${expected.exerciseId} restSeconds`).toBe(
            expected.restSeconds,
          )
          expect(actual!.role, `${session.id}/${expected.exerciseId} role`).toBe(expected.role ?? 'main')
          // Absent in EXPECTED means absent in the seed: that is what keeps a
          // marker off the six unchanged prescriptions (a marker on an
          // unchanged exercise would drop its legitimate custom sets).
          expect(actual!.revision, `${session.id}/${expected.exerciseId} revision`).toEqual(expected.revision)
          expect(actual!.warmupId, `${session.id}/${expected.exerciseId} warmupId`).toBe(expected.warmupId)
          expect(actual!.assistable, `${session.id}/${expected.exerciseId} assistable`).toBe(expected.assistable)

          if ('setPlan' in expected) {
            const ladder = actual as LadderPrescription
            expect(ladder.setPlan, `${session.id}/${expected.exerciseId} setPlan`).toEqual(expected.setPlan)
            expect(ladder.perSide, `${session.id}/${expected.exerciseId} perSide`).toBe(expected.perSide ?? false)
            expect(ladder.mode, `${session.id}/${expected.exerciseId} mode`).toBe(expected.mode ?? 'reps')
            expect(ladder.rehearsal, `${session.id}/${expected.exerciseId} rehearsal`).toEqual(expected.rehearsal)
          } else {
            const repRange = actual as RepRangePrescription
            expect(repRange.range, `${session.id}/${expected.exerciseId} range`).toEqual(expected.range)
            expect(repRange.sets, `${session.id}/${expected.exerciseId} sets`).toBe(expected.sets)
            expect(repRange.perSide, `${session.id}/${expected.exerciseId} perSide`).toBe(
              expected.perSide ?? false,
            )
            expect(repRange.startWeightKg, `${session.id}/${expected.exerciseId} startWeightKg`).toBe(
              expected.startWeightKg ?? null,
            )
            expect(repRange.maxWeightKg, `${session.id}/${expected.exerciseId} maxWeightKg`).toBe(
              expected.maxWeightKg ?? null,
            )
            expect(repRange.weightStepKg, `${session.id}/${expected.exerciseId} weightStepKg`).toBe(
              expected.weightStepKg ?? null,
            )
            expect(
              repRange.setPlan,
              `${session.id}/${expected.exerciseId} setPlan should be undefined (rep-range)`,
            ).toBeUndefined()
          }
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
   *
   * Extended by the 22 Aug amendment to see loaded *rep-ranges* too — the
   * seed's first ones (`dumbbell-squeeze-press`, `reverse-lunge`), both
   * bilateral. Previously this guard skipped every rep-range prescription
   * outright (`item.setPlan === undefined` meant "nothing to check" when
   * every rep-range in the seed was bodyweight); that is no longer true,
   * so a loaded rep-range's `startWeightKg` is now checked the same way a
   * ladder rung is. `maxWeightKg`/`weightStepKg` are not independently
   * checked here — they gate the runtime Stepper (`SetScreen`), not
   * buildability, and are covered by the conformance rows above.
   */
  it('every loaded rung is a member of the appropriate verified achievable-load list (§2)', () => {
    const { bilateral, singleImplement, barbell } = achievableLoads(NEW_PROFILE)
    const bilateralSet = new Set(bilateral)
    const singleSet = new Set(singleImplement)
    const barbellSet = new Set(barbell)
    const unbuildable: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        const list = BARBELL_EXERCISE_IDS.has(item.exerciseId)
          ? barbellSet
          : SINGLE_IMPLEMENT_EXERCISE_IDS.has(item.exerciseId)
            ? singleSet
            : bilateralSet
        if (item.setPlan === undefined) {
          const repRange = item as RepRangePrescription
          if (repRange.startWeightKg !== null && !list.has(repRange.startWeightKg)) {
            unbuildable.push(`${session.id}/${item.exerciseId}: start ${repRange.startWeightKg} kg`)
          }
          continue
        }
        const ladder = item as LadderPrescription
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
        if (item.setPlan === undefined) {
          // 22 Aug amendment: loaded rep-ranges are checked the same way,
          // same reasoning as the buildability guard above.
          const repRange = item as RepRangePrescription
          if (repRange.startWeightKg !== null) {
            const cents = Math.round(repRange.startWeightKg * 100) % 100
            if (cents === 20 || cents === 70) {
              stale.push(`${session.id}/${item.exerciseId}: start ${repRange.startWeightKg} kg`)
            }
          }
          continue
        }
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
   * §D8: a timed hold, not a rep Pyramid — never reps. Cut from four levels
   * (40/50/60/70) to two (50/60) by the coach's arbitration of 21 Oct 2026
   * (Q1 A: "keep original rungs 2 and 3"). `plank` is not per-side.
   */
  it('plank is a two-level timed hold, 50/60 sec, never reps (ARB Q1)', () => {
    const sessionA = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-fullbody-squat')!
    const plank = sessionA.items.find((i) => i.exerciseId === 'plank') as LadderPrescription

    expect(plank.mode).toBe('seconds')
    expect(plank.perSide).toBe(false)
    expect(plank.setPlan).toEqual([
      { weightKg: null, reps: 50 },
      { weightKg: null, reps: 60 },
    ])
  })

  /**
   * Found by an independent numeric read-back of this program against the
   * original 11 Aug spec, outside what the assertions above check: the
   * seeded prescription was a seconds-mode ladder, the repo's first, and
   * `suggestLadderProgression`'s (deleted) completion gate used to read
   * `LoggedSet.reps` unconditionally — `SetScreen` logs a timed hold into
   * `seconds`, never `reps`, so the check was `0 >= 40` forever.
   *
   * **Re-grounded for carry-forward, 28 Aug 2026 (Phase 3,
   * `~/.claude/plans/progression-carry-forward.md`).** The old engine and
   * its `'load-not-the-lever'` classification are gone with
   * `progression.ts`, but the underlying hazard — seconds-mode effort must
   * be read from `seconds`, not `reps` — applies equally to carry-forward
   * (`carryForward.ts`'s `carriedRung`, already guarded and negative-
   * controlled in `carryForward.test.ts` against a synthetic fixture).
   * This test keeps that guard pointed at the **real seeded** `plank`,
   * which is what this file exists for — a synthetic fixture cannot catch
   * a transcription mistake in the actual program.
   */
  it('the seeded plank carries seconds, not reps, from a perfect timed log', () => {
    const sessionA = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-fullbody-squat')!
    const plank = sessionA.items.find((i) => i.exerciseId === 'plank') as LadderPrescription

    const perfectLog: LoggedSet[] = plank.setPlan.map((rung, setIndex) => ({
      setIndex,
      weightKg: null,
      reps: null,
      seconds: rung.reps,
      completedAt: '2026-08-10T09:00:00.000Z',
    }))
    const previous: WorkoutExercise = { exerciseId: plank.exerciseId, prescription: plank, sets: perfectLog }

    const carried = carryForwardPrescription(plank, previous) as LadderPrescription
    // If this read `reps` instead of `seconds`, every carried duration
    // would be 0, not the perfect log's own durations.
    expect(carried.setPlan.map((rung) => rung.reps)).toEqual(plank.setPlan.map((rung) => rung.reps))
  })

  /**
   * Six-question bundle Q3, 13 Aug 2026 — the mandatory `bent-over-row`
   * rehearsal set is dropped (docblock, `program.ts`): a ramp/rehearsal
   * set is now understood to attach to a session's *first* major
   * technical movement, which every session's own warm-up ramp already
   * enforces, so the concept is retired from the seed without removing
   * the field, its import schema, or its renderer (§3.6 of the
   * transcription plan). No seeded prescription carries one as of this
   * restructure — retitled from "exactly one … carries a rehearsal set"
   * to keep meaning something on its own: expecting `[]` alone would
   * also pass if the field stopped existing, so this guard is only
   * trustworthy alongside a negative control (add a `rehearsal` to any
   * prescription, confirm this goes red naming it, restore — run
   * manually, not encoded here).
   */
  it('no prescription carries a rehearsal set (Q3, 13 Aug — dropped)', () => {
    const withRehearsal: string[] = []
    for (const session of mesocycle2Build.sessions) {
      for (const item of session.items) {
        if (item.setPlan === undefined) continue
        if ((item as LadderPrescription).rehearsal !== undefined) {
          withRehearsal.push(`${session.id}/${item.exerciseId}`)
        }
      }
    }
    expect(withRehearsal).toEqual([])
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
   * 21 Oct 2026 optimization — ARB acceptance 1: exactly 19 / 17 / 18 working
   * sets per session. Literals, not derived from the seed.
   */
  it('Sessions A / B / C carry exactly 19 / 17 / 18 working sets (ARB acceptance 1)', () => {
    const totals = mesocycle2Build.sessions.map((session) => session.items.reduce((sum, item) => sum + item.sets, 0))
    expect(totals).toEqual([19, 17, 18])
  })

  /**
   * G4, the marker guard (plan §6). `BASELINE_F8B20CCD` is the M2 seed as it
   * stood at f8b20ccd, **typed as literal numbers on purpose**: if it were
   * derived from `mesocycle2Build` the guard would be circular and every
   * control would stay green. Read from `program.ts` at that commit and
   * confirmed against the plan (§1.3) and the draft (§1).
   */
  describe('G4: revision markers appear exactly where the structure changed', () => {
    type Rung = { weightKg: number | null; reps: number }
    const BASELINE_F8B20CCD: Record<string, { sets: number; setPlan?: Rung[] }> = {
      'goblet-squat': { sets: 4 },
      'incline-dumbbell-press': { sets: 4 },
      'bent-over-row': { sets: 4 },
      'romanian-deadlift': { sets: 4 },
      'dumbbell-bench-press': { sets: 4 },
      'reverse-lunge': { sets: 4 },
      'dumbbell-lateral-raise': {
        sets: 4,
        setPlan: [
          { weightKg: 4, reps: 15 },
          { weightKg: 6, reps: 12 },
          { weightKg: 6, reps: 10 },
          { weightKg: 6, reps: 8 },
        ],
      },
      plank: {
        sets: 4,
        setPlan: [
          { weightKg: null, reps: 40 },
          { weightKg: null, reps: 50 },
          { weightKg: null, reps: 60 },
          { weightKg: null, reps: 70 },
        ],
      },
      'single-arm-db-row': {
        sets: 4,
        setPlan: [
          { weightKg: 10, reps: 12 },
          { weightKg: 12, reps: 10 },
          { weightKg: 14, reps: 8 },
          { weightKg: 16, reps: 6 },
        ],
      },
      'rear-delt-fly': {
        sets: 4,
        setPlan: [
          { weightKg: 4, reps: 15 },
          { weightKg: 6, reps: 12 },
          { weightKg: 6, reps: 10 },
          { weightKg: 6, reps: 8 },
        ],
      },
      'bicycle-crunch': {
        sets: 4,
        setPlan: [
          { weightKg: null, reps: 16 },
          { weightKg: null, reps: 20 },
          { weightKg: null, reps: 24 },
          { weightKg: null, reps: 28 },
        ],
      },
      'overhead-press': {
        sets: 4,
        setPlan: [
          { weightKg: 11.75, reps: 12 },
          { weightKg: 13.75, reps: 10 },
          { weightKg: 15.75, reps: 8 },
          { weightKg: 17.75, reps: 6 },
        ],
      },
      'hammer-curl': {
        sets: 4,
        setPlan: [
          { weightKg: 8, reps: 12 },
          { weightKg: 10, reps: 10 },
          { weightKg: 12, reps: 8 },
          { weightKg: 14, reps: 6 },
        ],
      },
      'incline-push-up': { sets: 4 },
    }

    const items = mesocycle2Build.sessions.flatMap((session) => session.items.map((item) => ({ session, item })))

    it('(i) a prescription has a marker if and only if its set count differs from the baseline', () => {
      const wrong: string[] = []
      for (const { session, item } of items) {
        const baseline = BASELINE_F8B20CCD[item.exerciseId]
        if (baseline === undefined) continue
        const changed = item.sets !== baseline.sets
        if (changed !== (item.revision !== undefined)) {
          wrong.push(`${session.id}/${item.exerciseId}: sets ${item.sets} vs baseline ${baseline.sets}, revision ${item.revision ? 'present' : 'absent'}`)
        }
      }
      expect(wrong).toEqual([])
    })

    it('(ii) every marker maps one source per rung, with no null (ARB Q2: inherit), unique, below the old count, one shared id', () => {
      const markers = items.filter(({ item }) => item.revision !== undefined)
      expect(markers.length, 'no revision markers found — the guard is checking nothing').toBe(8)
      const ids = new Set<string>()
      for (const { session, item } of markers) {
        const label = `${session.id}/${item.exerciseId}`
        const { carryFrom, id } = item.revision!
        ids.add(id)
        expect(carryFrom.length, `${label}: carryFrom length`).toBe(item.sets)
        expect(carryFrom.every((c) => c !== null), `${label}: a null entry restates instead of inheriting`).toBe(true)
        expect(new Set(carryFrom).size, `${label}: duplicate sources`).toBe(carryFrom.length)
        for (const c of carryFrom) {
          expect(c as number, `${label}: source out of range`).toBeLessThan(BASELINE_F8B20CCD[item.exerciseId].sets)
        }
      }
      expect([...ids], 'one structural change, one id').toEqual([REVISION_ID])
    })

    it('(iii) acceptance 2: each kept rung is exactly the baseline rung its carryFrom names', () => {
      for (const { session, item } of items) {
        const baseline = BASELINE_F8B20CCD[item.exerciseId]
        if (item.revision === undefined || baseline?.setPlan === undefined || item.setPlan === undefined) continue
        item.setPlan.forEach((rung, i) => {
          expect(rung, `${session.id}/${item.exerciseId} rung ${i + 1}`).toEqual(baseline.setPlan![item.revision!.carryFrom[i] as number])
        })
      }
    })

    it('(iv) the new movements carry no marker (no history can exist under their ids)', () => {
      const unmarkedNew = items.filter(({ item }) => BASELINE_F8B20CCD[item.exerciseId] === undefined)
      expect(unmarkedNew.map(({ item }) => item.exerciseId).sort()).toEqual(['inverted-row', 'parallel-bar-dip', 'supported-knee-raise'])
      for (const { item } of unmarkedNew) expect(item.revision, item.exerciseId).toBeUndefined()
    })
  })

  /** The sibling of the rehearsal guard above: exactly these two carry an exercise-level warm-up (R2 is vacuous for a prescription whose pointer was deleted). */
  it('exactly overhead-press and parallel-bar-dip carry a warmupId', () => {
    const carriers = mesocycle2Build.sessions.flatMap((s) => s.items.filter((i) => i.warmupId !== undefined).map((i) => i.exerciseId))
    expect(carriers.sort()).toEqual(['overhead-press', 'parallel-bar-dip'])
  })

  it('only parallel-bar-dip is assistable (dip assistance ruling: specific to the dip)', () => {
    const carriers = mesocycle2Build.sessions.flatMap((s) => s.items.filter((i) => i.assistable !== undefined).map((i) => i.exerciseId))
    expect(carriers).toEqual(['parallel-bar-dip'])
  })

  it('Barbell Hip Thrust is absent from every item and every warm-up step (ARB acceptance 8)', () => {
    const inItems = mesocycle2Build.sessions.flatMap((s) => s.items.map((i) => i.exerciseId))
    expect(inItems).not.toContain('barbell-hip-thrust')
    const inWarmups = seedWarmups.flatMap((w) => w.steps).filter((st) => 'exerciseId' in st && st.exerciseId === 'barbell-hip-thrust')
    expect(inWarmups).toEqual([])
  })

  /**
   * §10 "Load-ceiling progression", D6 — **retired, 28 Aug 2026 (Phase 3,
   * `~/.claude/plans/progression-carry-forward.md`, coach's Q2 ruling)**.
   * This guarded a conflict between two *automatic* systems:
   * `withCeilingVariation` writing a derived tempo label onto every rung
   * of a ceiling pyramid, and a future coach-authored `variantKey` on the
   * same pyramid. The coach ruled the automatic pathway retired outright
   * — "RETIRE the automatic load-ceiling tempo ladder from progression...
   * normal → slow → slow-pause must not automatically occur merely
   * because the athlete reaches an equipment ceiling" — while explicitly
   * preserving authored tempo content: "Do not delete tempo
   * capability/content from the app if other content uses it. Delete/
   * bypass this automatic progression pathway only."
   *
   * `variationLadder.ts` (the automatic pathway) is deleted with it. The
   * conflict this test caught is now structurally impossible — nothing
   * derives or writes a `variantKey` at runtime any more, so there is
   * nothing left to erase a coach-authored one. Checked before deleting,
   * per the ruling's preservation clause: no prescription in this seed
   * currently carries an authored `variantKey` (`grep -rn variantKey
   * src/data/seed/*.ts` finds none outside this file's own — now removed
   * — machinery), so nothing was silently lost. `SetVariant`, `variantKey`
   * on `SetTarget`, and their rendering path (`SetScreen`/`RestScreen`,
   * `common:setVariant.*`) are all untouched and keep working for a
   * future authored variant.
   */
})
