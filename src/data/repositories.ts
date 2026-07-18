import { db } from './db'
import type { CheckIn, Exercise, Program, UserSettings, Workout } from '@/domain/types'

/**
 * All reads/writes go through here — components never touch Dexie tables
 * directly. This is the seam where cloud sync will attach later.
 */
export const exerciseRepo = {
  getAll: (): Promise<Exercise[]> => db.exercises.orderBy('name').toArray(),
  getById: (id: string): Promise<Exercise | undefined> => db.exercises.get(id),
}

export const programRepo = {
  /** The program active on the given ISO date, or the next upcoming one. */
  async getActive(dateKey: string): Promise<Program | undefined> {
    const programs = await db.programs.orderBy('startDate').toArray()
    return (
      programs.find(
        (p) => p.startDate <= dateKey && (p.endDate === null || dateKey <= p.endDate),
      ) ?? programs.find((p) => p.startDate > dateKey)
    )
  },
}

export const workoutRepo = {
  getByDate: (dateKey: string): Promise<Workout | undefined> =>
    db.workouts.where('date').equals(dateKey).first(),

  countCompleted: (programId: string): Promise<number> =>
    db.workouts
      .filter((w) => w.programId === programId && w.completedAt !== null)
      .count(),

  /** The in-progress workout, if any — at most one exists by design. */
  getActive: async (): Promise<Workout | undefined> => {
    const open = await db.workouts.filter((w) => w.completedAt === null).toArray()
    return open.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
  },

  getCompleted: (): Promise<Workout[]> =>
    db.workouts.filter((w) => w.completedAt !== null).toArray(),

  put: (workout: Workout): Promise<string> => db.workouts.put(workout),

  remove: (id: string): Promise<void> => db.workouts.delete(id),
}

export const checkinRepo = {
  getByDate: (dateKey: string): Promise<CheckIn | undefined> =>
    db.checkins.where('date').equals(dateKey).first(),

  /** Most recent check-ins, newest first, for readiness trend analysis. */
  getRecent: (limit = 14): Promise<CheckIn[]> =>
    db.checkins.orderBy('date').reverse().limit(limit).toArray(),

  /** Full check-in history, oldest first — waist/weight trends need more than a fortnight. */
  getAll: (): Promise<CheckIn[]> => db.checkins.orderBy('date').toArray(),

  put: (checkIn: CheckIn): Promise<string> => db.checkins.put(checkIn),
}

export const settingsRepo = {
  get: (): Promise<UserSettings | undefined> => db.settings.get('user'),

  /** Persists that a given week's review has been shown — it never reappears after this. */
  async markWeeklyReviewSeen(weekStart: string): Promise<void> {
    const existing = await db.settings.get('user')
    if (!existing) return
    await db.settings.put({ ...existing, lastSeenWeeklyReviewWeekStart: weekStart })
  },
}
