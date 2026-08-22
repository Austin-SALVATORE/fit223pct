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
 * Content is the coach's (docs/programs/recovery-stretch-v1-coach-spec.md):
 * which stretches, how long each is held, the order, and which are per-side
 * are all reproduced from that spec and are not this repo's to revise. The
 * ids are the exception — spelling follows the Library's convention (no
 * digits, no apostrophes), hence `figure-four-` and `childs-pose`.
 *
 * Reachable in the product: several weekday activity items in both seeded
 * programs (phase-1-home and mesocycle2Build) carry
 * `routineId: 'recovery-stretch-v1'`, and `ActivityItemList` resolves it to
 * a tappable link that `RoutinePlayer` reads from the route to drive guided
 * playback.
 *
 * Note on duration, because the spec's own arithmetic differs: the coach
 * computes one lead-in per *stretch* (8 × 8 s = 64 s). The player issues one
 * per *play*, and routinePlaylist expands the six per-side steps into two
 * plays each, so the real sequence is 14 plays — 112 s of lead-in and 547 s
 * total (9:07), not the stated 8:20. Per-play is the behaviour we want:
 * switching from the left side to the right genuinely needs the
 * repositioning time. The user-visible "8–10 min" card copy still holds.
 */
export const seedRoutines: readonly Routine[] = [
  {
    id: 'recovery-stretch-v1',
    // Ordered standing → kneeling → floor, deliberately: the spec minimises
    // transitions between standing and floor positions.
    steps: [
      { id: 'wall-chest-stretch', holdSeconds: 30, perSide: true },
      { id: 'wall-calf-stretch', holdSeconds: 30, perSide: true },
      { id: 'standing-hamstring-stretch', holdSeconds: 30, perSide: true },
      { id: 'standing-quadriceps-stretch', holdSeconds: 30, perSide: true },
      { id: 'half-kneeling-hip-flexor-stretch', holdSeconds: 30, perSide: true },
      { id: 'figure-four-glute-stretch', holdSeconds: 30, perSide: true },
      { id: 'seated-butterfly-stretch', holdSeconds: 30 },
      { id: 'childs-pose', holdSeconds: 45 },
    ],
  },
]

/** The routine with this id, or undefined — an unknown id degrades to plain text, never a dead link. */
export function routineById(routineId: string): Routine | undefined {
  return seedRoutines.find((routine) => routine.id === routineId)
}
