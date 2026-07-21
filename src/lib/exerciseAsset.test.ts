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

  it.each([
    ['single-leg-rdl', 'single-leg-romanian-deadlift'],
    ['barbell-squat', 'barbell-back-squat'],
    ['bent-over-row', 'barbell-row'],
    ['dumbbell-curl', 'dumbbell-biceps-curl'],
    ['dumbbell-lateral-raise', 'lateral-raise'],
  ])('resolves the seed’s %s through the asset pipeline’s %s alias', (seedId, assetId) => {
    const aliased = exerciseAsset(seedId, 'thumbnail')
    const direct = exerciseAsset(assetId, 'thumbnail')
    expect(aliased).not.toBeNull()
    expect(aliased).toEqual(direct)
    expect(aliased?.url).toBe(`/assets/exercises/${assetId}/thumbnail.avif`)
  })

  // barbell-hip-thrust, single-arm-db-row, and tempo-bodyweight-squat were
  // aliases until 7d764c1 landed direct Library-id assets for all three
  // (retiring the aliases per the shrinking-only policy). hip-thrust in
  // particular used to BE the barbell-hip-thrust art under the wrong id —
  // this is the regression guard for that miss-teach: the plain dumbbell
  // hip-thrust and the barbell variant must never resolve to the same art.
  it.each(['barbell-hip-thrust', 'single-arm-db-row', 'tempo-bodyweight-squat'])(
    '%s now resolves directly under its own Library id, no alias needed',
    (id) => {
      const result = exerciseAsset(id, 'thumbnail')
      expect(result).not.toBeNull()
      expect(result?.url).toBe(`/assets/exercises/${id}/thumbnail.avif`)
    },
  )

  it('hip-thrust (dumbbell) and barbell-hip-thrust resolve to different art', () => {
    const dumbbell = exerciseAsset('hip-thrust', 'thumbnail')
    const barbell = exerciseAsset('barbell-hip-thrust', 'thumbnail')
    expect(dumbbell?.url).not.toBe(barbell?.url)
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
