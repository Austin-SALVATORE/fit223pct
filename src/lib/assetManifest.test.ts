import { describe, expect, it } from 'vitest'
import manifest from '@/data/generated/asset-manifest.json'

/**
 * Production-incident follow-up: deployed resolver code once read a
 * manifest schema (referenceSize/frameSizes) that the committed
 * asset-manifest.json didn't have yet — generated data and the code that
 * reads it had landed in separate commits (see docs/design/
 * ExerciseAssetPipeline.md's App integration process rule). This asserts
 * the manifest's actual shape against every field src/lib/exerciseAsset.ts
 * relies on, so a bad or stale regeneration fails the suite instead of
 * shipping a crash — the resolver itself tolerates the gap (never throws),
 * but this is what should catch it before that tolerance is ever needed.
 */
describe('asset-manifest.json shape', () => {
  const entries = Object.entries(manifest as Record<string, Record<string, unknown>>)

  it('is not empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it.each(entries)('%s has valid dimension fields', (_id, entry) => {
    const frameCount = entry.frameCount as number
    const thumbnailFrame = entry.thumbnailFrame as number
    const referenceSize = entry.referenceSize as unknown
    const frameSizes = entry.frameSizes as unknown

    expect(Number.isInteger(frameCount)).toBe(true)
    expect(frameCount).toBeGreaterThan(0)
    expect(Number.isInteger(thumbnailFrame)).toBe(true)
    expect(thumbnailFrame).toBeGreaterThanOrEqual(1)
    expect(thumbnailFrame).toBeLessThanOrEqual(frameCount)

    expect(isPositiveDimensionPair(referenceSize)).toBe(true)

    expect(Array.isArray(frameSizes)).toBe(true)
    expect((frameSizes as unknown[]).length).toBe(frameCount)
    for (const size of frameSizes as unknown[]) {
      expect(isPositiveDimensionPair(size)).toBe(true)
    }
  })
})

function isPositiveDimensionPair(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n) && n > 0)
  )
}
