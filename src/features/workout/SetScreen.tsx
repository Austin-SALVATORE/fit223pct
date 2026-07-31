import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Stepper } from '@/ui/Stepper'
import { suggestLadderProgression, suggestProgression } from '@/domain/progression'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
import { nextSetTarget } from '@/domain/nextSetTarget'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'
import { useExerciseName } from '@/i18n/seedExercise'
import { usePrescriptionNote } from '@/i18n/seedProgram'
import type { ReadinessTier } from '@/domain/readiness'
import type { Exercise, LoggedSet, Program, WorkoutExercise } from '@/domain/types'
import { HoldTimer } from './HoldTimer'
import { SwapSheet } from './SwapSheet'

interface SetScreenProps {
  workoutExercise: WorkoutExercise
  exercise: Exercise
  setIndex: number
  previousSets: readonly LoggedSet[]
  exerciseById: Map<string, Exercise>
  readinessTier?: ReadinessTier
  programId: string
  /** 'imported' skips locale-key resolution entirely — see i18n/seedProgram.ts */
  programOrigin?: Program['origin']
  sessionId: string
  onLog: (set: Omit<LoggedSet, 'setIndex'>) => void
  onSwap: (exerciseId: string) => void
}

export function SetScreen({
  workoutExercise,
  exercise,
  setIndex,
  previousSets,
  exerciseById,
  readinessTier,
  programId,
  programOrigin,
  sessionId,
  onLog,
  onSwap,
}: SetScreenProps) {
  const { t } = useTranslation('workout')
  const exerciseName = useExerciseName(exercise.id)
  const { prescription } = workoutExercise
  const note = usePrescriptionNote(programId, sessionId, prescription, programOrigin)
  const ladderResult = prescription.setPlan
    ? suggestLadderProgression(prescription, previousSets)
    : null
  const ladderRung = ladderResult?.setPlan[setIndex] ?? null
  const suggestion = prescription.setPlan
    ? null
    : suggestProgression(prescription, previousSets, readinessTier)
  const suggestionReason = useTranslatedMessage(suggestion?.reason ?? { key: 'domain:progression.start' })
  const ladderReason = useTranslatedMessage(
    ladderResult?.type === 'at-equipment-max'
      ? { key: 'domain:progression.atEquipmentMax' }
      : { key: 'domain:progression.start' },
  )

  /**
   * **Resolved in the domain, not here.** The rest screen renders the same
   * call, so the two cannot disagree — a rest screen that recomputed from the
   * prescription would show the ladder rung while this screen offers the
   * weight you just lifted, and the user would load the wrong one. See
   * `nextSetTarget`.
   */
  const target = nextSetTarget(
    prescription,
    workoutExercise.sets,
    previousSets,
    setIndex,
    readinessTier,
  )

  const [weightKg, setWeightKg] = useState(target.weightKg)
  const [effort, setEffort] = useState(
    (prescription.mode === 'seconds' ? target.seconds : target.reps) ?? 0,
  )
  const [swapOpen, setSwapOpen] = useState(false)

  const isSeconds = prescription.mode === 'seconds'
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const setProgressId = useId()
  const reducedMotion = useReducedMotion()

  function handleLog() {
    onLog({
      weightKg,
      reps: isSeconds ? null : effort,
      seconds: isSeconds ? effort : null,
      completedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-8">
        <p id={setProgressId} className="eyebrow">
          {t('setScreen.setProgress', { setIndex: setIndex + 1, totalSets: prescription.sets })}
          {ladderRung && ` — ${ladderRung.weightKg ?? '–'} kg × ${ladderRung.reps}`}
          {prescription.perSide && ` · ${t('setScreen.eachSide')}`}
        </p>
        {/*
          Described by the set-progress line above, so landing here — on
          mount, and after an undo steps the position back — announces
          "Goblet squat, Set 1 of 3" rather than just the exercise name.
          Which set is now being offered is the thing that changed, so it
          is the thing that has to be said. Reuses text already on screen
          and already translated, instead of a live region that would race
          the focus move with a second announcement.
        */}
        <h1
          ref={headingRef}
          tabIndex={-1}
          aria-describedby={setProgressId}
          className="text-display mt-2 text-4xl text-ink"
        >
          {exerciseName}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          <LastTime sets={previousSets} mode={prescription.mode} />
        </p>
        {suggestion && suggestion.type !== 'start' && (
          <p className="mt-1 text-sm leading-relaxed text-amber">{suggestionReason}</p>
        )}
        {ladderResult?.type === 'at-equipment-max' && (
          <p className="mt-1 text-sm leading-relaxed text-amber">{ladderReason}</p>
        )}
        {note && <p className="mt-1 text-sm text-ink-tertiary">{note}</p>}
      </div>

      <div className="mt-auto pt-8">
        {isSeconds && (
          <div className="mb-6 flex justify-center">
            <HoldTimer onComplete={setEffort} />
          </div>
        )}

        <div className="flex items-start justify-center gap-4">
          {weightKg !== null && (
            <Stepper
              label={t('setScreen.weightLabel')}
              value={weightKg}
              step={prescription.weightStepKg ?? 1}
              min={0}
              max={prescription.maxWeightKg ?? undefined}
              unit="kg"
              onChange={setWeightKg}
            />
          )}
          <Stepper
            // Reps and seconds-of-hold are both counts of whole things, and
            // this is the only genuinely integral field in the app — weight,
            // height, waist and body fat are all legitimately fractional.
            integer
            label={isSeconds ? t('setScreen.holdLabel') : t('setScreen.repsLabel')}
            value={effort}
            step={isSeconds ? 5 : 1}
            min={isSeconds ? 5 : 1}
            unit={isSeconds ? 's' : undefined}
            onChange={setEffort}
          />
        </div>

        <motion.button
          type="button"
          onClick={handleLog}
          whileTap={reducedMotion ? undefined : { scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="mt-8 w-full rounded-card bg-amber py-4 text-center text-lg font-semibold text-bg"
        >
          {isSeconds ? t('setScreen.logHold') : t('setScreen.logSet')}
        </motion.button>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Link
            to={`/library/${exercise.id}`}
            state={{ from: 'workout' }}
            className="inline-flex min-h-11 items-center px-3 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
          >
            {t('setScreen.technique')}
          </Link>
          <button
            type="button"
            onClick={() => setSwapOpen(true)}
            className="inline-flex min-h-11 items-center px-3 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
          >
            {t('setScreen.swapExercise')}
          </button>
        </div>
      </div>

      <SwapSheet
        open={swapOpen}
        exercise={exercise}
        prescription={prescription}
        exerciseById={exerciseById}
        loggedSetsCount={workoutExercise.sets.length}
        onSelect={(id) => {
          setSwapOpen(false)
          onSwap(id)
        }}
        onClose={() => setSwapOpen(false)}
      />
    </div>
  )
}

function LastTime({
  sets,
  mode,
}: {
  sets: readonly LoggedSet[]
  mode: 'reps' | 'seconds'
}) {
  const { t } = useTranslation('workout')
  const { t: tCommon } = useTranslation('common')
  if (sets.length === 0) return <>{t('setScreen.lastTimeFirst')}</>
  const parts = sets
    .map((set) => {
      const effort = effortValue(set, mode)
      // The seconds marker is keyed: zh-CN writes 秒, not a Latin "s" (I3).
      const suffix = mode === 'seconds' ? tCommon('unitSeconds') : ''
      return set.weightKg !== null ? `${effort}×${set.weightKg} kg` : `${effort}${suffix}`
    })
    .join(' · ')
  return (
    <>
      {t('setScreen.lastTimePrefix')} <span data-numeric>{parts}</span>
    </>
  )
}

function effortValue(set: LoggedSet, mode: 'reps' | 'seconds'): number {
  return (mode === 'seconds' ? set.seconds : set.reps) ?? 0
}
