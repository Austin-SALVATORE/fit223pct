import type { Routine } from '@/domain/routine'

/**
 * The app's closed catalogue of guided recovery routines.
 *
 * **Unlike its siblings in this directory, this file is never written to
 * Dexie.** `exercises.ts` is upserted because stored `Workout`s reference
 * exercise ids and must still resolve after a program edit; nothing stored
 * references a routine, so a table here would buy a schema version, a
 * migration and a mutable copy of static content for no benefit — plus a
 * second surface for the seed-clobber bug class. It lives in `src/data/seed/`
 * so that `.claude/rules/program-content.md`, which scopes itself by path
 * glob to `src/data/seed/**`, covers it automatically: which stretches, how
 * long, in what order is the coach's call, not this repo's.
 *
 * Empty until the coach's stretch list and its art batch both exist
 * (milestone phase 5). Empty is the correct state, not a placeholder — no
 * seeded activity item carries a `routineId` yet, so nothing in the product
 * links here and no affordance appears anywhere. The vehicle is complete
 * and provable without the content.
 */
export const seedRoutines: readonly Routine[] = []

/** The routine with this id, or undefined — an unknown id degrades to plain text, never a dead link. */
export function routineById(routineId: string): Routine | undefined {
  return seedRoutines.find((routine) => routine.id === routineId)
}
