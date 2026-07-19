import { describe, expect, it, vi } from 'vitest'

/**
 * Reproduces the production incident directly: resolver code deployed
 * against a manifest that still had the pre-referenceSize/frameSizes
 * schema (frameCount/thumbnailFrame only). entry.frameSizes was
 * `undefined`, and indexing it crashed the exercise detail page. This
 * mocks that exact old-schema shape — the real manifest (see
 * assetManifest.test.ts) should never look like this, but the resolver
 * must survive it if it ever does again.
 */
vi.mock('@/data/generated/asset-manifest.json', () => ({
  default: {
    'old-schema-exercise': { frameCount: 3, thumbnailFrame: 2 },
  },
}))

const { exerciseAsset } = await import('./exerciseAsset')

describe('exerciseAsset — stale manifest schema', () => {
  it('returns null, never throws, for reference/thumbnail/frame with no dims fields', () => {
    expect(() => exerciseAsset('old-schema-exercise', 'reference')).not.toThrow()
    expect(() => exerciseAsset('old-schema-exercise', 'thumbnail')).not.toThrow()
    expect(() => exerciseAsset('old-schema-exercise', 'frame', 1)).not.toThrow()

    expect(exerciseAsset('old-schema-exercise', 'reference')).toBeNull()
    expect(exerciseAsset('old-schema-exercise', 'thumbnail')).toBeNull()
    expect(exerciseAsset('old-schema-exercise', 'frame', 1)).toBeNull()
  })
})
