import { describe, expect, it } from 'vitest'
import manifest from '@/data/generated/asset-manifest.json'
import { seedExercises } from '@/data/seed/exercises'
import { ASSET_ID_ALIASES, exerciseAsset } from './exerciseAsset'

/**
 * Coverage audit for the exercise-asset-naming-reconciliation batch. Every
 * Library exercise must resolve an asset OR appear in KNOWN_MISSING below
 * — an unlisted gap (or a new Library exercise nobody added asset coverage
 * for) fails the suite instead of silently rendering the empty tile
 * forever. When a later generation batch lands an asset for one of these,
 * remove it from this list in the same reviewed commit.
 *
 * Ids explicitly NOT aliased despite a name that looks close — the
 * available asset is the wrong equipment/unilaterality for the
 * prescription, and a wrong illustration is worse than none:
 * single-arm-db-press (no two-arm asset substitutes for a one-arm cue).
 */
const KNOWN_MISSING = new Set([
  'band-row',
  'band-pull-apart',
  'band-lateral-raise',
  'band-curl',
  'deficit-push-up',
  'db-floor-press',
  'single-leg-hip-thrust',
  'single-arm-db-press',
])

describe('exercise asset coverage', () => {
  it.each(seedExercises.map((e) => e.id))('%s resolves an asset or is in KNOWN_MISSING', (id) => {
    const resolved = exerciseAsset(id, 'thumbnail') !== null
    if (KNOWN_MISSING.has(id)) {
      expect(resolved, `${id} is listed KNOWN_MISSING but now resolves — remove it from the list`).toBe(
        false,
      )
    } else {
      expect(resolved, `${id} has no asset and isn't in KNOWN_MISSING — add coverage or list it`).toBe(
        true,
      )
    }
  })

  it('every Library exercise is accounted for by exactly one of: resolves, or KNOWN_MISSING', () => {
    const libraryIds = new Set(seedExercises.map((e) => e.id))
    for (const id of KNOWN_MISSING) {
      expect(libraryIds.has(id), `KNOWN_MISSING has a stale id: "${id}" isn't a Library exercise`).toBe(
        true,
      )
    }
  })

  it('the alias map only contains ids with no direct manifest entry (audit invariant)', () => {
    const manifestIds = new Set(Object.keys(manifest))
    for (const [seedId, assetId] of Object.entries(ASSET_ID_ALIASES)) {
      expect(
        manifestIds.has(seedId),
        `"${seedId}" now has a direct manifest entry — its alias to "${assetId}" is dead weight and must be deleted`,
      ).toBe(false)
    }
  })
})
