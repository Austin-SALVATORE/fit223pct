import { describe, expect, it, vi } from 'vitest'

/**
 * Item 1 of the asset-naming-reconciliation batch: a direct manifest hit
 * under the Library id must win over an alias, so a later generation
 * batch landing an asset under the true Library id supersedes any legacy
 * alias immediately, with no code change. The real manifest and alias
 * map never actually overlap today (see exerciseAsset.coverage.test.ts's
 * audit invariant) — this mocks the transitional moment by adding a
 * direct manifest entry for `single-leg-rdl`, one of the *real* alias
 * map's own keys (it normally has no direct entry and resolves via its
 * `single-leg-romanian-deadlift` alias), to prove precedence against the
 * actual alias map, not a fake one.
 */
vi.mock('@/data/generated/asset-manifest.json', async () => {
  const actual = await vi.importActual<{ default: Record<string, unknown> }>(
    '@/data/generated/asset-manifest.json',
  )
  return {
    default: {
      ...actual.default,
      'single-leg-rdl': {
        frameCount: 1,
        thumbnailFrame: 1,
        referenceSize: [999, 999],
        frameSizes: [[999, 999]],
      },
    },
  }
})

const { exerciseAsset } = await import('./exerciseAsset')

describe('exerciseAsset — alias precedence', () => {
  it('prefers a direct manifest hit under the Library id over its own alias entry', () => {
    // single-leg-rdl is a real ASSET_ID_ALIASES key (-> single-leg-
    // romanian-deadlift) — now mocked with a direct manifest entry too.
    // The direct entry must win: its own url, its own [999,999] size.
    const result = exerciseAsset('single-leg-rdl', 'thumbnail')
    expect(result?.url).toBe('/assets/exercises/single-leg-rdl/thumbnail.avif')
    expect(result?.width).toBe(999)
  })
})
