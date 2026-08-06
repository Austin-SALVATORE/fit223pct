import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
import { TimerRing } from '@/ui/TimerRing'
import { formatNumber } from '@/ui/Stepper'
import {
  useExerciseCues,
  useExerciseName,
  useExerciseTeachingConcept,
} from '@/i18n/seedExercise'
import { nextSetTarget, type NextSetTarget } from '@/domain/nextSetTarget'
import { previousSetsFor, type WorkoutPosition } from '@/domain/workout'
import { exerciseAsset, exerciseAssetThumbnailFrame } from '@/lib/exerciseAsset'
import type { ReadinessTier } from '@/domain/readiness'
import type { Exercise, ExercisePrescription, Workout } from '@/domain/types'

interface RestScreenProps {
  endsAt: number
  totalSeconds: number
  exerciseChanged: boolean
  workout: Workout
  /** Position of the NEXT set (data is already updated when rest begins) */
  position: WorkoutPosition
  exerciseById: Map<string, Exercise>
  /** Completed workouts — needed to resolve the next exercise's own history, which is not what `WorkoutPage` computed `previousSets` for (that's the exercise just finished). */
  completed: readonly Workout[]
  readinessTier?: ReadinessTier
  onDone: () => void
}

export function RestScreen({
  endsAt: initialEndsAt,
  totalSeconds,
  exerciseChanged,
  workout,
  position,
  exerciseById,
  completed,
  readinessTier,
  onDone,
}: RestScreenProps) {
  const { t } = useTranslation('workout')
  const [endsAt, setEndsAt] = useState(initialEndsAt)
  const [remaining, setRemaining] = useState(() => secondsLeft(initialEndsAt))
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const nextUpId = useId()

  useEffect(() => {
    const tick = setInterval(() => setRemaining(secondsLeft(endsAt)), 250)
    return () => clearInterval(tick)
  }, [endsAt])

  useEffect(() => {
    if (remaining <= 0) onDone()
  }, [remaining, onDone])

  const nextWorkoutExercise = workout.exercises[position.exerciseIndex]
  const exercise = exerciseById.get(nextWorkoutExercise.exerciseId)
  // Called unconditionally, before the early return below, so hook order
  // stays stable whether or not `exercise` resolves.
  const exerciseName = useExerciseName(exercise?.id ?? '')
  if (!exercise) return null

  const total = Math.max(totalSeconds, Math.ceil((endsAt - Date.now()) / 1000))

  /**
   * **The same resolution the set screen uses, never a second one.** A rest
   * screen that recomputed from the prescription would show the ladder rung
   * while the set screen offers the weight you just lifted — the user loads
   * one number and is then offered another. See `nextSetTarget`'s module doc.
   */
  const previousSets = previousSetsFor(completed, nextWorkoutExercise.exerciseId)
  const target = nextSetTarget(
    nextWorkoutExercise.prescription,
    nextWorkoutExercise.sets,
    previousSets,
    position.setIndex,
    readinessTier,
  )

  /*
    There is no rest screen after the final set — logging it routes straight
    to the summary (WorkoutPage.tsx's handleLog never enters the `resting`
    phase for it). So the state to design for is not "rest, then the session
    ends"; it is "the set being rested before is the final one".
  */
  const isLastSet =
    position.exerciseIndex === workout.exercises.length - 1 &&
    position.setIndex === nextWorkoutExercise.prescription.sets - 1

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {/*
        A heading, not a <p aria-label>. `role="paragraph"` prohibits author
        naming, so the old aria-label was either dropped by assistive tech or
        read *instead of* "Rest" — and the screen had no heading at all
        (docs/review-backlog.md A3).

        The context that label carried is not lost: it is the same text the
        next-up block below already displays, so that block is wired as this
        heading's description rather than duplicated into a name. Visible
        text stays the accessible name, which is also what keeps
        voice-control working.

        `aria-describedby` points at the identity+numbers card only — never
        at the coaching card. A concept can run to 302 characters in French;
        wrapping it into this description would recite a paragraph on mount.
      */}
      <h2 ref={headingRef} tabIndex={-1} aria-describedby={nextUpId} className="eyebrow">
        {t('resting.heading')}
      </h2>

      <TimerRing remaining={remaining} total={total} size="md" />

      <div className="mt-4 flex gap-3">
        <RestButton label={t('resting.plusThirty')} onClick={() => setEndsAt((prev) => prev + 30_000)} />
        <RestButton label={t('resting.skip')} onClick={onDone} />
      </div>

      <NextUpCard
        id={nextUpId}
        exercise={exercise}
        exerciseName={exerciseName}
        prescription={nextWorkoutExercise.prescription}
        target={target}
        setIndex={position.setIndex}
        isNewExercise={exerciseChanged}
        isLastSet={isLastSet}
      />

      <CoachingCard exercise={exercise} setIndex={position.setIndex} isNew={exerciseChanged} />
    </div>
  )
}

function RestButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
    >
      {label}
    </button>
  )
}

interface NextUpCardProps {
  id: string
  exercise: Exercise
  exerciseName: string
  prescription: ExercisePrescription
  target: NextSetTarget
  setIndex: number
  isNewExercise: boolean
  isLastSet: boolean
}

/**
 * Three layouts, not one layout with a word swapped:
 *
 * - **last set** — resting before the final set of the session. Takes
 *   priority over the other two regardless of `isNewExercise`, because a
 *   single-set final exercise can be both "new" and "last" at once. Compact,
 *   no illustration, no flourish: "skipping is always fine, nothing guilts"
 *   is exactly the rule a finish-strong moment would erode.
 * - **next set, same exercise** — "what changed": small identity line, the
 *   numbers, and a delta against the set just logged when the weight moved.
 * - **next exercise** — "what it is": full identity (name, illustration,
 *   set/rest meta), the numbers, and the target range/chips a new exercise
 *   needs that a familiar one doesn't.
 *
 * All three render the same numbers, resolved once by `nextSetTarget` — see
 * that module's doc for why recomputing here would risk disagreeing with
 * the set screen.
 */
function NextUpCard({
  id,
  exercise,
  exerciseName,
  prescription,
  target,
  setIndex,
  isNewExercise,
  isLastSet,
}: NextUpCardProps) {
  const { t } = useTranslation('workout')

  if (isLastSet) {
    return (
      <div id={id} className="mt-8 w-full rounded-card border border-border bg-surface p-5 text-left">
        <p className="eyebrow text-amber">
          {t('resting.lastSet.label', { setIndex: setIndex + 1, totalSets: prescription.sets })}
        </p>
        <p className="mt-1 text-sm text-ink-tertiary">{exerciseName}</p>
        <HeroNumbers prescription={prescription} target={target} className="mt-2" />
        <p className="mt-2 text-sm text-ink-tertiary">{t('resting.lastSet.sessionDone')}</p>
      </div>
    )
  }

  if (!isNewExercise) {
    return (
      <div id={id} className="mt-8 w-full rounded-card border border-border bg-surface p-5 text-left">
        <p className="eyebrow">
          {t('resting.nextSet.label', { setIndex: setIndex + 1, totalSets: prescription.sets })}
        </p>
        <p className="mt-1 text-sm text-ink-tertiary">{exerciseName}</p>
        <HeroNumbers prescription={prescription} target={target} className="mt-2" />
        <NextSetDelta target={target} />
      </div>
    )
  }

  return (
    <NewExerciseCard
      id={id}
      exercise={exercise}
      exerciseName={exerciseName}
      prescription={prescription}
      target={target}
    />
  )
}

/**
 * The actionable residue of a load change — never a zero delta, per
 * `nextSetTarget.delta`'s own contract. Reps-only movement (e.g. an
 * `add-reps` step) is deliberately silent here, matching the two states the
 * design spec enumerates for this screen: weight carried (no line) and
 * weight changed (this line). The weight is what asks something of you
 * during rest — go change the dumbbells — which is the same argument the
 * timer-ring size trade already makes.
 */
function NextSetDelta({ target }: { target: NextSetTarget }) {
  const { t } = useTranslation('workout')
  if (!target.delta || target.delta.weightKg === 0) return null
  const heavier = target.delta.weightKg > 0
  return (
    <p className="mt-2 text-sm text-amber">
      {t(heavier ? 'resting.nextSet.heavier' : 'resting.nextSet.lighter', {
        delta: Math.abs(target.delta.weightKg),
      })}
    </p>
  )
}

function NewExerciseCard({
  id,
  exercise,
  exerciseName,
  prescription,
  target,
}: {
  id: string
  exercise: Exercise
  exerciseName: string
  prescription: ExercisePrescription
  target: NextSetTarget
}) {
  const { t } = useTranslation('workout')
  const [artFailed, setArtFailed] = useState(false)
  const frame = exerciseAssetThumbnailFrame(exercise.id)
  const art = frame === null ? null : exerciseAsset(exercise.id, 'frame', frame)

  return (
    <div
      id={id}
      className="mt-8 w-full rounded-card border border-border bg-surface p-5 text-left [@media(max-height:700px)]:mt-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{t('resting.nextUp.label')}</p>
          <p className="text-display mt-1 text-xl text-ink">{exerciseName}</p>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            {t('resting.nextUp.meta', { count: prescription.sets, restSeconds: prescription.restSeconds })}
          </p>
        </div>
        {/*
          alt="" and out of the tab order, same as the set screen's
          illustration band — the name beside it already carries the
          information, so the image never carries it alone. Shrinks under a
          short viewport rather than pushing the numbers off; see the set
          screen's IllustrationBand for the equivalent budget trade.
        */}
        {art && !artFailed && (
          <img
            src={art.url}
            width={art.width}
            height={art.height}
            alt=""
            decoding="async"
            onError={() => setArtFailed(true)}
            className="h-24 w-auto shrink-0 object-contain [@media(max-height:700px)]:h-16"
          />
        )}
      </div>
      <HeroNumbers prescription={prescription} target={target} className="mt-3" />
      <NewExerciseCaption prescription={prescription} target={target} />
    </div>
  )
}

/**
 * The target range/MAX-pill/load-not-the-lever-pill/variant-chip/per-side
 * chip a new exercise needs and a familiar one doesn't — the same
 * decorations `SetScreen`'s TargetCaption renders, reusing its locale keys
 * rather than duplicating the wording.
 */
function NewExerciseCaption({
  prescription,
  target,
}: {
  prescription: ExercisePrescription
  target: NextSetTarget
}) {
  const { t } = useTranslation('workout')
  const { t: tCommon } = useTranslation('common')
  const isSeconds = prescription.mode === 'seconds'
  // A ladder's number already is the exact target — no range to show. Only
  // rep-range work has a range wider than the single value on screen.
  const showRange = !prescription.setPlan
  const showMax = target.progressionType === 'at-equipment-max'
  // A different pill for a different reason not to advance — never both at
  // once. See SetScreen's TargetCaption for the full reasoning; reused here
  // rather than re-derived so the two screens cannot disagree.
  const showLoadNotTheLever = target.progressionType === 'load-not-the-lever'
  const showPerSide = prescription.perSide

  if (!showRange && !showMax && !showLoadNotTheLever && !target.variantKey && !showPerSide) return null

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-tertiary">
      {showRange && (
        <span>
          {t(isSeconds ? 'setScreen.targetSecondsRange' : 'setScreen.targetRepRange', {
            min: prescription.range?.min,
            max: prescription.range?.max,
          })}
        </span>
      )}
      {showMax && (
        <span className="rounded-full border border-amber px-2 py-0.5 text-xs font-semibold text-amber">
          {t('setScreen.atMax')}
        </span>
      )}
      {showLoadNotTheLever && (
        <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-ink-secondary">
          {t('setScreen.loadNotTheLever')}
        </span>
      )}
      {/* See SetScreen's TargetCaption for the full reasoning — reused
          here so the two screens render the same variant, never a
          re-derived one. */}
      {target.variantKey && (
        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
          {tCommon(`setVariant.${target.variantKey}`)}
        </span>
      )}
      {showPerSide && (
        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
          ⇄ {t('setScreen.eachSide')}
        </span>
      )}
    </p>
  )
}

/**
 * The number this whole screen exists to make prominent, sized the same
 * across all three card layouts. Rendered from `nextSetTarget`'s output
 * only — see the module doc for why recomputing it here would risk
 * disagreeing with the set screen.
 */
function HeroNumbers({
  prescription,
  target,
  className = '',
}: {
  prescription: ExercisePrescription
  target: NextSetTarget
  className?: string
}) {
  const { t } = useTranslation('workout')
  const { t: tCommon, i18n } = useTranslation('common')
  const isSeconds = prescription.mode === 'seconds'

  const value = isSeconds
    ? // The seconds marker is keyed rather than a bare "s": zh-CN writes 秒,
      // not a Latin letter (I3, matching SetScreen's LastTime).
      `${target.seconds !== null ? formatNumber(target.seconds, i18n.language) : '–'}${tCommon('unitSeconds')}`
    : target.weightKg !== null
      ? t('resting.numbers.weightReps', {
          weight: formatNumber(target.weightKg, i18n.language),
          reps: target.reps ?? '–',
        })
      : // Unloaded work never renders "× 10" with nothing before it.
        t('resting.numbers.reps', { reps: target.reps ?? '–' })

  return (
    <p data-numeric className={`text-[2.5rem] font-semibold leading-none text-ink ${className}`}>
      {value}
    </p>
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
  const concept = useExerciseTeachingConcept(exercise.id)
  const cues = useExerciseCues(exercise.id)
  const [expanded, setExpanded] = useState(false)
  const bodyId = useId()

  if (isNew && concept) {
    return (
      <div className="mt-4 w-full rounded-card border border-border bg-surface text-left">
        {/*
          A <button> wrapping a <p>, not a heading. The concept title was
          already a <p> before this redesign; promoting it to an <h3> here
          would plant a fresh instance of backlog A9 (a heading inside a
          button) in the same change that's fixing accessibility elsewhere.
          Collapsed by default, and per-mount state rather than persisted —
          this is a per-rest decision, not a preference.
        */}
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((value) => !value)}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-5 py-3 text-left"
        >
          <p className="eyebrow">{concept.title}</p>
          <span aria-hidden="true" className="shrink-0 text-ink-tertiary">
            {expanded ? '⌃' : '⌄'}
          </span>
        </button>
        {expanded && (
          <p id={bodyId} className="px-5 pb-5 text-sm leading-relaxed text-ink-secondary">
            {concept.body}
          </p>
        )}
      </div>
    )
  }
  const cue = cues[setIndex % cues.length]
  if (!cue) return null
  return (
    <p className="mt-8 max-w-[32ch] text-sm leading-relaxed text-ink-secondary">“{cue}”</p>
  )
}

function secondsLeft(endsAt: number): number {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
}
