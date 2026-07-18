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

  constructor() {
    super('fit223pct')
    this.version(1).stores({
      exercises: 'id, name',
      programs: 'id, phase, startDate',
      workouts: 'id, date, sessionTemplateId, completedAt',
      checkins: 'id, date',
      settings: 'id',
    })
  }
}

export const db = new Fit223Database()
