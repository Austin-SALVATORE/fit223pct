import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Stepper } from '@/ui/Stepper'
import { ConfirmAction } from '@/ui/ConfirmAction'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
import { nextSetTarget } from '@/domain/nextSetTarget'
import { plannedSetIndices } from '@/domain/workout'
import { useExerciseName } from '@/i18n/seedExercise'
import { usePrescriptionNote } from '@/i18n/seedProgram'
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
  /** Feeds `<LastTime>` only — what the athlete actually lifted, real information regardless of equipment verification. */
  previousSets: readonly LoggedSet[]
  exerciseById: Map<string, Exercise>
  programId: string
  /** 'imported' skips locale-key resolution entirely — see i18n/seedProgram.ts */
  programOrigin?: Program['origin']
  sessionId: string
  onLog: (set: Omit<LoggedSet, 'setIndex'>) => void
  onSwap: (exerciseId: string) => void
  /**
   * Opens one extra set slot (coach spec §4), gated by the caller
   * (Green Build only, max 2, disabled Yellow/Deload — WorkoutPage.tsx).
   */
  onAddSet: () => void
  canAddSet: boolean
  /**
   * Removes the set in front of you — a prescribed level (this screen
   * confirms first) or an unfilled custom slot (removed immediately, no
   * confirmation — only a prescribed level's removal needs one, §4).
   */
  onRemoveSet: () => void
}

export function SetScreen({
  workoutExercise,
  exercise,
  setIndex,
  previousSets,
  exerciseById,
  programId,
  programOrigin,
  sessionId,
  onLog,
  onSwap,
  onAddSet,
  canAddSet,
  onRemoveSet,
}: SetScreenProps) {
  const { t } = useTranslation('workout')
  const exerciseName = useExerciseName(exercise.id)
  const { prescription } = workoutExercise
  const note = usePrescriptionNote(programId, sessionId, prescription, programOrigin)
  // A custom slot (Add Set) is never a prescribed level — index at or past
  // prescription.sets, matching workout.ts's plannedSetIndices exactly.
  const isCustomSlot = setIndex >= prescription.sets
  const [confirmingSkip, setConfirmingSkip] = useState(false)
  /*
    The progression *reason* is no longer read here — it moves to the rest
    screen, where education belongs ("education only during rest"). Under
    carry-forward there is no computed reason any more (28 Aug 2026, Phase
    3) — the offered numbers are exactly what was last logged, echoed, not
    decided — so there is no residue left to caption here either.
  */

  /**
   * **Resolved in the domain, not here.** The rest screen renders the same
   * call, so the two cannot disagree — a rest screen that recomputed from the
   * prescription would show the ladder rung while this screen offers the
   * weight you just lifted, and the user would load the wrong one. See
   * `nextSetTarget`.
   *
   * `prescription` is already the carried-forward one — `workoutExercise`
   * arrives from `WorkoutPage` with carry-forward already applied
   * (`domain/carryForward.ts`), so this call only ever reads it, never
   * computes from history itself.
   */
  const target = nextSetTarget(prescription, workoutExercise.sets, setIndex)

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

  // Session-aware: a skipped level is never counted, an opened custom slot
  // is (coach spec §4, "Set 2 of 4 ... after a skip it must say of 3").
  const planned = plannedSetIndices(workoutExercise)
  const setPosition = planned.indexOf(setIndex) + 1
  const totalPlannedSets = planned.length

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4">
        <p id={setProgressId} className="eyebrow">
          {t('setScreen.setProgress', { setIndex: setPosition, totalSets: totalPlannedSets })}
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
        {/*
          A custom set is never a Pyramid level (coach spec §4) — this says
          so up front, rather than leaving the athlete to infer it from the
          target caption reading "Target · 8–12 reps" with no rung number.
        */}
        {isCustomSlot && (
          <p className="mt-1 text-sm font-medium text-amber">{t('setScreen.customSet')}</p>
        )}
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
          isCustomSlot={isCustomSlot}
        />

        {confirmingSkip ? (
          // Replaces the log action in place — same pattern as SwapSheet's
          // ConfirmClear (ConfirmAction's own doc): the control the user
          // just acted on is what claims focus for the confirm step.
          <div className="mt-8">
            <ConfirmAction
              heading={t('setScreen.skipConfirmHeading')}
              warning={t('setScreen.skipConfirmWarning')}
              confirmLabel={t('setScreen.skipConfirmAction')}
              cancelLabel={t('setScreen.skipConfirmCancel')}
              onConfirm={() => {
                setConfirmingSkip(false)
                onRemoveSet()
              }}
              onCancel={() => setConfirmingSkip(false)}
            />
          </div>
        ) : (
          <>
            <motion.button
              type="button"
              onClick={handleLog}
              whileTap={reducedMotion ? undefined : { scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="mt-8 w-full rounded-card bg-amber py-4 text-center text-lg font-semibold text-bg"
            >
              {isSeconds ? t('setScreen.logHold') : t('setScreen.logSet')}
            </motion.button>

            {/* Below the log action, coach spec §4 — Add Set and Remove this set. */}
            <div className="mt-3 flex items-center justify-center gap-2">
              {!isCustomSlot && canAddSet && (
                <button
                  type="button"
                  onClick={onAddSet}
                  className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
                >
                  {t('setScreen.addSet')}
                </button>
              )}
              <button
                type="button"
                onClick={() => (isCustomSlot ? onRemoveSet() : setConfirmingSkip(true))}
                className="inline-flex min-h-11 items-center rounded-full px-4 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
              >
                {t('setScreen.removeSet')}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2">
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
          </>
        )}
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
  isCustomSlot,
}: {
  id: string
  prescription: ExercisePrescription
  target: NextSetTarget
  setIndex: number
  /** A custom slot (Add Set) is never "Rung N of M" — it has no rung. */
  isCustomSlot: boolean
}) {
  const { t } = useTranslation('workout')
  const { t: tCommon } = useTranslation('common')
  const isSeconds = prescription.mode === 'seconds'

  /**
   * QA-found, 12 Aug 2026 (same defect class already fixed once in
   * `SessionPreview.formatPrescription` — `c322497` — but that commit
   * never touched this, a second independent formatter over the same
   * setPlan/mode data). `setScreen.targetRung` used to build
   * unconditionally with `weight: target.prescribed.weightKg ?? '–'`, so
   * a null-weight ladder (bicycle-crunch, incline-push-up) captioned
   * "– kg × 15", and a seconds-mode null-weight ladder (plank) captioned
   * "– kg × –" — the duration wasn't dashed for lack of a value, it was
   * dashed because this code only ever read `target.prescribed.reps`,
   * which `nextSetTarget.ts` sets to null in seconds mode; the real value
   * sits in `target.prescribed.seconds` instead.
   *
   * Four distinct locale keys, not one parameterised string with a
   * conditional unit — same reasoning as the ramp-row fix (U-1): a
   * caption that states "kg" is a prose claim, and a wrong claim here is
   * mid-set guidance the athlete is actively acting on, not a summary
   * they can cross-check later.
   */
  const rung = setIndex + 1
  const total = prescription.setPlan?.length ?? 0
  // The *advanced* rung, from the same resolution the card used. Reading
  // `prescription.setPlan[setIndex]` here would show the authored ladder
  // and caption "8 kg" under a card offering 10.
  const weight = target.prescribed.weightKg
  const effort = (isSeconds ? target.prescribed.seconds : target.prescribed.reps) ?? '–'

  const targetText = isCustomSlot
    ? t('setScreen.targetCustom')
    : !prescription.setPlan
      ? t(isSeconds ? 'setScreen.targetSecondsRange' : 'setScreen.targetRepRange', {
          min: prescription.range.min,
          max: prescription.range.max,
        })
      : weight !== null
        ? isSeconds
          ? t('setScreen.targetRungWeightedSeconds', { rung, total, weight, seconds: effort })
          : t('setScreen.targetRung', { rung, total, weight, reps: effort })
        : isSeconds
          ? t('setScreen.targetRungSeconds', { rung, total, seconds: effort })
          : t('setScreen.targetRungReps', { rung, total, reps: effort })

  return (
    <p id={id} className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-ink-tertiary">
      <span>{targetText}</span>
      {/*
        MAX / TECHNIQUE / "+2 kg" pills removed, 28 Aug 2026 (Phase 3,
        `~/.claude/plans/progression-carry-forward.md`) — all three read
        `NextSetTarget.progressionType`, the deleted engine's own
        decision-classification vocabulary (`progression.ts`, deleted this
        same batch). Under carry-forward there is no decision to classify:
        the offered numbers are exactly what was last logged, echoed, never
        computed — "MAX" has nothing to contrast with, and neither does a
        "+2 kg" that no arithmetic produced. See `nextSetTarget.ts`'s own
        docblock.
      */}
      {/*
        How this rung differs from the default form, when the coach
        prescribed one — e.g. "Bodyweight slow" for level 2 of a push-up
        ladder whose level 1 is plain bodyweight. Closed vocabulary, never
        prose (docs/design/Mesocycle2Implementation.md §6.1); shared across
        every exercise via common:setVariant rather than a key per level
        per exercise. Carry-forward preserves an authored `variantKey` onto
        the carried rung (`carryForward.ts`'s `carriedRung`), so this keeps
        rendering unchanged — see the coach's Q2 ruling, tempo content
        survives retiring the automatic tempo-progression pathway.
      */}
      {target.variantKey && (
        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
          {tCommon(`setVariant.${target.variantKey}`)}
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

function effortValue(set: LoggedSet, mode: 'reps' | 'seconds'): number {
  return (mode === 'seconds' ? set.seconds : set.reps) ?? 0
}
