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
  }
}

export const db = new Fit223Database()
