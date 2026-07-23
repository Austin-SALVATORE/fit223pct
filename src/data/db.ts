import Dexie, { type EntityTable } from 'dexie'
import type {
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
