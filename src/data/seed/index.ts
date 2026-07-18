import { db } from '../db'
import { seedExercises } from './exercises'
import { seedProgram } from './program'

/**
 * Idempotent first-run seeding. Library content and program templates are
 * upserted (they are app content, not user data); user tables are never touched.
 */
export async function seedDatabase(): Promise<void> {
  await db.transaction('rw', [db.exercises, db.programs, db.settings], async () => {
    await db.exercises.bulkPut(seedExercises)
    await db.programs.put(seedProgram)

    const existing = await db.settings.get('user')
    if (!existing) {
      await db.settings.put({
        id: 'user',
        name: 'Austin',
        heightCm: 180,
        weeklyGoal: 3,
      })
    }
  })
}
