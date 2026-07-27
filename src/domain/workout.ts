import type {
  LoggedSet,
  SessionTemplate,
  Workout,
  WorkoutExercise,
} from './types'

export interface WorkoutPosition {
  exerciseIndex: number
  setIndex: number
}

export interface WorkoutSummary {
  totalSets: number
  volumeKg: number
  durationMinutes: number | null
}

/** The set an undo took back, and the slot it was taken from. */
export interface UndoneSet {
  exerciseIndex: number
  set: LoggedSet
}

export interface UndoResult {
  workout: Workout
  /** null when nothing was logged — the caller renders no control in that case. */
  removed: UndoneSet | null
}

interface CreateWorkoutInput {
  id: string
  programId: string
  session: SessionTemplate
  date: string
  startedAt: string
}

/** Snapshot the session so history survives future program edits. */
export function createWorkout(input: CreateWorkoutInput): Workout {
  return {
    id: input.id,
    programId: input.programId,
    sessionTemplateId: input.session.id,
    date: input.date,
    startedAt: input.startedAt,
    completedAt: null,
    exercises: input.session.items.map((prescription) => ({
      exerciseId: prescription.exerciseId,
      prescription,
      sets: [],
    })),
  }
}

/**
 * The current set, derived purely from logged data — there is no separate
 * step state to lose. Reopening the app resumes at the exact set.
 */
export function workoutPosition(workout: Workout): WorkoutPosition | 'complete' {
  for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
    if (exercise.sets.length < exercise.prescription.sets) {
      return { exerciseIndex, setIndex: exercise.sets.length }
    }
  }
  return 'complete'
}

export function logSet(
  workout: Workout,
  exerciseIndex: number,
  set: Omit<LoggedSet, 'setIndex'>,
): Workout {
  return updateExercise(workout, exerciseIndex, (exercise) => ({
    ...exercise,
    sets: [...exercise.sets, { ...set, setIndex: exercise.sets.length }],
  }))
}

/**
 * The inverse of {@link logSet}: removes the most recently logged set in the
 * whole session, not merely the current exercise's last one — the mis-tap may
 * be the first set of exercise 3 while the user is now looking at exercise 3.
 *
 * "Most recent" is defined **positionally** — the last exercise that has any
 * sets — not by `max(completedAt)`. Sets can only enter a Workout through
 * `logSet` (always at `workoutPosition`'s index), `createWorkout` and
 * `swapExercise` (both `sets: []`), and `workoutPosition` always returns the
 * *first* unfilled exercise. So exercises fill strictly in order and the two
 * definitions coincide. Positional is the one to depend on: `completedAt` is
 * wall-clock (`new Date().toISOString()`), so ties, a device clock change or
 * a DST-adjacent write can reorder it — and it degrades worse, since a
 * timestamp undo could pull a set out of the middle of a completed exercise
 * and leave `workoutPosition` pointing at a hole it can never fill.
 *
 * Returns no message descriptor because it has nothing to say; the prose the
 * UI needs is built in the feature layer from `removed` plus `useExerciseName`.
 *
 * `workoutPosition` is derived, so it follows on its own: removing a set
 * re-opens exactly the slot that set occupied, stepping back into the
 * previous exercise when the current one had not started yet.
 */
export function undoLastSet(workout: Workout): UndoResult {
  for (let exerciseIndex = workout.exercises.length - 1; exerciseIndex >= 0; exerciseIndex -= 1) {
    const set = workout.exercises[exerciseIndex].sets.at(-1)
    if (set === undefined) continue
    return {
      workout: updateExercise(workout, exerciseIndex, (exercise) => ({
        ...exercise,
        sets: exercise.sets.slice(0, -1),
      })),
      removed: { exerciseIndex, set },
    }
  }
  // Nothing logged: the same workout back, so a caller can skip the write
  // entirely rather than persisting an identical record.
  return { workout, removed: null }
}

/**
 * Sets logged so far in this slot belong to the exercise that was actually
 * performed, not the one now replacing it — carrying them over would leave
 * the substitute reading as partially (or fully) done before a single real
 * set of it exists, corrupting both workoutPosition (which set is next) and
 * this slot's own logged history. They reset to empty; the sets already
 * performed stay attributed to nothing further (the model has one
 * exerciseId per slot, so mid-session provenance beyond
 * `substitutedForId` isn't representable) rather than silently misattributed.
 */
export function swapExercise(
  workout: Workout,
  exerciseIndex: number,
  newExerciseId: string,
): Workout {
  return updateExercise(workout, exerciseIndex, (exercise) => ({
    ...exercise,
    exerciseId: newExerciseId,
    substitutedForId: exercise.substitutedForId ?? exercise.exerciseId,
    sets: [],
  }))
}

export function completeWorkout(workout: Workout, completedAt: string): Workout {
  return { ...workout, completedAt }
}

export function summarizeWorkout(workout: Workout): WorkoutSummary {
  const sets = workout.exercises.flatMap((exercise) => exercise.sets)
  const volumeKg = sets.reduce(
    (total, set) => total + (set.weightKg ?? 0) * (set.reps ?? 0),
    0,
  )
  const durationMinutes =
    workout.completedAt === null
      ? null
      : Math.round(
          (Date.parse(workout.completedAt) - Date.parse(workout.startedAt)) / 60_000,
        )
  return { totalSets: sets.length, volumeKg, durationMinutes }
}

/**
 * Sets from the most recent completed workout that included the exercise —
 * feeds "last time" context and the progression engine.
 */
export function previousSetsFor(
  workouts: readonly Workout[],
  exerciseId: string,
): LoggedSet[] {
  const candidates = workouts
    .filter((w) => w.completedAt !== null)
    .sort((a, b) => b.date.localeCompare(a.date))

  for (const workout of candidates) {
    const exercise = workout.exercises.find(
      (e) => e.exerciseId === exerciseId && e.sets.length > 0,
    )
    if (exercise) return exercise.sets
  }
  return []
}

function updateExercise(
  workout: Workout,
  exerciseIndex: number,
  update: (exercise: WorkoutExercise) => WorkoutExercise,
): Workout {
  const target = workout.exercises[exerciseIndex]
  if (!target) {
    throw new Error(`Workout "${workout.id}" has no exercise at index ${exerciseIndex}`)
  }
  return {
    ...workout,
    exercises: workout.exercises.map((exercise, index) =>
      index === exerciseIndex ? update(exercise) : exercise,
    ),
  }
}
