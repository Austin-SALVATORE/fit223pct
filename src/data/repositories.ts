import { db } from './db'
import type { Exercise, Program, Workout } from '@/domain/types'

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
