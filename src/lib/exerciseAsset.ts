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
  // Optional, not asserted: the manifest is generated data, and generated
  // data can be stale relative to the code reading it (a schema-adding
  // regeneration landing in a separate commit/push from this resolver is
  // exactly how it went missing once — see docs/design/
  // ExerciseAssetPipeline.md's "App integration" process rule). Every read
  // below tolerates either field being absent.
  referenceSize?: [number, number]
  frameSizes?: [number, number][]
}

// The generated manifest's JSON types are plain number[]/number[][] —
// the tuple shape below is a contract this file relies on (each pair is
// always exactly [width, height]), not something JSON's type can express.
const ASSET_MANIFEST = manifest as unknown as Record<string, ManifestEntry>

/**
 * Domain seed ids that name the same exercise as an asset-pipeline id
 * under a different string — reconciled here rather than renaming either
 * side, per docs/design/ExerciseAssetPipeline.md's "Parked decisions" and
 * its naming policy. Every pair here was visually verified against its
 * asset's reference.avif before being added, not assumed from the name
 * match alone (see the exercise-asset-naming-reconciliation batch report
 * for the per-pair verdicts) — a wrong illustration is worse than none,
 * especially for a loaded main lift.
 *
 * This map only ever SHRINKS as policy: new Library exercises get their
 * asset generated under the Library id from day one, and a direct
 * manifest hit always wins over an alias (see resolveAssetId) — once a
 * later batch lands a Library-id asset for one of these, the alias below
 * becomes dead weight and must be deleted in that same commit. The
 * coverage guard test (exerciseAsset.coverage.test.ts) asserts this map
 * never contains an id that already has a direct manifest entry.
 */
export const ASSET_ID_ALIASES: Readonly<Record<string, string>> = {
  'single-leg-rdl': 'single-leg-romanian-deadlift',
  'barbell-squat': 'barbell-back-squat',
  'bent-over-row': 'barbell-row',
  'dumbbell-curl': 'dumbbell-biceps-curl',
  'dumbbell-lateral-raise': 'lateral-raise',
  'barbell-hip-thrust': 'hip-thrust',
  'single-arm-db-row': 'dumbbell-row',
  'tempo-bodyweight-squat': 'bodyweight-squat',
}

/**
 * A direct manifest hit under the Library id always wins over an alias —
 * load-bearing, not cosmetic: asset generation lands under true Library
 * ids going forward (see docs/design/ExerciseAssetPipeline.md's naming
 * policy), so a Library-id asset landing later must immediately supersede
 * its legacy alias with no code change. The alias map exists only for
 * already-shipped legacy names and is expected to shrink over time.
 */
function resolveAssetId(exerciseId: string): string {
  if (ASSET_MANIFEST[exerciseId]) return exerciseId
  return ASSET_ID_ALIASES[exerciseId] ?? exerciseId
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
  const assetId = resolveAssetId(exerciseId)
  const entry = ASSET_MANIFEST[assetId]
  if (!entry) return null

  const base = `/assets/exercises/${assetId}`

  if (kind === 'reference') {
    if (!entry.referenceSize) return null
    const [width, height] = entry.referenceSize
    return { url: `${base}/reference.avif`, width, height }
  }

  if (kind === 'thumbnail') {
    const size = entry.frameSizes?.[entry.thumbnailFrame - 1]
    if (!size) return null
    return { url: `${base}/thumbnail.avif`, width: size[0], height: size[1] }
  }

  // kind === 'frame' — 1-based, must fall within the strip this exercise
  // actually has (frame counts vary per exercise; side-plank has 2).
  if (frame === undefined || frame < 1 || frame > entry.frameCount) return null
  const size = entry.frameSizes?.[frame - 1]
  if (!size) return null
  const padded = String(frame).padStart(2, '0')
  return { url: `${base}/frames/${padded}.avif`, width: size[0], height: size[1] }
}

/** How many frames to step through — 0 for an unknown id (FrameStepper renders nothing). */
export function exerciseAssetFrameCount(exerciseId: string): number {
  const assetId = resolveAssetId(exerciseId)
  return ASSET_MANIFEST[assetId]?.frameCount ?? 0
}
