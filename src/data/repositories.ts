import { db } from './db'
import type {
  ActivityRecord,
  CheckIn,
  DistributiveOmit,
  Exercise,
  Program,
  UserSettings,
  Workout,
} from '@/domain/types'

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

  /**
   * The in-progress workout, if any — at most one exists by design.
   * Excludes anything `closeStaleWorkouts` has closed: an abandoned
   * workout keeps `completedAt === null` (closing it must never look like
   * finishing it — see `abandonedAt`'s doc on `Workout`), so this filter
   * is what actually stops a days-old session from hijacking Today.
   */
  getActive: async (): Promise<Workout | undefined> => {
    const open = await db.workouts.filter((w) => w.completedAt === null && !w.abandonedAt).toArray()
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

  /**
   * Closes every in-progress workout dated strictly before today —
   * calendar-accurate history, per the coach's ruling that an abandoned
   * session must stop hijacking Today without consuming the Scheduled
   * Session it was for (docs/design/MissedDayDeferral.md).
   *
   * Sets `abandonedAt` only; `completedAt` stays `null` on purpose. Every
   * completion count in the app reads `completedAt`, and closing a session
   * is not finishing it — setting `completedAt` here would silently
   * advance the plan pointer, which is exactly what the ruling forbids.
   *
   * **Same-day in-progress workouts are never touched** — `date < todayKey`
   * is strict, so resuming a session across a lunch break still works.
   *
   * Idempotent and safe to call on every boot, the same shape as
   * `seedDatabase` (architecture.md) — a workout already closed has
   * `abandonedAt` set and is excluded from the next call's own filter.
   */
  async closeStaleWorkouts(todayKey: string): Promise<void> {
    const stale = await db.workouts
      .filter((w) => w.completedAt === null && !w.abandonedAt && w.date < todayKey)
      .toArray()
    if (stale.length === 0) return
    const abandonedAt = new Date().toISOString()
    await db.transaction('rw', db.workouts, async () => {
      for (const workout of stale) {
        await db.workouts.put({ ...workout, abandonedAt })
      }
    })
  },
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

  /**
   * Merges fields into the given day's check-in, creating the row if absent.
   *
   * **Transactional read-modify-write, not read-then-put** — the same reason
   * `workoutRepo.mutateActive` exists. A card that builds the next row from a
   * React prop reads whatever the last `useLiveQuery` frame gave it, so two
   * writes landing inside one frame both start from the same snapshot and the
   * second silently drops the first's field. That was reachable from one card
   * by adjusting two steppers quickly; it became reachable from two surfaces
   * once measurements were enterable from Settings as well as Today.
   *
   * The blank row lives here rather than in each caller, so a new nullable
   * `CheckIn` column cannot be forgotten by one surface and written by
   * another — which is how two rows for the same concept start to differ.
   */
  async mergeByDate(dateKey: string, patch: Partial<Omit<CheckIn, 'id' | 'date'>>): Promise<void> {
    await db.transaction('rw', db.checkins, async () => {
      // Read inside the transaction's scope so it serialises against a
      // sibling call's write rather than racing it.
      const existing = await db.checkins.where('date').equals(dateKey).first()
      const base: CheckIn = existing ?? {
        id: `checkin-${dateKey}`,
        date: dateKey,
        sleep: null,
        energy: null,
        soreness: null,
        stress: null,
        motivation: null,
        weightKg: null,
        waistCm: null,
        bodyFatPercent: null,
      }
      await db.checkins.put({ ...base, ...patch })
    })
  },
}

export const activityRecordRepo = {
  /**
   * Every recorded activity for a date — at most one per kind, since the
   * id is deterministic. Independence from `Workout`/`CheckIn` is by
   * construction (types.ts's `ActivityRecord` doc): nothing here can
   * touch either of those tables.
   */
  getByDate: (dateKey: string): Promise<ActivityRecord[]> =>
    db.activityRecords.where('date').equals(dateKey).toArray(),

  /** Every activity record, unordered — the full-data-export source. */
  getAll: (): Promise<ActivityRecord[]> => db.activityRecords.toArray(),

  /**
   * Upsert, keyed by `${date}-${kind}` — built here rather than by the
   * caller, so the id format can't drift between call sites. Deterministic
   * on purpose: saving twice for the same day edits the same row instead
   * of creating a duplicate (spec §3: "remain editable for the same
   * scheduled day"), and a duplicate for one day is unrepresentable.
   */
  put: (record: DistributiveOmit<ActivityRecord, 'id'>): Promise<string> => {
    const withId = { ...record, id: `${record.date}-${record.kind}` } as ActivityRecord
    return db.activityRecords.put(withId)
  },
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
