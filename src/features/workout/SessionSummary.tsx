import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { summarizeWorkout } from '@/domain/workout'
import { coachInsight, workoutHighlights, type Highlight } from '@/domain/highlights'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'
import type { Exercise, Workout, WorkoutExercise } from '@/domain/types'

interface SessionSummaryProps {
  workout: Workout
  exerciseById: Map<string, Exercise>
  /** Completed workouts for comparison — may safely include this workout */
  history: readonly Workout[]
}

export function SessionSummary({ workout, exerciseById, history }: SessionSummaryProps) {
  const reducedMotion = useReducedMotion()
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const summary = summarizeWorkout(workout)
  const highlights = workoutHighlights(workout, history)
  const highlightById = new Map(highlights.map((h) => [h.exerciseId, h]))
  const insight = useTranslatedMessage(coachInsight(highlights, workout.readiness?.tier))

  return (
    <motion.div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-16"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-sm font-medium text-sage">Session complete</p>
      <h1 ref={headingRef} tabIndex={-1} className="text-display mt-2 text-5xl text-ink">
        Nice work.
      </h1>
      <p className="mt-4 max-w-[36ch] leading-relaxed text-ink-secondary">{insight}</p>

      <dl className="mt-8 flex gap-8">
        {summary.durationMinutes !== null && (
          <Stat label="Minutes" value={String(summary.durationMinutes)} />
        )}
        <Stat label="Sets" value={String(summary.totalSets)} />
        <Stat label="Volume" value={`${formatVolume(summary.volumeKg)} kg`} />
      </dl>

      <ul className="mt-10 space-y-4">
        {workout.exercises
          .filter((e) => e.sets.length > 0)
          .map((workoutExercise) => (
            <ExerciseLine
              key={workoutExercise.exerciseId}
              workoutExercise={workoutExercise}
              exercise={exerciseById.get(workoutExercise.exerciseId)}
              highlight={highlightById.get(workoutExercise.exerciseId)}
            />
          ))}
      </ul>

      <Link
        to="/"
        className="mt-auto block w-full rounded-card bg-surface py-4 text-center font-medium text-ink transition-colors hover:bg-raised"
      >
        Done
      </Link>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold text-ink" data-numeric>
        {value}
      </dd>
    </div>
  )
}

function ExerciseLine({
  workoutExercise,
  exercise,
  highlight,
}: {
  workoutExercise: WorkoutExercise
  exercise: Exercise | undefined
  highlight: Highlight | undefined
}) {
  const label = useTranslatedMessage(highlight?.label ?? { key: 'domain:highlight.steady' })
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
      <div className="min-w-0">
        <p className="text-ink">{exercise?.name ?? workoutExercise.exerciseId}</p>
        <p className="mt-0.5 text-sm text-ink-tertiary" data-numeric>
          {topSetLabel(workoutExercise)}
        </p>
      </div>
      {highlight && (
        <span
          className={`shrink-0 text-sm font-medium ${
            highlight.kind === 'load' || highlight.kind === 'effort'
              ? 'text-amber'
              : 'text-ink-tertiary'
          }`}
          data-numeric
        >
          {label}
        </span>
      )}
    </li>
  )
}

function topSetLabel(workoutExercise: WorkoutExercise): string {
  const sets = workoutExercise.sets
  const best = sets.reduce((top, set) => {
    const effort = (set.weightKg ?? 0) * (set.reps ?? 0)
    const topEffort = (top.weightKg ?? 0) * (top.reps ?? 0)
    return effort > topEffort ? set : top
  })
  const count = `${sets.length} ${sets.length === 1 ? 'set' : 'sets'}`
  if (best.weightKg !== null && best.reps !== null) {
    return `${count} · top ${best.reps} × ${best.weightKg} kg`
  }
  if (best.seconds !== null) return `${count} · top ${best.seconds}s hold`
  return `${count} · top ${best.reps ?? 0} reps`
}

function formatVolume(volume: number): string {
  return volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(Math.round(volume))
}
