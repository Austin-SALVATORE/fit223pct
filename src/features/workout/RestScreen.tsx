import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
import { TimerRing } from '@/ui/TimerRing'
import {
  useExerciseCues,
  useExerciseName,
  useExerciseTeachingConcept,
} from '@/i18n/seedExercise'
import type { Exercise, Workout } from '@/domain/types'
import type { WorkoutPosition } from '@/domain/workout'

interface RestScreenProps {
  endsAt: number
  totalSeconds: number
  exerciseChanged: boolean
  workout: Workout
  /** Position of the NEXT set (data is already updated when rest begins) */
  position: WorkoutPosition
  exerciseById: Map<string, Exercise>
  onDone: () => void
}

export function RestScreen({
  endsAt: initialEndsAt,
  totalSeconds,
  exerciseChanged,
  workout,
  position,
  exerciseById,
  onDone,
}: RestScreenProps) {
  const { t } = useTranslation('workout')
  const [endsAt, setEndsAt] = useState(initialEndsAt)
  const [remaining, setRemaining] = useState(() => secondsLeft(initialEndsAt))
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const nextUpId = useId()

  useEffect(() => {
    const tick = setInterval(() => setRemaining(secondsLeft(endsAt)), 250)
    return () => clearInterval(tick)
  }, [endsAt])

  useEffect(() => {
    if (remaining <= 0) onDone()
  }, [remaining, onDone])

  const nextExercise = workout.exercises[position.exerciseIndex]
  const exercise = exerciseById.get(nextExercise.exerciseId)
  // Called unconditionally, before the early return below, so hook order
  // stays stable whether or not `exercise` resolves.
  const exerciseName = useExerciseName(exercise?.id ?? '')
  if (!exercise) return null

  const total = Math.max(totalSeconds, Math.ceil((endsAt - Date.now()) / 1000))
  const nextLabel = t(exerciseChanged ? 'resting.nextUp' : 'resting.next')

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {/*
        A heading, not a <p aria-label>. `role="paragraph"` prohibits author
        naming, so the old aria-label was either dropped by assistive tech or
        read *instead of* "Rest" — and the screen had no heading at all
        (docs/review-backlog.md A3).

        The context that label carried is not lost: it is the same text the
        next-up block below already displays, so that block is wired as this
        heading's description rather than duplicated into a name. Visible
        text stays the accessible name, which is also what keeps
        voice-control working.
      */}
      <h2 ref={headingRef} tabIndex={-1} aria-describedby={nextUpId} className="eyebrow">
        {t('resting.heading')}
      </h2>

      <TimerRing remaining={remaining} total={total} />

      <div className="mt-4 flex gap-3">
        <RestButton label={t('resting.plusThirty')} onClick={() => setEndsAt((prev) => prev + 30_000)} />
        <RestButton label={t('resting.skip')} onClick={onDone} />
      </div>

      <div id={nextUpId} className="mt-10">
        <p className="text-sm text-ink-tertiary">{nextLabel}</p>
        <p className="mt-1 font-medium text-ink">
          {t('resting.setProgress', {
            exerciseName,
            setIndex: position.setIndex + 1,
            totalSets: nextExercise.prescription.sets,
          })}
        </p>
      </div>

      <CoachingCard exercise={exercise} setIndex={position.setIndex} isNew={exerciseChanged} />
    </div>
  )
}

function RestButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
    >
      {label}
    </button>
  )
}

/** Rest is when there's time to read — coaching lives here, never mid-set. */
function CoachingCard({
  exercise,
  setIndex,
  isNew,
}: {
  exercise: Exercise
  setIndex: number
  isNew: boolean
}) {
  const concept = useExerciseTeachingConcept(exercise.id)
  const cues = useExerciseCues(exercise.id)
  if (isNew && concept) {
    return (
      <div className="mt-8 w-full rounded-card border border-border bg-surface p-5 text-left">
        <p className="eyebrow">{concept.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{concept.body}</p>
      </div>
    )
  }
  const cue = cues[setIndex % cues.length]
  if (!cue) return null
  return (
    <p className="mt-8 max-w-[32ch] text-sm leading-relaxed text-ink-secondary">“{cue}”</p>
  )
}

function secondsLeft(endsAt: number): number {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
}
