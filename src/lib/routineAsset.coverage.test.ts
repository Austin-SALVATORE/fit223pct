import { describe, expect, it } from 'vitest'
import { seedRoutines } from '@/data/seed/routines'
import { seedExercises } from '@/data/seed/exercises'
import { routineStepAsset } from './routineAsset'

/**
 * Coverage audit for routine-step art, mirroring
 * exerciseAsset.coverage.test.ts. Every step of every routine must resolve
 * both of its poses or appear in KNOWN_MISSING.
 *
 * It exists because the exercise coverage test asserts only Library ⊆
 * resolves; nothing asserts the reverse, so stretch entries in the manifest
 * would otherwise be entirely unaudited.
 *
 * **Every step is listed below, deliberately and temporarily.** The
 * catalogue landed ahead of its art (part 1 of phase 5), and no activity
 * item links to the routine yet, so nobody meets an illustration-less
 * stretch in the product.
 *
 * This list is self-clearing rather than a suppression: the assertion below
 * requires a KNOWN_MISSING id to *not* resolve, so the first stretch whose
 * art lands turns this file red and names itself. Part 2 cannot quietly ship
 * art while leaving a stale entry here — removing them is forced, not
 * remembered.
 */
const KNOWN_MISSING = new Set<string>([
  'wall-chest-stretch',
  'wall-calf-stretch',
  'standing-hamstring-stretch',
  'standing-quadriceps-stretch',
  'half-kneeling-hip-flexor-stretch',
  'figure-four-glute-stretch',
  'seated-butterfly-stretch',
  'childs-pose',
])

const stepIds = seedRoutines.flatMap((routine) => routine.steps.map((step) => step.id))

describe('routine step asset coverage', () => {
  it.each(stepIds.length > 0 ? stepIds : [])(
    '%s resolves both poses or is in KNOWN_MISSING',
    (stepId) => {
      const resolved = routineStepAsset(stepId, 'entry') !== null
      if (KNOWN_MISSING.has(stepId)) {
        expect(
          resolved,
          `${stepId} is listed KNOWN_MISSING but now resolves — remove it from the list`,
        ).toBe(false)
      } else {
        expect(
          resolved,
          `${stepId} has no art and isn't in KNOWN_MISSING — add coverage or list it`,
        ).toBe(true)
      }
    },
  )

  it('KNOWN_MISSING holds no stale ids', () => {
    for (const stepId of KNOWN_MISSING) {
      expect(
        stepIds.includes(stepId),
        `KNOWN_MISSING has a stale id: "${stepId}" isn't a step of any routine`,
      ).toBe(true)
    }
  })

  it('no routine step collides with a Library exercise id', () => {
    // Stretches are deliberately not Library exercises (docs/RecoveryRoutines
    // .md: "not a Program and not a Library exercise"). A shared id would
    // make one resolvable as the other, and would invite the promotion that
    // program-content.md prescribes for art-only ids — the exact leak the
    // Routine entity exists to prevent.
    const libraryIds = new Set(seedExercises.map((exercise) => exercise.id))
    for (const stepId of stepIds) {
      expect(
        libraryIds.has(stepId),
        `routine step "${stepId}" collides with a Library exercise id`,
      ).toBe(false)
    }
  })

  it('step ids are unique across the catalogue', () => {
    expect(stepIds.length).toBe(new Set(stepIds).size)
  })
})
