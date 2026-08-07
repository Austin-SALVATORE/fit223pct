import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { exerciseRepo, programRepo, settingsRepo, workoutRepo } from '@/data/repositories'
import {
  addCustomSlot,
  completeWorkout,
  logSet,
  plannedSetIndices,
  previousSetsFor,
  progressionHistoryFor,
  skipPrescribedLevel,
  swapExercise,
  undoCustomSlot,
  undoLastSet,
  undoSkip,
  workoutPosition,
} from '@/domain/workout'
import { PRODUCT_NAME } from '@/lib/brand'
import type { LoggedSet, Workout } from '@/domain/types'
import { SessionSheet } from './SessionSheet'
import { SetScreen } from './SetScreen'
import { UndoLastSetButton } from './UndoLastSetButton'
import { UndoRemovalButton } from './UndoRemovalButton'
import { RestScreen } from './RestScreen'
import { SessionSummary } from './SessionSummary'

type Phase =
  | { kind: 'logging' }
  | { kind: 'resting'; endsAt: number; totalSeconds: number; exerciseChanged: boolean }
  | { kind: 'summary' }

/**
 * The one removal ("Remove this set") a caller could still undo — a
 * prescribed level skipped, or an unfilled custom slot removed. Unlike
 * `undoTarget` below (derived fresh from `undoLastSet(workout).removed`),
 * there is no persisted "most recent removal" to derive this from —
 * `skippedLevels` is an unordered set of levels, not a history — so this is
 * local, ephemeral UI state: cleared by performing the undo, or by any
 * other action that isn't undoing it (coach spec §4: "provide immediate
 * Undo after any removal" — immediate, not permanent).
 */
type LastRemoval =
  | { kind: 'skip'; exerciseIndex: number; level: number }
  | { kind: 'customSlot'; exerciseIndex: number }

export function WorkoutPage() {
  const { t } = useTranslation('workout')
  const { t: tCommon, i18n } = useTranslation('common')
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>({ kind: 'logging' })
  const [sessionSheetOpen, setSessionSheetOpen] = useState(false)
  const [lastRemoval, setLastRemoval] = useState<LastRemoval | null>(null)
  const navigate = useNavigate()

  // Workout mode is a full-screen takeover outside AppShell's route-title
  // handling — it needs its own, since navigating here from Today is still
  // an SPA route change with no title update otherwise. Also re-runs on a
  // live language switch, same as AppShell's route-title effect.
  useEffect(() => {
    document.title = tCommon('routeTitle.workout', { productName: PRODUCT_NAME })
  }, [i18n.language, tCommon])

  const data = useLiveQuery(async () => {
    const [workout, exercises, completed, settings] = await Promise.all([
      workoutRepo.getActive(),
      exerciseRepo.getAll(),
      workoutRepo.getCompleted(),
      settingsRepo.get(),
    ])
    // Only origin is needed here (note resolution) — the rest of the
    // program record isn't; Workout is already the source of truth for
    // everything else Workout Mode renders.
    const program = workout ? await programRepo.getById(workout.programId) : undefined
    return {
      workout,
      exerciseById: new Map(exercises.map((e) => [e.id, e])),
      completed,
      settings,
      programOrigin: program?.origin,
    }
  }, [])

  // Summary keeps its own snapshot: by then the active workout is gone.
  const [finished, setFinished] = useState<Workout | null>(null)

  if (!data) return null
  const { workout, exerciseById, completed, settings, programOrigin } = data

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

  // `previousSets` feeds SetScreen's <LastTime> display only; the engine
  // gets its own, gated history (progressionHistory) — see SetScreen.tsx's
  // prop doc for why these must not be the same value.
  const previousSets = previousSetsFor(completed, workoutExercise.exerciseId)
  const progressionHistory = progressionHistoryFor(settings, completed, workoutExercise.exerciseId)

  async function handleLog(set: Omit<LoggedSet, 'setIndex'>) {
    if (!workout || position === 'complete') return
    setLastRemoval(null) // a real log supersedes any pending "undo the removal" offer
    const updated = logSet(workout, position.exerciseIndex, set, position.setIndex)
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
    setLastRemoval(null)
    await workoutRepo.put(swapExercise(workout, position.exerciseIndex, newExerciseId))
  }

  async function handleUndo() {
    setLastRemoval(null)
    // Transactional read-modify-write, not read-then-put: two taps inside
    // one liveQuery frame would otherwise both read the same workout and
    // one undo would be silently lost (see workoutRepo.mutateActive).
    await workoutRepo.mutateActive((current) => {
      const result = undoLastSet(current)
      return result.removed ? result.workout : null
    })
    // A rest timer prescribed against a set that no longer exists must not
    // keep running.
    setPhase({ kind: 'logging' })
  }

  /**
   * Opens one extra set slot (coach spec §4). Gated by the caller
   * (`canAddSet` below) — Green Build only, max 2 per exercise, disabled
   * on Yellow. The Deload half of §4.1's gate table needs a coach-authored
   * program flag that does not exist yet (no Deload program is built) —
   * SessionSetCustomization.md §4.1 names this explicitly; nothing here
   * can gate on a flag that isn't defined.
   */
  async function handleAddSet() {
    if (!workout || position === 'complete') return
    setLastRemoval(null)
    await workoutRepo.put(addCustomSlot(workout, position.exerciseIndex))
  }

  /**
   * Removes the set in front of you. A prescribed level goes to
   * `skippedLevels` (SetScreen has already confirmed this — never called
   * for one without it); an unfilled custom slot decrements `customSlots`
   * outright, no confirmation needed. Either way, exercise.sets is
   * untouched, so this can never lose logged work.
   */
  async function handleRemoveSet() {
    if (!workout || position === 'complete') return
    const isCustomSlot = position.setIndex >= workoutExercise.prescription.sets
    const updated = isCustomSlot
      ? undoCustomSlot(workout, position.exerciseIndex)
      : skipPrescribedLevel(workout, position.exerciseIndex, position.setIndex)
    await workoutRepo.put(updated)
    setLastRemoval(
      isCustomSlot
        ? { kind: 'customSlot', exerciseIndex: position.exerciseIndex }
        : { kind: 'skip', exerciseIndex: position.exerciseIndex, level: position.setIndex },
    )
  }

  async function handleUndoRemoval() {
    if (!workout || !lastRemoval) return
    const updated =
      lastRemoval.kind === 'customSlot'
        ? addCustomSlot(workout, lastRemoval.exerciseIndex)
        : undoSkip(workout, lastRemoval.exerciseIndex, lastRemoval.level)
    await workoutRepo.put(updated)
    setLastRemoval(null)
  }

  async function handleReset() {
    if (!workout) return
    // Same end state as the Today page's discard — deleted, not archived,
    // with today back to not started. `replace` so Back can't return to a
    // Workout Mode whose session no longer exists.
    await workoutRepo.remove(workout.id)
    await navigate('/', { replace: true })
  }

  const loggedSetCount = workout.exercises.reduce((n, e) => n + e.sets.length, 0)
  // Session-aware, coach spec §4: a skipped level doesn't count, an opened
  // custom slot does — same plannedSetIndices SetScreen's own counter reads.
  const totalSetCount = workout.exercises.reduce((n, e) => n + plannedSetIndices(e).length, 0)
  // What an undo would take, computed for the control's accessible name so
  // it can state its target before the tap rather than after.
  const undoTarget = undoLastSet(workout).removed
  // Green Build only, max 2 custom slots per exercise (§4.1) — the Deload
  // half of the gate needs a flag no program declares yet, see handleAddSet.
  const canAddSet =
    workout.readiness?.tier !== 'easier' && (workoutExercise.customSlots ?? 0) < 2

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-4">
        {/*
          **It says pause, not leave, and that is a verified promise rather
          than reassuring wording.** Position is a pure function of persisted
          sets (`workoutPosition`, domain/workout.ts:60-67) and every log
          write-throughs immediately (`handleLog` above), so returning lands on
          the same set. WorkoutPage.test.tsx proves both: exact-set resume, and
          a navigation round-trip via the Technique detour.

          It was a 40×40 icon-only ✕ at `text-ink-tertiary` — the control the
          routine player's was copied from, and the owner could not reliably
          hit that one on a phone. Same three faults, same floor: `min-h-11`
          stated rather than emerging from padding arithmetic, a visible text
          label, and `text-ink-secondary` for prominence — note that tertiary
          already passed WCAG AA on contrast, so the argument is "this is the
          only exit from a takeover", not a conformance failure.

          A bare ✕ was actively misleading here, which is why the owner ruled
          on the wording: it gave no hint the sets survive, and *closing* is
          the scarier of the two readings.

          **Deliberately worded differently from the routine player's "Leave
          this routine"** (`RoutinePlayer.tsx` LeaveLink) — the behaviours
          differ, so the promises must. A routine writes nothing and there is
          nothing to come back to; a session preserves every logged set. Do not
          unify these two labels: borrowing "leave" here would tell someone
          they are abandoning work that is in fact safe.

          No "your sets are saved" line beside it, on purpose. This header
          already carries a progress bar, a conditional undo and the options
          menu, and Workout Mode is one decision at a time — a fifth thing to
          read mid-set costs more than the word "pause" already conveys.
        */}
        <Link
          to="/"
          aria-label={t('pauseAriaLabel')}
          className="-ml-3 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
        >
          <span aria-hidden="true">‖</span>
          {t('pause')}
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
        {undoTarget && (
          <UndoLastSetButton
            exerciseId={workout.exercises[undoTarget.exerciseIndex].exerciseId}
            setIndex={undoTarget.set.setIndex + 1}
            totalSets={plannedSetIndices(workout.exercises[undoTarget.exerciseIndex]).length}
            onUndo={() => void handleUndo()}
          />
        )}
        {lastRemoval && (
          <UndoRemovalButton
            exerciseId={workout.exercises[lastRemoval.exerciseIndex].exerciseId}
            kind={lastRemoval.kind}
            onUndo={() => void handleUndoRemoval()}
          />
        )}
        <button
          type="button"
          aria-label={t('sessionSheet.triggerAriaLabel')}
          onClick={() => setSessionSheetOpen(true)}
          className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:text-ink"
        >
          ⋯
        </button>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {/*
          This key is load-bearing beyond animation. SetScreen seeds its
          Stepper values in useState initializers from the *last logged set*,
          so after an undo those initializers must re-run — otherwise the
          mistaken weight survives the undo that removed it. Keying on the
          position guarantees the remount, because an undo always changes
          setIndex or exerciseIndex. Simplifying this to `phase.kind`, or
          memoising SetScreen, silently re-introduces the stale prefill;
          WorkoutPage.undo.test.tsx's "re-offers the ladder rung" test is
          what catches that, and nothing else in the suite would.
        */}
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
              completed={completed}
              settings={settings}
              readinessTier={workout.readiness?.tier}
              onDone={() => setPhase({ kind: 'logging' })}
            />
          ) : (
            <SetScreen
              workoutExercise={workoutExercise}
              exercise={exercise}
              setIndex={position.setIndex}
              previousSets={previousSets}
              progressionHistory={progressionHistory}
              exerciseById={exerciseById}
              readinessTier={workout.readiness?.tier}
              programId={workout.programId}
              programOrigin={programOrigin}
              sessionId={workout.sessionTemplateId}
              onLog={handleLog}
              onSwap={handleSwap}
              onAddSet={() => void handleAddSet()}
              canAddSet={canAddSet}
              onRemoveSet={() => void handleRemoveSet()}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <SessionSheet
        open={sessionSheetOpen}
        loggedSetCount={loggedSetCount}
        onReset={() => void handleReset()}
        onClose={() => setSessionSheetOpen(false)}
      />
    </div>
  )
}
