import { db } from '../db'
import { seedExercises } from './exercises'
import { seedProgram, mesocycle2Build } from './program'

/**
 * Every seed program, upserted independently below — deliberately not
 * merged into one guard check. `mesocycle-2-build` has a distinct id from
 * `phase-1-home`, so it can never collide with an import that reuses the
 * Phase 1 id; each program's clobber guard must still be evaluated on its
 * own id; the guard is not a single "is anything imported?" toggle, so it
 * cannot inspect this array as a batch, or an imported program under any
 * one id would suppress seeding of every other one instead of only itself.
 */
export const seedPrograms: readonly [typeof seedProgram, typeof mesocycle2Build] = [seedProgram, mesocycle2Build]

/**
 * Idempotent first-run seeding. Library content is always upserted (it's
 * app content, not user data); user tables are never touched.
 *
 * Each seed program is upserted UNLESS a program already exists under
 * that program's own id with `origin: 'imported'` — otherwise this would
 * silently revert a coach-authored import that deliberately reuses a seed
 * program's id on every subsequent boot (docs/PyramidProgression.md's
 * seed-clobber guard). Refreshing an `origin: 'seed'` row (including the
 * no-existing-row first-run case) stays unconditional — that's how seed
 * content updates still reach installs. Applied per program inside the
 * loop, not once before it, so an imported program under one id cannot
 * suppress seeding of the others.
 */
export async function seedDatabase(): Promise<void> {
  await db.transaction('rw', [db.exercises, db.programs, db.settings], async () => {
    await db.exercises.bulkPut(seedExercises)

    for (const program of seedPrograms) {
      const existingProgram = await db.programs.get(program.id)
      if (existingProgram === undefined || existingProgram.origin !== 'imported') {
        await db.programs.put(program)
      }
    }

    const existing = await db.settings.get('user')
    if (!existing) {
      // No heightCm, and no birthDate/sex/targets either. Seeding a height
      // was inventing a fact about the user: 180 was never displayed and
      // never confirmed, and an energy baseline computed from it would be
      // wrong in a way nothing could detect. The profile surface asks; until
      // it does, absent means missing.
      await db.settings.put({
        id: 'user',
        name: 'Austin',
        weeklyGoal: 3,
        lastSeenWeeklyReviewWeekStart: null,
      })
    }
  })
}
