import Dexie, { type EntityTable } from 'dexie'
import type {
  ActivityRecord,
  CheckIn,
  Exercise,
  Program,
  UserSettings,
  Workout,
} from '@/domain/types'

/**
 * Local-first store. Schema changes must always be additive Dexie
 * migrations — workout history is never dropped.
 */
export class Fit223Database extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  programs!: EntityTable<Program, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  checkins!: EntityTable<CheckIn, 'id'>
  settings!: EntityTable<UserSettings, 'id'>
  activityRecords!: EntityTable<ActivityRecord, 'id'>

  /** Name defaults to the real app database — overridable so migration tests can target an isolated one. */
  constructor(name = 'fit223pct') {
    super(name)
    this.version(1).stores({
      exercises: 'id, name',
      programs: 'id, phase, startDate',
      workouts: 'id, date, sessionTemplateId, completedAt',
      checkins: 'id, date',
      settings: 'id',
    })
    // Exercise.name moved to locale-keyed seed.json (see types.ts) — the
    // Library no longer sorts by a `name` index (client-side Intl.Collator
    // on the resolved display name instead), so the index itself is
    // dropped. A genuine schema change even though no data is lost: Dexie
    // diffs index declarations between versions, not object contents.
    this.version(2).stores({
      exercises: 'id',
    })
    // RIR purge (docs/PyramidProgression.md, M8 Phase 6, owner amendment
    // 22 Jul: "forget RIR, reset all data about RIR") — irreversible on
    // purpose. No index changes, so an empty stores() diff; the upgrade
    // callback strips the two fields current types no longer declare
    // (LoggedSet.rir, ExercisePrescription.targetRir) from every stored
    // workout's logged sets and prescription snapshots, and from every
    // stored program's session prescriptions (the seed program's own copy
    // self-heals on next seedDatabase() upsert regardless — this covers
    // an imported program, which does not get overwritten).
    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table('workouts')
          .toCollection()
          .modify((workout: LegacyWorkout) => {
            for (const exercise of workout.exercises) {
              delete exercise.prescription.targetRir
              for (const set of exercise.sets) {
                delete set.rir
              }
            }
          })
        await tx
          .table('programs')
          .toCollection()
          .modify((program: LegacyProgram) => {
            for (const session of program.sessions) {
              for (const item of session.items) {
                delete item.targetRir
              }
            }
          })
      })
    // M10 user profile: UserSettings gains birthDate / sex / targetWeightKg /
    // targetBodyFatPercent, and CheckIn gains bodyFatPercent. All are
    // non-indexed, so there is no index diff to declare — the empty stores()
    // records the schema generation rather than changing an index.
    //
    // **Deliberately no upgrade callback.** Additive and defaultless: a v3
    // record simply lacks these fields, and absent already means missing
    // (src/domain/profile.ts). Writing a default for any of them — a height,
    // a sex, a target — would manufacture a fact about the user that nothing
    // asked them to confirm, which is the precise defect the seeded
    // `heightCm: 180` already represents. Migrating one into existence in a
    // second place would make it harder to remove, not easier.
    //
    // Version allocation is tracked across plans because it has moved
    // several times: **M10 is v4**. A stale version number lands as a
    // broken migration rather than a typo, which is why it is written down
    // here too.
    this.version(4).stores({})
    // Day-plan rescheduling (docs/design/MissedDayDeferral.md, Phase 0):
    // an abandoned Workout Instance must close automatically without
    // consuming the Scheduled Session, which needs a third state beyond
    // completed/in-progress. `abandonedAt` is additive and non-indexed —
    // `closeStaleWorkouts` filters client-side (repositories.ts), the same
    // shape `getActive` already uses rather than an index query — so this
    // is an empty stores() diff with no upgrade callback, mirroring v4.
    // Absent means "not abandoned"; nothing is backfilled onto existing
    // rows.
    this.version(5).stores({})
    // Activity records (coach spec v2.11 §3) + session set customization
    // (§4, docs/design/SessionSetCustomization.md). The only index diff is
    // the new table; LoggedSet.custom / WorkoutExercise.skippedLevels /
    // WorkoutExercise.customSlots are non-indexed and ride along at zero
    // extra migration cost rather than each taking their own empty-diff
    // version — the precedent v4/v5 set (bump for the generation, even
    // with no index change) is deliberately not repeated a third time when
    // a real table already forces one.
    //
    // Nothing is backfilled: a pre-v6 record simply has no matching row in
    // `activityRecords`, which is what makes "no synthetic records for
    // past dates" (§3) structural rather than a rule to remember — there
    // is no upgrade callback that could write one.
    //
    // **M11 (nutrition) takes v7** — re-pointed from v6 (see git history):
    // Dexie applies upgrades in increasing version order, so reserving a
    // *lower* number for work that ships *later* would mean nutrition's
    // eventual v6 never runs on any install that has already passed v7.
    this.version(6).stores({ activityRecords: 'id, date' })
  }
}

/**
 * Shapes for the version-3 upgrade only — current types (types.ts)
 * deliberately no longer declare `rir`/`targetRir` at all, so the upgrade
 * callback needs its own view of the pre-migration data to delete from.
 */
interface LegacyWorkout extends Omit<Workout, 'exercises'> {
  exercises: {
    exerciseId: string
    prescription: Record<string, unknown> & { targetRir?: number }
    sets: (Record<string, unknown> & { rir?: number | null })[]
    substitutedForId?: string
  }[]
}
interface LegacyProgram extends Omit<Program, 'sessions'> {
  sessions: {
    id: string
    name: string
    focus: string
    items: (Record<string, unknown> & { targetRir?: number })[]
  }[]
}

export const db = new Fit223Database()
