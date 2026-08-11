import type {
  LoggedSet,
  SessionTemplate,
  UserSettings,
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
 * The set-index slots this exercise offers this session, in presentation
 * order: prescribed levels first — skipping any in `skippedLevels`
 * (coach spec §4 "Skipped this session") — then opened custom slots
 * (`Add Set`) at `prescription.sets + i`.
 *
 * Custom indices start at `prescription.sets`, which equals
 * `setPlan.length` for every ladder (`programImport.ts`'s
 * `p.sets === p.setPlan.length` refinement) — so a custom set's index can
 * never collide with a prescribed rung's, structurally, not by convention.
 * That is what makes §3.1's defect (below) impossible once `logSet`
 * receives its index from here rather than deriving one.
 */
export function plannedSetIndices(exercise: WorkoutExercise): number[] {
  const skipped = new Set(exercise.skippedLevels ?? [])
  const prescribed = Array.from({ length: exercise.prescription.sets }, (_, i) => i).filter(
    (i) => !skipped.has(i),
  )
  const custom = Array.from(
    { length: exercise.customSlots ?? 0 },
    (_, i) => exercise.prescription.sets + i,
  )
  return [...prescribed, ...custom]
}

/**
 * The current set, derived purely from logged data — there is no separate
 * step state to lose. Reopening the app resumes at the exact set.
 *
 * Walks `plannedSetIndices` rather than a plain `sets.length < prescription
 * .sets` count, so a skipped prescribed level is stepped over (never
 * re-offered) and an opened custom slot is offered after the prescribed
 * ones — both are session-only, coach spec §4.
 */
export function workoutPosition(workout: Workout): WorkoutPosition | 'complete' {
  for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
    const logged = new Set(exercise.sets.map((s) => s.setIndex))
    const nextIndex = plannedSetIndices(exercise).find((i) => !logged.has(i))
    if (nextIndex !== undefined) {
      return { exerciseIndex, setIndex: nextIndex }
    }
  }
  return 'complete'
}

/**
 * **`setIndex` is explicit, never derived from `sets.length`.** Deriving it
 * used to assign a custom set the index of whatever prescribed level had
 * just been skipped — `workoutPosition` above is the single authority for
 * "what slot is this", and every caller must pass its own answer rather
 * than let this function guess from array length.
 *
 * Measured defect this exists to prevent (docs/design/
 * SessionSetCustomization.md §3.1): remove prescribed level 0, log a
 * custom set with the old derivation — the custom set lands at index 0,
 * the completion gate (`suggestLadderProgression`) reads it as the
 * prescribed level, finds the target met, and advances the load. A level
 * the athlete never did just earned a heavier one. See workout.test.ts's
 * "the index-inheritance regression" for the reproduction.
 */
export function logSet(
  workout: Workout,
  exerciseIndex: number,
  set: Omit<LoggedSet, 'setIndex'>,
  setIndex: number,
): Workout {
  return updateExercise(workout, exerciseIndex, (exercise) => ({
    ...exercise,
    sets: [...exercise.sets, { ...set, setIndex }],
  }))
}

/**
 * Removes a set slot from this session only — never the underlying
 * prescription. A prescribed level goes to `skippedLevels` (retained for
 * audit, coach spec §4); an unfilled custom slot decrements `customSlots`
 * and is deleted outright, since nothing was ever logged for it.
 *
 * Both are pure metadata changes — neither touches `exercise.sets`, so an
 * already-logged set can never be lost by a removal. That is also what
 * makes `undoSkip`/`undoCustomSlot` below safe: they restore exactly the
 * one field this function changed.
 */
export function skipPrescribedLevel(workout: Workout, exerciseIndex: number, level: number): Workout {
  return updateExercise(workout, exerciseIndex, (exercise) => ({
    ...exercise,
    skippedLevels: [...(exercise.skippedLevels ?? []), level].sort((a, b) => a - b),
  }))
}

/** The inverse of {@link skipPrescribedLevel} — restores exactly one skipped level. */
export function undoSkip(workout: Workout, exerciseIndex: number, level: number): Workout {
  return updateExercise(workout, exerciseIndex, (exercise) => ({
    ...exercise,
    skippedLevels: (exercise.skippedLevels ?? []).filter((l) => l !== level),
  }))
}

/** Opens one extra set slot, up to the coach spec's two-per-exercise cap (§4). */
export function addCustomSlot(workout: Workout, exerciseIndex: number): Workout {
  return updateExercise(workout, exerciseIndex, (exercise) => ({
    ...exercise,
    customSlots: (exercise.customSlots ?? 0) + 1,
  }))
}

/**
 * Removes the most recently opened, unfilled custom slot. Only ever called
 * on a slot nothing has been logged for — the set screen removes a filled
 * custom set through `undoLastSet` instead, since that slot's `LoggedSet`
 * needs to be discarded too, not just the slot count.
 */
export function undoCustomSlot(workout: Workout, exerciseIndex: number): Workout {
  return updateExercise(workout, exerciseIndex, (exercise) => ({
    ...exercise,
    customSlots: Math.max(0, (exercise.customSlots ?? 0) - 1),
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

/**
 * Boot-time repair for a workout damaged by the "removing the last
 * remaining slot finishes the screen but not storage" defect
 * (`WorkoutPage.handleRemoveSet` used to `put` the skip/undoCustomSlot
 * result without checking whether it had just emptied
 * `plannedSetIndices`): `completedAt` stayed `null` while every
 * prescribed level was already logged or skipped, so `workoutPosition`
 * read 'complete' and the summary screen showed — but storage still held
 * an open workout. `closeStaleWorkouts` would abandon it the next boot
 * and it would vanish from every completion count.
 *
 * **Narrow on purpose**: `workoutPosition(workout) === 'complete'` is the
 * only trigger. A workout with any slot still open is a genuine
 * mid-session abandonment — `closeStaleWorkouts`'s "closing is not
 * finishing" model governs those, and this function must never touch
 * them.
 *
 * `completedAt` prefers the *honest* completion time: the latest logged
 * set's own `completedAt`, if any sets were logged. Falls back to
 * `abandonedAt` (set by a prior boot's `closeStaleWorkouts`), then to
 * `now` — threaded in by the caller so this stays a pure function of its
 * arguments, the same shape as {@link completeWorkout}.
 *
 * Returns `null` when nothing needs repair (already completed, or
 * genuinely still open), so the repository layer can filter without
 * re-deriving the guard.
 */
export function repairPositionCompleteWorkout(workout: Workout, now: string): Workout | null {
  if (workout.completedAt !== null) return null
  if (workoutPosition(workout) !== 'complete') return null

  const loggedTimestamps = workout.exercises.flatMap((exercise) =>
    exercise.sets.map((s) => s.completedAt),
  )
  const latestLogged =
    loggedTimestamps.length > 0
      ? loggedTimestamps.reduce((latest, t) => (t > latest ? t : latest))
      : null

  return {
    ...workout,
    completedAt: latestLogged ?? workout.abandonedAt ?? now,
    abandonedAt: null,
  }
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

/**
 * True only once the athlete has confirmed their actual dumbbell hardware
 * (coach spec v2.16 §4). Absent profile, or a profile nobody has confirmed
 * yet, is exactly the same as no profile — "values happen to be present"
 * and "the athlete verified them" are different things, same contract as
 * `profileConfirmedAt` (`types.ts`'s `UserSettings`).
 */
export function hasVerifiedLoadList(settings: UserSettings | undefined): boolean {
  return settings?.equipment?.confirmedAt != null
}

/**
 * The progression engine's own history — never the display's. Empty
 * whenever `hasVerifiedLoadList` is false, so `suggestProgression` /
 * `suggestLadderProgression` fall onto their own well-tested "no history"
 * path and offer the coach's own prescription verbatim, instead of
 * arithmetic computed from a load the athlete may not be able to set (§4:
 * "must not calculate the next or previous load automatically" until the
 * hardware list is verified).
 *
 * **Not the same call site as `previousSetsFor`.** `previousSetsFor` feeds
 * `<LastTime>`'s display of what was actually lifted — real information the
 * athlete is entitled to regardless of whether their equipment is
 * verified — and must keep returning real history. This function is for
 * the engine argument only.
 */
export function progressionHistoryFor(
  settings: UserSettings | undefined,
  workouts: readonly Workout[],
  exerciseId: string,
): LoggedSet[] {
  if (!hasVerifiedLoadList(settings)) return []
  return previousSetsFor(workouts, exerciseId)
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
