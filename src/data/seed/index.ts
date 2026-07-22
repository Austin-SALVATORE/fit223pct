import { db } from '../db'
import { seedExercises } from './exercises'
import { seedProgram } from './program'

/**
 * Idempotent first-run seeding. Library content is always upserted (it's
 * app content, not user data); user tables are never touched.
 *
 * The seed program is upserted UNLESS a program already exists under the
 * seed's id with `origin: 'imported'` — otherwise this would silently
 * revert a coach-authored import that deliberately reuses `phase-1-home`'s
 * id on every subsequent boot (docs/PyramidProgression.md's seed-clobber
 * guard). Refreshing an `origin: 'seed'` row (including the no-existing-row
 * first-run case) stays unconditional — that's how seed content updates
 * still reach installs.
 */
export async function seedDatabase(): Promise<void> {
  await db.transaction('rw', [db.exercises, db.programs, db.settings], async () => {
    await db.exercises.bulkPut(seedExercises)

    const existingProgram = await db.programs.get(seedProgram.id)
    if (existingProgram === undefined || existingProgram.origin !== 'imported') {
      await db.programs.put(seedProgram)
    }

    const existing = await db.settings.get('user')
    if (!existing) {
      await db.settings.put({
        id: 'user',
        name: 'Austin',
        heightCm: 180,
        weeklyGoal: 3,
        lastSeenWeeklyReviewWeekStart: null,
      })
    }
  })
}
