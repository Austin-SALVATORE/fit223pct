import { describe, expect, it } from 'vitest'
import manifest from '@/data/generated/asset-manifest.json'
import { seedExercises } from '@/data/seed/exercises'
import { ASSET_ID_ALIASES, exerciseAsset } from './exerciseAsset'

/**
 * Coverage audit for the exercise-asset library. Every Library exercise
 * must resolve an asset OR appear in KNOWN_MISSING below — an unlisted
 * gap (or a new Library exercise nobody added asset coverage for) fails
 * the suite instead of silently rendering the empty tile forever. When a
 * later generation batch lands an asset for one of these, remove it from
 * this list in the same reviewed commit.
 *
 * Was empty as of d0b4fbb (57/57 Library exercises covered — dumbbell-rdl,
 * the last gap from the Home equipment-tier batch, landed with the
 * full-catalogue chroma-key regeneration). This stays in place as
 * infrastructure, not dead code: it refills the moment a Library
 * exercise ships before its art does, which is the normal order of
 * things going forward (new exercise first, asset generated after) —
 * not a regression to fix, just this list doing its job again.
 *
 * Refilled 12 Aug, now down to two of the seven equipment-upgrade
 * Library promotions that still have no art: bicycle-crunch and
 * mountain-climber (a mirrored-frame regeneration attempt audited
 * UNFIT — jarring head/anchor flip — placeholder stands, art revisited
 * later). `dumbbell-rowboat`, `russian-twist` and `plank` are not
 * listed — their art resolves (deploy-order constraint on
 * `russian-twist`: its Library entry must ship in the same deploy as,
 * or after, the regenerated art, since the id already resolves through
 * the manifest and this list can't catch a wrong illustration, only a
 * missing one). `barbell-curl` is not listed either — an independent
 * visual audit passed the committed `biceps-curl` art as FIT for the
 * new barbell curl; the asset directory and manifest key were renamed
 * (`git mv` + `update-manifest-dims.mjs`, frame/reference/thumbnail
 * bytes and hashes unchanged), a direct manifest hit under the Library
 * id with no alias (`ASSET_ID_ALIASES` is shrink-only by policy).
 * `bodyweight-hip-hinge` is not listed either as of the same day — a
 * genuine 3-frame generation batch audited FIT (zero residue, verified
 * hashes, no equipment, no squat/good-morning misread), landed as its
 * own asset directory + manifest row. Was empty again as of the
 * previous entry (hamstring-walkout/dumbbell-pullover landed 6 Aug and
 * were removed) — this docblock was stale, still describing that
 * refill.
 *
 * 22 Aug amendment promotion: `dumbbell-squeeze-press` had no art at
 * first, then landed its own audited batch the same day and was removed
 * from this list. `reverse-lunge` was never listed — its art already
 * resolved (manifest entry, 6 frames), landed ahead of this Library
 * promotion.
 *
 * Morning Posture Reset Phase 1 (27 Aug, content-only —
 * `~/.claude/plans/morning-posture-reset.md` §6/§8): `wall-angel` and
 * `ninety-ninety-breathing` were added here as new Library entries with no
 * art yet. Phase 6 landed `wall-angel`'s art the same day (3 attempts: true-
 * profile occlusion fix, then a range-of-motion fix, then a wall-contact
 * fix — clean on the third, removed from this list in the same commit as
 * its manifest entry, per release-choreography.md).
 *
 * `ninety-ninety-breathing` shipped later the same day, removed from this
 * list: 4 straight attempts (3 default-renderer, 1 on a `gpt-image-2`
 * renderer swap) produced an identical hip-thrust/glute-bridge defect
 * regardless of wording strength, until comparing that gpt-image-2 attempt's
 * two frames against each other found the actual cause — frame 1 alone
 * described a hand reaching to guide a shin into place, and that one action
 * overrode the flatness instruction no matter how forcefully it was stated.
 * Removing the action (not strengthening the wording again) passed clean on
 * the first retry. See `public/assets/exercises/ninety-ninety-breathing/
 * prompt.md` for the full account and the renderer caveat: this asset was
 * NOT produced by this pipeline's default route and re-running
 * `generate-via-sol.mjs` will not reproduce it.
 */
const KNOWN_MISSING = new Set<string>(['bicycle-crunch', 'mountain-climber'])

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

  it('every manifest entry carries a content hash per kind — reference, thumbnail, and each frame (cache-busting invariant)', () => {
    const entries = manifest as unknown as Record<
      string,
      { frameCount: number; referenceHash?: string; thumbnailHash?: string; frameHashes?: string[] }
    >
    for (const [id, entry] of Object.entries(entries)) {
      expect(entry.referenceHash, `${id} has no referenceHash`).toBeTruthy()
      expect(entry.thumbnailHash, `${id} has no thumbnailHash`).toBeTruthy()
      expect(entry.frameHashes?.length, `${id}'s frameHashes count doesn't match frameCount`).toBe(
        entry.frameCount,
      )
      entry.frameHashes?.forEach((hash, i) => expect(hash, `${id} frame ${i + 1} has no hash`).toBeTruthy())
    }
  })
})
