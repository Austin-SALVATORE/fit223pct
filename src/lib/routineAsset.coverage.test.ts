import { describe, expect, it } from 'vitest'
import manifest from '@/data/generated/asset-manifest.json'
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
 * Empty as of the art batch landing: all eight steps resolve. It stays in
 * place as infrastructure, the same way the exercise coverage test's list
 * does — it refills the moment a routine step ships before its art, which
 * is the normal order (content first, art generated after), and that is
 * this list doing its job rather than a regression.
 */
const KNOWN_MISSING = new Set<string>()

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

  it('every routine step ships at least two frames — the entry pose and the held pose', () => {
    // Mechanical enforcement of the owner's two-illustration ruling
    // (docs/RecoveryRoutines.md ruling 5). Until now only review could hold
    // it: routineStepAsset falls back to the entry frame when 'held' is
    // missing, deliberately — assets never block a feature — so a
    // single-frame stretch degrades to a still image instead of failing,
    // and the player would look correct while the lead-in and the hold
    // showed the same picture.
    //
    // Near-identical frames still satisfy this and should:
    // half-kneeling-hip-flexor-stretch differs from its own setup by a
    // pelvic tilt that cannot be drawn in this style (owner, 29 Jul). It
    // ships two real frames, so it passes honestly rather than by
    // exemption — and an exemption list here would be the hole this test
    // exists to close.
    const entries = manifest as unknown as Record<string, { frameCount: number }>
    for (const stepId of stepIds) {
      expect(
        entries[stepId]?.frameCount ?? 0,
        `${stepId} must ship an entry pose and a held pose — the player switches ` +
          'between them when the hold starts, so one frame is not enough',
      ).toBeGreaterThanOrEqual(2)
    }
  })
})
