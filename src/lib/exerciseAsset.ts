import manifest from '@/data/generated/asset-manifest.json'

export type ExerciseAssetKind = 'reference' | 'thumbnail' | 'frame'

export interface ExerciseAsset {
  url: string
  /** Intrinsic size in px — reserves layout space before the AVIF loads. */
  width: number
  height: number
}

interface ManifestEntry {
  frameCount: number
  thumbnailFrame: number
  referenceSize: [number, number]
  frameSizes: [number, number][]
}

// The generated manifest's JSON types are plain number[]/number[][] —
// the tuple shape below is a contract this file relies on (each pair is
// always exactly [width, height]), not something JSON's type can express.
const ASSET_MANIFEST = manifest as unknown as Record<string, ManifestEntry>

/**
 * The domain seed's `single-leg-rdl` and the asset pipeline's
 * `single-leg-romanian-deadlift` name the same exercise under different
 * ids — reconciled here per docs/design/ExerciseAssetPipeline.md's
 * "Parked decisions" rather than renaming either side. The only pair
 * that doc calls out; no other seed/asset id mismatch is a reconciliation
 * target (most are exercises with no prompt yet — see the same section).
 */
const ASSET_ID_ALIASES: Record<string, string> = {
  'single-leg-rdl': 'single-leg-romanian-deadlift',
}

/**
 * Resolves an exercise id + asset kind to a URL and its intrinsic size,
 * reading the build-generated manifest synchronously — no network, no
 * await. Assets never block training features: an unknown id, a kind
 * with no matching data, or an out-of-range frame all return `null`
 * rather than throwing, and callers render the existing asset-free
 * layout. Paths are always derived from `<id>` + convention here, never
 * stored — see docs/design/ExerciseAssetPipeline.md's "App integration".
 */
export function exerciseAsset(
  exerciseId: string,
  kind: ExerciseAssetKind,
  frame?: number,
): ExerciseAsset | null {
  const assetId = ASSET_ID_ALIASES[exerciseId] ?? exerciseId
  const entry = ASSET_MANIFEST[assetId]
  if (!entry) return null

  const base = `/assets/exercises/${assetId}`

  if (kind === 'reference') {
    const [width, height] = entry.referenceSize
    return { url: `${base}/reference.avif`, width, height }
  }

  if (kind === 'thumbnail') {
    const size = entry.frameSizes[entry.thumbnailFrame - 1]
    if (!size) return null
    return { url: `${base}/thumbnail.avif`, width: size[0], height: size[1] }
  }

  // kind === 'frame' — 1-based, must fall within the strip this exercise
  // actually has (frame counts vary per exercise; side-plank has 2).
  if (frame === undefined || frame < 1 || frame > entry.frameCount) return null
  const size = entry.frameSizes[frame - 1]
  if (!size) return null
  const padded = String(frame).padStart(2, '0')
  return { url: `${base}/frames/${padded}.avif`, width: size[0], height: size[1] }
}

/** How many frames to step through — 0 for an unknown id (FrameStepper renders nothing). */
export function exerciseAssetFrameCount(exerciseId: string): number {
  const assetId = ASSET_ID_ALIASES[exerciseId] ?? exerciseId
  return ASSET_MANIFEST[assetId]?.frameCount ?? 0
}
