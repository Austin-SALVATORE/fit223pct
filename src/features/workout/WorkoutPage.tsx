import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { exerciseRepo, workoutRepo } from '@/data/repositories'
import {
  completeWorkout,
  logSet,
  previousSetsFor,
  swapExercise,
  workoutPosition,
} from '@/domain/workout'
import { PRODUCT_NAME } from '@/lib/brand'
import type { LoggedSet, Workout } from '@/domain/types'
import { SetScreen } from './SetScreen'
import { RestScreen } from './RestScreen'
import { SessionSummary } from './SessionSummary'

type Phase =
  | { kind: 'logging' }
  | { kind: 'resting'; endsAt: number; totalSeconds: number; exerciseChanged: boolean }
  | { kind: 'summary' }

export function WorkoutPage() {
  const { t } = useTranslation('workout')
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>({ kind: 'logging' })

  // Workout mode is a full-screen takeover outside AppShell's route-title
  // handling — it needs its own, since navigating here from Today is still
  // an SPA route change with no title update otherwise.
  useEffect(() => {
    document.title = `${PRODUCT_NAME} — Workout`
  }, [])

  const data = useLiveQuery(async () => {
    const [workout, exercises, completed] = await Promise.all([
      workoutRepo.getActive(),
      exerciseRepo.getAll(),
      workoutRepo.getCompleted(),
    ])
    return { workout, exerciseById: new Map(exercises.map((e) => [e.id, e])), completed }
  }, [])

  // Summary keeps its own snapshot: by then the active workout is gone.
  const [finished, setFinished] = useState<Workout | null>(null)

  if (!data) return null
  const { workout, exerciseById, completed } = data

  if (phase.kind === 'summary' && finished) {
    return <SessionSummary workout={finished} exerciseById={exerciseById} history={completed} />
  }

  if (!workout) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-start justify-center px-5">
        <p className="text-ink-secondary">{t('noSession')}</p>
        <Link to="/" className="mt-4 font-medium text-amber">
          {t('backToToday')}
        </Link>
      </div>
    )
  }

  const position = workoutPosition(workout)
  if (position === 'complete') {
    // Defensive: shouldn't happen because logging the last set finishes the
    // workout, but never trap the user on a dead screen.
    return <SessionSummary workout={workout} exerciseById={exerciseById} history={completed} />
  }

  const workoutExercise = workout.exercises[position.exerciseIndex]
  const exercise = exerciseById.get(workoutExercise.exerciseId)
  if (!exercise) return null

  const previousSets = previousSetsFor(completed, workoutExercise.exerciseId)

  async function handleLog(set: Omit<LoggedSet, 'setIndex'>) {
    if (!workout || position === 'complete') return
    const updated = logSet(workout, position.exerciseIndex, set)
    const nextPosition = workoutPosition(updated)

    if (nextPosition === 'complete') {
      const done = completeWorkout(updated, new Date().toISOString())
      await workoutRepo.put(done)
      setFinished(done)
      setPhase({ kind: 'summary' })
      return
    }

    await workoutRepo.put(updated)
    // Auto-start only, deliberately: rest is prescribed against the set
    // just completed, so logging is the only correct trigger — a separate
    // manual "start rest" control would just be a second path to the same
    // state, including into a new exercise (exerciseChanged below). Swapping
    // an exercise (handleSwap) never starts a timer for the same reason:
    // no set was actually performed.
    const rest = workoutExercise.prescription.restSeconds
    setPhase({
      kind: 'resting',
      endsAt: Date.now() + rest * 1000,
      totalSeconds: rest,
      exerciseChanged: nextPosition.exerciseIndex !== position.exerciseIndex,
    })
  }

  async function handleSwap(newExerciseId: string) {
    if (!workout || position === 'complete') return
    await workoutRepo.put(swapExercise(workout, position.exerciseIndex, newExerciseId))
  }

  const loggedSetCount = workout.exercises.reduce((n, e) => n + e.sets.length, 0)
  const totalSetCount = workout.exercises.reduce((n, e) => n + e.prescription.sets, 0)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-4">
        <Link
          to="/"
          aria-label={t('pauseAriaLabel')}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:text-ink"
        >
          ✕
        </Link>
        <div
          role="progressbar"
          aria-label={t('progressAriaLabel')}
          aria-valuenow={loggedSetCount}
          aria-valuemin={0}
          aria-valuemax={totalSetCount}
          aria-valuetext={t('progressValueText', { logged: loggedSetCount, total: totalSetCount })}
          className="h-1 flex-1 overflow-hidden rounded-full bg-raised"
        >
          <div
            className="h-full rounded-full bg-amber transition-[width] duration-500"
            style={{ width: `${(loggedSetCount / totalSetCount) * 100}%` }}
          />
        </div>
        <span className="text-sm text-ink-tertiary" data-numeric>
          {loggedSetCount}/{totalSetCount}
        </span>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={phase.kind === 'resting' ? 'rest' : `set-${position.exerciseIndex}-${position.setIndex}`}
          className="flex flex-1 flex-col"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {phase.kind === 'resting' ? (
            <RestScreen
              endsAt={phase.endsAt}
              totalSeconds={phase.totalSeconds}
              exerciseChanged={phase.exerciseChanged}
              workout={workout}
              position={position}
              exerciseById={exerciseById}
              onDone={() => setPhase({ kind: 'logging' })}
            />
          ) : (
            <SetScreen
              workoutExercise={workoutExercise}
              exercise={exercise}
              setIndex={position.setIndex}
              previousSets={previousSets}
              exerciseById={exerciseById}
              readinessTier={workout.readiness?.tier}
              onLog={handleLog}
              onSwap={handleSwap}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
