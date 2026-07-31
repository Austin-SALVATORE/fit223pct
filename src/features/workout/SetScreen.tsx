import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Stepper } from '@/ui/Stepper'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
import { nextSetTarget } from '@/domain/nextSetTarget'
import { useExerciseName } from '@/i18n/seedExercise'
import { usePrescriptionNote } from '@/i18n/seedProgram'
import type { ReadinessTier } from '@/domain/readiness'
import type { Exercise, LoggedSet, Program, WorkoutExercise } from '@/domain/types'
import { exerciseAsset, exerciseAssetThumbnailFrame } from '@/lib/exerciseAsset'
import type { NextSetTarget } from '@/domain/nextSetTarget'
import type { ExercisePrescription } from '@/domain/types'
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
  /*
    The progression *reason* is no longer read here — it moves to the rest
    screen, where education belongs ("education only during rest"), and its
    68px of French prose is what buys the illustration its room. What stays on
    this screen is the actionable residue: the delta chip in the caption.
  */

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
  const captionId = useId()
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
      <div className="mt-4">
        <p id={setProgressId} className="eyebrow">
          {t('setScreen.setProgress', { setIndex: setIndex + 1, totalSets: prescription.sets })}
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
        {/*
          24px, down from 36. The name was the largest thing on the screen
          while the numbers the user is about to log were 30px — that
          inversion is the defect the owner reported, and it is not fixable by
          growing the number alone.
        */}
        <h1
          ref={headingRef}
          tabIndex={-1}
          // Two ids rather than a wrapper: landing announces the name, which
          // set this is, and what the target is — the owner's request
          // expressed for a non-sighted user, from text already on screen and
          // already translated. Still a description, never a live region: a
          // region here would race the focus move with a second announcement.
          aria-describedby={`${setProgressId} ${captionId}`}
          className="text-display mt-2 text-2xl text-ink"
        >
          {exerciseName}
        </h1>
        {/* One line. The full history is a tap away under Technique. */}
        <p className="mt-2 truncate text-sm text-ink-secondary">
          <LastTime sets={previousSets} mode={prescription.mode} />
        </p>
        {/*
          Set 1 only. On sets 2..n it is 20px of something already read, and
          the progression *reason* has moved to the rest screen entirely —
          education belongs during rest, and the actionable residue is the
          delta chip in the caption below.
        */}
        {note && setIndex === 0 && <p className="mt-1 text-sm text-ink-tertiary">{note}</p>}
      </div>

      <IllustrationBand exerciseId={exercise.id} />

      <div className="pt-4">
        <div className="rounded-card border border-border bg-surface px-5 py-3">
          {isSeconds && (
            /*
              Inside the card, above the values it writes into. Stopping the
              timer pre-fills the stepper directly below it; the previous
              placement put 24px of gap between cause and effect.
            */
            <div className="flex justify-center border-b border-border pb-3">
              <HoldTimer onComplete={setEffort} />
            </div>
          )}
          {weightKg !== null && (
            <div className={isSeconds ? 'pt-3' : undefined}>
              <Stepper
                size="lg"
                label={t('setScreen.weightLabel')}
                value={weightKg}
                step={prescription.weightStepKg ?? 1}
                min={0}
                max={prescription.maxWeightKg ?? undefined}
                unit="kg"
                onChange={setWeightKg}
              />
            </div>
          )}
          <div
            className={
              weightKg !== null ? 'mt-2 border-t border-border pt-2' : isSeconds ? 'pt-3' : undefined
            }
          >
            <Stepper
              size="lg"
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
        </div>

        <TargetCaption
          id={captionId}
          prescription={prescription}
          target={target}
          setIndex={setIndex}
        />

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


/**
 * The exercise's representative pose, at the `thumbnailFrame` the pipeline
 * picked. **A static frame — not steppable, not animated, not tappable.**
 *
 * Not steppable: `FrameStepper` is a focusable horizontal scroll region, and
 * a screen whose whole rule is one decision at a time should not gain a tab
 * stop between the heading and the numbers. The full step-through is one tap
 * away under Technique.
 *
 * Not animated: the screen already animates on every set change, and this is
 * a screen you look at while breathing hard.
 *
 * **The band is the sponge.** Everything above it is top-anchored and
 * everything below is bottom-anchored, so the number card and the Log button
 * land at the same y on every exercise whatever the name length — the thumb
 * does not re-aim between exercises.
 *
 * Height fixed, width floating: `thumbnailFrame` aspect ratios run 0.30 to
 * 1.16, so a fixed-width box would render `plank` at a third the scale of a
 * shoulder press.
 *
 * Renders nothing at all when there is no asset — deliberately unlike
 * `ExerciseThumbnail`, which keeps a reserved tile because a *list* needs its
 * rows aligned. A single centred illustration has nothing to align with, so
 * an empty box would be a visible apology for a missing file.
 */
function IllustrationBand({ exerciseId }: { exerciseId: string }) {
  const [failed, setFailed] = useState(false)
  const frame = exerciseAssetThumbnailFrame(exerciseId)
  const art = frame === null ? null : exerciseAsset(exerciseId, 'frame', frame)
  if (!art || failed) return <div className="min-h-0 flex-1" />

  return (
    /*
      `max-h-*` on the band and `h-full` on the image, not `max-h` on the
      image: without `h-full` the image keeps its own height and forces the
      band open, so the sponge cannot absorb anything and the Log button goes
      below the fold — measured, at every width.

      Hidden outright under 700px of viewport. The spec's budget puts the band
      below its 96px floor on an SE, and a 40px sliver of a person is worse
      than no picture. One media rule rather than a per-element cascade.
    */
    <div className="relative hidden min-h-0 max-h-[200px] flex-1 [@media(min-height:701px)]:block">
      {/*
        Absolutely positioned, which is load-bearing rather than stylistic.
        `h-full` on an in-flow child of a `flex-1` parent is circular — the
        parent's height depends on the image, so `height: 100%` resolves
        against an indefinite value and the image falls back to its intrinsic
        822px, overflowing the 200px cap and pushing the Log button off screen.
        Measured at 623px before this. Out of flow, the parent's height is
        purely flex-driven and `inset-0` gives the image a definite box.
      */}
      <img
        src={art.url}
        width={art.width}
        height={art.height}
        alt=""
        decoding="async"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  )
}

/**
 * What you were told to do — a different question from "what am I about to
 * log", which is the card above.
 *
 * Static description, and **never a live region**: `Stepper` already
 * announces its own value on a 300ms debounce, and a region here would fire a
 * second announcement racing it. This is the `aria-describedby` target of the
 * heading, which is why it carries an id.
 */
function TargetCaption({
  id,
  prescription,
  target,
  setIndex,
}: {
  id: string
  prescription: ExercisePrescription
  target: NextSetTarget
  setIndex: number
}) {
  const { t } = useTranslation('workout')
  const isSeconds = prescription.mode === 'seconds'

  const targetText = prescription.setPlan
    ? t('setScreen.targetRung', {
        rung: setIndex + 1,
        total: prescription.setPlan.length,
        // The *advanced* rung, from the same resolution the card used. Reading
        // `prescription.setPlan[setIndex]` here would show the authored ladder
        // and caption "8 kg" under a card offering 10.
        weight: target.prescribed.weightKg ?? '–',
        reps: target.prescribed.reps ?? '–',
      })
    : t(isSeconds ? 'setScreen.targetSecondsRange' : 'setScreen.targetRepRange', {
        min: prescription.range.min,
        max: prescription.range.max,
      })

  return (
    <p id={id} className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-ink-tertiary">
      <span>{targetText}</span>
      {/*
        MAX rather than an up-arrow at the ceiling. That state is the reason
        the engine distinguishes it, and it must not read as a failure to
        progress — the ladder is holding because the equipment cannot go
        higher, which is information, not a shortfall.
      */}
      {target.progressionType === 'at-equipment-max' && (
        <span className="rounded-full border border-amber px-2 py-0.5 text-xs font-semibold text-amber">
          {t('setScreen.atMax')}
        </span>
      )}
      {target.progressionType === 'increase-load' && target.weightKg !== null && (
        <span className="text-amber">
          {t('setScreen.deltaHeavier', { delta: formatDelta(prescription) })}
        </span>
      )}
      {prescription.perSide && (
        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
          ⇄ {t('setScreen.eachSide')}
        </span>
      )}
    </p>
  )
}

/** The step the engine just took — the actionable residue of the reason sentence. */
function formatDelta(prescription: ExercisePrescription): number {
  return prescription.weightStepKg ?? 1
}

function effortValue(set: LoggedSet, mode: 'reps' | 'seconds'): number {
  return (mode === 'seconds' ? set.seconds : set.reps) ?? 0
}
