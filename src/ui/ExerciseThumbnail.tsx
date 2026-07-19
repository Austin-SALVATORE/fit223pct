import { useState } from 'react'
import { exerciseAsset } from '@/lib/exerciseAsset'

const TILE_CLASS = 'h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-raised'

/**
 * A fixed, designed tile for list rows — same geometry whether the
 * exercise has art or not, so a mixed list (some assets, some not) reads
 * as one deliberate layout, never a placeholder next to a "real" one.
 *
 * Four states collapse into two renders: no manifest entry, no asset file
 * yet, and a failed image load are visually identical (this quiet empty
 * tile) — only a successfully loaded image looks different. `alt=""`
 * because the exercise name is always adjacent text; the image never
 * carries information alone.
 */
export function ExerciseThumbnail({ exerciseId }: { exerciseId: string }) {
  const asset = exerciseAsset(exerciseId, 'thumbnail')
  const [failed, setFailed] = useState(false)

  if (!asset || failed) {
    return <div className={TILE_CLASS} aria-hidden="true" />
  }

  return (
    <div className={TILE_CLASS}>
      <img
        src={asset.url}
        width={asset.width}
        height={asset.height}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
