import { db } from './db'
import type { CheckIn, Exercise, Program, UserSettings, Workout } from '@/domain/types'

/**
 * All reads/writes go through here — components never touch Dexie tables
 * directly. This is the seam where cloud sync will attach later.
 */
export const exerciseRepo = {
  /** Unsorted — display order is locale-aware (Intl.Collator on the resolved name), not index order. */
  getAll: (): Promise<Exercise[]> => db.exercises.toArray(),
  getById: (id: string): Promise<Exercise | undefined> => db.exercises.get(id),
}

export const programRepo = {
  /**
   * The program active on the given ISO date; the next upcoming one if
   * today falls before any program starts; otherwise the most recently
   * ended one, so a finished phase with no successor yet lined up still
   * resolves to a program (and to `resolveDayPlan`'s 'ended' state) rather
   * than reading as if no program had ever been set up.
   */
  async getActive(dateKey: string): Promise<Program | undefined> {
    const programs = await db.programs.orderBy('startDate').toArray()
    const current = programs.find(
      (p) => p.startDate <= dateKey && (p.endDate === null || dateKey <= p.endDate),
    )
    if (current) return current

    const upcoming = programs.find((p) => p.startDate > dateKey)
    if (upcoming) return upcoming

    return [...programs].reverse().find((p) => p.startDate <= dateKey)
  },

  /** Every program, chronological — phase navigation on the Plan page. */
  getAll: (): Promise<Program[]> => db.programs.orderBy('startDate').toArray(),

  getById: (id: string): Promise<Program | undefined> => db.programs.get(id),

  /** Upsert — import's write path. Never touches workouts. */
  put: (program: Program): Promise<string> => db.programs.put(program),
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

  /** Every workout, completed or not — the full-data-export source. */
  getAll: (): Promise<Workout[]> => db.workouts.orderBy('date').toArray(),

  put: (workout: Workout): Promise<string> => db.workouts.put(workout),

  /**
   * Read-modify-write the in-progress workout inside one transaction.
   *
   * A plain re-read is **not** enough, and this was measured rather than
   * assumed: two undos tapped inside the same `useLiveQuery` frame — a
   * double-tap under a second, which is exactly how someone removes two
   * sets — both observe 3 sets and both write 2, so one tap is silently
   * lost. Re-reading before the write loses it too; only the transaction
   * serialises them. Real hardware makes the window wider than the
   * fake-indexeddb measurement, not narrower.
   *
   * `update` returning null means "nothing to do" and skips the write.
   */
  async mutateActive(update: (workout: Workout) => Workout | null): Promise<void> {
    await db.transaction('rw', db.workouts, async () => {
      // Inside the transaction's scope, so this read is serialised with the
      // write below rather than racing a sibling call's read.
      const active = await workoutRepo.getActive()
      if (!active) return
      const next = update(active)
      if (next) await db.workouts.put(next)
    })
  },

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

  /** Patch-and-put — a no-op if seedDatabase's first-run record somehow doesn't exist yet. */
  async update(patch: Partial<Omit<UserSettings, 'id'>>): Promise<void> {
    const existing = await db.settings.get('user')
    if (!existing) return
    await db.settings.put({ ...existing, ...patch })
  },

  /** Persists that a given week's review has been shown — it never reappears after this. */
  markWeeklyReviewSeen(weekStart: string): Promise<void> {
    return settingsRepo.update({ lastSeenWeeklyReviewWeekStart: weekStart })
  },
}
