import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useExerciseName } from '@/i18n/seedExercise'
import { exerciseAsset, exerciseAssetFrameCount } from '@/lib/exerciseAsset'

/** Fixed viewport height — each slide's own width comes from its frame's
 * aspect ratio (frames vary in width and orientation; height stays
 * constant so the strip never jumps as you scroll past a wider/narrower
 * or landscape/portrait frame). */
const STEPPER_HEIGHT = 280

/**
 * Library exercise detail only — step through a program's generated
 * photo strip. CSS scroll-snap, not a carousel library (see
 * docs/design/ExerciseAssetPipeline.md's "App integration": Embla is the
 * designated fallback only if programmatic control becomes real).
 * Renders nothing for an exercise with no asset — same "asset-free is a
 * designed state, not an error" principle as ExerciseThumbnail.
 */
export function FrameStepper({ exerciseId }: { exerciseId: string }) {
  const { t } = useTranslation('library')
  const exerciseName = useExerciseName(exerciseId)
  const frameCount = exerciseAssetFrameCount(exerciseId)
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const track = trackRef.current
    if (!track || frameCount === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries.reduce<IntersectionObserverEntry | null>(
          (best, entry) =>
            entry.intersectionRatio > (best?.intersectionRatio ?? 0) ? entry : best,
          null,
        )
        if (!mostVisible || mostVisible.intersectionRatio === 0) return
        const index = slideRefs.current.findIndex((el) => el === mostVisible.target)
        if (index !== -1) setActiveIndex(index)
      },
      { root: track, threshold: [0.6] },
    )
    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide)
    }
    return () => observer.disconnect()
  }, [frameCount, exerciseId])

  if (frameCount === 0) return null

  return (
    <section aria-label={t('frameStepperAriaLabel', { exerciseName })} className="mt-8">
      {/*
        tabIndex makes the scroller focusable, which Safari and Firefox do
        not do for a bare overflow container — so on an iOS-first PWA the
        strip was unreachable by keyboard entirely (A6/A7 in
        docs/review-backlog.md). role="group" plus the name gives the stop
        something to announce; the frames themselves stay alt="" because
        they are decorative repetitions of the reference image.
      */}
      <div
        ref={trackRef}
        tabIndex={0}
        role="group"
        aria-label={t('frameStepperTrackAriaLabel', { exerciseName })}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
        style={{ height: STEPPER_HEIGHT }}
      >
        {Array.from({ length: frameCount }, (_, i) => {
          const frame = i + 1
          const asset = exerciseAsset(exerciseId, 'frame', frame)
          if (!asset) return null
          const width = Math.round((STEPPER_HEIGHT * asset.width) / asset.height)
          return (
            <div
              key={frame}
              ref={(el) => {
                slideRefs.current[i] = el
              }}
              className="shrink-0 snap-center overflow-hidden rounded-lg"
              style={{ width, height: STEPPER_HEIGHT }}
            >
              <img
                src={asset.url}
                width={asset.width}
                height={asset.height}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain"
              />
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
        {Array.from({ length: frameCount }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === activeIndex ? 'bg-amber' : 'bg-border-strong'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
