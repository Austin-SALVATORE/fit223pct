import { describe, expect, it } from 'vitest'
import manifest from '@/data/generated/asset-manifest.json'
import { exerciseAsset } from './exerciseAsset'

const gobletSquat = (manifest as Record<string, { frameCount: number; thumbnailFrame: number }>)[
  'goblet-squat'
]

describe('exerciseAsset', () => {
  it('resolves a reference for a known id, sized from referenceSize', () => {
    const result = exerciseAsset('goblet-squat', 'reference')
    expect(result).toEqual({
      url: '/assets/exercises/goblet-squat/reference.avif',
      width: 1916,
      height: 821,
    })
  })

  it('resolves a thumbnail sized from the manifest’s thumbnailFrame slot', () => {
    const result = exerciseAsset('goblet-squat', 'thumbnail')
    expect(result).toEqual({
      url: '/assets/exercises/goblet-squat/thumbnail.avif',
      width: 304,
      height: 821,
    })
  })

  it('resolves a 1-based, zero-padded frame', () => {
    expect(exerciseAsset('goblet-squat', 'frame', 1)).toEqual({
      url: '/assets/exercises/goblet-squat/frames/01.avif',
      width: 266,
      height: 821,
    })
    expect(exerciseAsset('goblet-squat', 'frame', gobletSquat.frameCount)).toEqual({
      url: `/assets/exercises/goblet-squat/frames/0${gobletSquat.frameCount}.avif`,
      width: 267,
      height: 821,
    })
  })

  it('returns null for a frame at or beyond frameCount, and for frame 0', () => {
    expect(exerciseAsset('goblet-squat', 'frame', gobletSquat.frameCount + 1)).toBeNull()
    expect(exerciseAsset('goblet-squat', 'frame', 0)).toBeNull()
    expect(exerciseAsset('goblet-squat', 'frame')).toBeNull()
  })

  it('returns null for every kind on an unknown id, never throws', () => {
    expect(exerciseAsset('not-a-real-exercise', 'reference')).toBeNull()
    expect(exerciseAsset('not-a-real-exercise', 'thumbnail')).toBeNull()
    expect(exerciseAsset('not-a-real-exercise', 'frame', 1)).toBeNull()
  })

  it('resolves the seed’s single-leg-rdl through the asset pipeline’s single-leg-romanian-deadlift alias', () => {
    const aliased = exerciseAsset('single-leg-rdl', 'thumbnail')
    const direct = exerciseAsset('single-leg-romanian-deadlift', 'thumbnail')
    expect(aliased).not.toBeNull()
    expect(aliased).toEqual(direct)
    expect(aliased?.url).toBe('/assets/exercises/single-leg-romanian-deadlift/thumbnail.avif')
  })

  it('carries the newer referenceSize/frameSizes manifest fields, not just frameCount/thumbnailFrame', () => {
    const reference = exerciseAsset('goblet-squat', 'reference')
    const frame = exerciseAsset('goblet-squat', 'frame', 1)
    expect(reference?.width).toBeGreaterThan(0)
    expect(reference?.height).toBeGreaterThan(0)
    // A frame's size is its own slot from frameSizes, not the reference's
    // full-strip size — proves the resolver reads per-frame dims, not a
    // single shared size.
    expect(frame?.width).not.toBe(reference?.width)
  })
})
