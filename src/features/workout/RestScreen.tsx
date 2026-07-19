import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
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
  const headingRef = useFocusOnMount<HTMLParagraphElement>()

  useEffect(() => {
    const tick = setInterval(() => setRemaining(secondsLeft(endsAt)), 250)
    return () => clearInterval(tick)
  }, [endsAt])

  useEffect(() => {
    if (remaining <= 0) onDone()
  }, [remaining, onDone])

  const nextExercise = workout.exercises[position.exerciseIndex]
  const exercise = exerciseById.get(nextExercise.exerciseId)
  if (!exercise) return null

  const total = Math.max(totalSeconds, Math.ceil((endsAt - Date.now()) / 1000))
  const nextLabel = t(exerciseChanged ? 'resting.nextUp' : 'resting.next')

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p
        ref={headingRef}
        tabIndex={-1}
        className="eyebrow"
        aria-label={t('resting.ariaLabel', {
          nextLabel,
          exerciseName: exercise.name,
          setIndex: position.setIndex + 1,
          totalSets: nextExercise.prescription.sets,
        })}
      >
        {t('resting.heading')}
      </p>

      <TimerRing remaining={remaining} total={total} />

      <div className="mt-4 flex gap-3">
        <RestButton label={t('resting.plusThirty')} onClick={() => setEndsAt((prev) => prev + 30_000)} />
        <RestButton label={t('resting.skip')} onClick={onDone} />
      </div>

      <div className="mt-10">
        <p className="text-sm text-ink-tertiary">{nextLabel}</p>
        <p className="mt-1 font-medium text-ink">
          {t('resting.setProgress', {
            exerciseName: exercise.name,
            setIndex: position.setIndex + 1,
            totalSets: nextExercise.prescription.sets,
          })}
        </p>
      </div>

      <CoachingCard exercise={exercise} setIndex={position.setIndex} isNew={exerciseChanged} />
    </div>
  )
}

function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const radius = 88
  const circumference = 2 * Math.PI * radius
  const fraction = total > 0 ? remaining / total : 0
  // Final-seconds emphasis lives on the ring only — the digit itself is a
  // data-critical number and stays a plain, stable readout.
  const almostDone = remaining > 0 && remaining <= 3

  return (
    <div className="relative mt-6 h-52 w-52">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="6"
          className="stroke-raised"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={`transition-[stroke-dashoffset,stroke] duration-300 ease-linear ${
            almostDone ? 'stroke-clay' : 'stroke-amber'
          }`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      <time
        aria-live="off"
        className="absolute inset-0 flex items-center justify-center text-5xl font-semibold text-ink"
      >
        {formatClock(remaining)}
      </time>
    </div>
  )
}

function RestButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
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
  const concept = exercise.teachingConcept
  if (isNew && concept) {
    return (
      <div className="mt-8 w-full rounded-card border border-border bg-surface p-5 text-left">
        <p className="eyebrow">{concept.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{concept.body}</p>
      </div>
    )
  }
  const cue = exercise.cues[setIndex % exercise.cues.length]
  if (!cue) return null
  return (
    <p className="mt-8 max-w-[32ch] text-sm leading-relaxed text-ink-secondary">“{cue}”</p>
  )
}

function secondsLeft(endsAt: number): number {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
