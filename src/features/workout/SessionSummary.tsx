import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { summarizeWorkout } from '@/domain/workout'
import type { Exercise, Workout, WorkoutExercise } from '@/domain/types'

interface SessionSummaryProps {
  workout: Workout
  exerciseById: Map<string, Exercise>
}

export function SessionSummary({ workout, exerciseById }: SessionSummaryProps) {
  const reducedMotion = useReducedMotion()
  const summary = summarizeWorkout(workout)

  return (
    <motion.div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-16"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-sm font-medium text-sage">Session complete</p>
      <h1 className="text-display mt-2 text-5xl text-ink">Nice work.</h1>

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
}: {
  workoutExercise: WorkoutExercise
  exercise: Exercise | undefined
}) {
  const best = workoutExercise.sets.reduce((top, set) => {
    const effort = (set.weightKg ?? 0) * (set.reps ?? 0)
    const topEffort = (top.weightKg ?? 0) * (top.reps ?? 0)
    return effort > topEffort ? set : top
  })

  const bestLabel =
    best.weightKg !== null && best.reps !== null
      ? `top ${best.reps} × ${best.weightKg} kg`
      : best.seconds !== null
        ? `top ${best.seconds}s hold`
        : `${best.reps ?? 0} reps`

  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
      <span className="text-ink">{exercise?.name ?? workoutExercise.exerciseId}</span>
      <span className="shrink-0 text-sm text-ink-secondary" data-numeric>
        {workoutExercise.sets.length} {workoutExercise.sets.length === 1 ? 'set' : 'sets'} · {bestLabel}
      </span>
    </li>
  )
}

function formatVolume(volume: number): string {
  return volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(Math.round(volume))
}
