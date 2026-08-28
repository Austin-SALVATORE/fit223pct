import { describe, expect, it } from 'vitest'
import { seedDailyRoutines, dailyRoutineById } from './dailyRoutines'
import { seedExercises } from './exercises'
import { seedProgram, mesocycle2Build } from './program'
import { MORNING_POSTURE_RESET_ID } from '@/domain/dailyRoutine'
import type { DailyRoutineStep } from '@/domain/dailyRoutine'

/**
 * Morning Posture Reset — Phase 2 conformance
 * (`~/.claude/plans/morning-posture-reset.md` §8's Phase 2, "Tests").
 *
 * `EXPECTED` is transcribed independently from the coach's FINAL V1
 * PRESCRIPTION section (doc 23, "Morning Posture Reset consolidated
 * rulings, all 11 questions", 27 Aug 2026), not derived from
 * `seedDailyRoutines` itself — the same non-circular pattern
 * `mesocycle2Build.conformance.test.ts` uses and states its own reason
 * for: comparing the seed against a copy of the seed would pass on a
 * shared transcription mistake.
 *
 * Wall Slide's `repsMax: 10` is settled at `2 × 8–10` — the coach's
 * follow-up ruling resolved doc 23's internal contradiction directly
 * ("Final prescription: Wall Slide 2 × 8–10 … Remove the provisional
 * marker. 2 × 8–10 governs.", `dailyRoutines.ts`'s own docblock). This
 * test pins the shipped value.
 */
const EXPECTED: DailyRoutineStep[] = [
  { kind: 'breathing', exerciseId: 'ninety-ninety-breathing', rounds: 2, breaths: 5 },
  { kind: 'movement', exerciseId: 'dead-bug', rounds: 2, reps: 6, perSide: true },
  { kind: 'movement', exerciseId: 'glute-bridge', rounds: 2, reps: 10, holdSecondsPerRep: 2 },
  { kind: 'movement', exerciseId: 'bird-dog', rounds: 2, reps: 6, perSide: true },
  { kind: 'movement', exerciseId: 'wall-slide', rounds: 2, reps: 8, repsMax: 10 },
]

describe('seedDailyRoutines — Morning Posture Reset catalogue conformance (doc 23, 27 Aug 2026)', () => {
  it('has exactly one routine, id === MORNING_POSTURE_RESET_ID', () => {
    expect(seedDailyRoutines.map((r) => r.id)).toEqual([MORNING_POSTURE_RESET_ID])
  })

  it('matches the FINAL V1 PRESCRIPTION exactly — five steps, in order', () => {
    const routine = dailyRoutineById(MORNING_POSTURE_RESET_ID)
    expect(routine, 'MORNING_POSTURE_RESET_ID does not resolve').toBeDefined()
    expect(routine!.steps).toEqual(EXPECTED)
  })

  it('an unknown id resolves to undefined, never throws', () => {
    expect(dailyRoutineById('not-a-real-routine')).toBeUndefined()
  })

  it('every exerciseId resolves to a real Library entry', () => {
    const libraryIds = new Set(seedExercises.map((e) => e.id))
    const unresolved = seedDailyRoutines
      .flatMap((routine) => routine.steps)
      .filter((step) => !libraryIds.has(step.exerciseId))
      .map((step) => step.exerciseId)
    expect(unresolved).toEqual([])
  })

  /**
   * The half-kneeling hip-flexor stretch (the routine's optional seventh
   * item under earlier documents) is out of v1 — doc 23 §8. Its removal
   * deleted the `hold` kind and the `optional` flag from the type
   * entirely (`domain/dailyRoutine.ts`), so this is a compile-time
   * guarantee already — this test is the runtime record of *why* seven
   * became six.
   *
   * Six then became five for a different reason: the coach ruled Wall
   * Angel out of v1 as redundant with Wall Slide — "Wall Slide is the
   * one to KEEP" — not omitted for scope like the hip-flexor stretch.
   * Wall Angel's Library entry, cues and art are untouched and stay;
   * only its place in this routine is gone.
   */
  it('carries exactly five steps — the hip-flexor stretch was never in v1, and Wall Angel has been removed as redundant with Wall Slide', () => {
    const routine = dailyRoutineById(MORNING_POSTURE_RESET_ID)!
    expect(routine.steps).toHaveLength(5)
  })
})

/**
 * Layer 3 — structural containment (plan §7.4). `MORNING_POSTURE_RESET_ID`
 * must not be reachable from either seeded program's own structure — it
 * is a module-level constant, never a program pointer (`dailyRoutine.ts`'s
 * "No pointer from `Program`" note). Needs nothing else to exist (no
 * `MorningSection`, no settings wiring), so it lands here in Phase 2.
 */
describe('Layer 3 — structural containment', () => {
  const programs = [seedProgram, mesocycle2Build]

  it('is not a member of any program rotation', () => {
    for (const program of programs) {
      expect(program.rotation, program.id).not.toContain(MORNING_POSTURE_RESET_ID)
    }
  })

  it('is not a value in any weekdaySessions map', () => {
    for (const program of programs) {
      const pinned = Object.values(program.weekdaySessions ?? {})
      expect(pinned, program.id).not.toContain(MORNING_POSTURE_RESET_ID)
    }
  })

  it('is not any session id', () => {
    for (const program of programs) {
      const sessionIds = program.sessions.map((session) => session.id)
      expect(sessionIds, program.id).not.toContain(MORNING_POSTURE_RESET_ID)
    }
  })

  it('is not any warmupId — no SessionTemplate gains a pointer to it', () => {
    for (const program of programs) {
      for (const session of program.sessions) {
        expect(session.warmupId, `${program.id}/${session.id}`).not.toBe(MORNING_POSTURE_RESET_ID)
      }
    }
  })
})
