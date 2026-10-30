import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'motion/react'
import { summarizeWorkout } from '@/domain/workout'
import { coachInsight, workoutHighlights, type Highlight } from '@/domain/highlights'
import { formatVolume } from '@/lib/formatVolume'
import { formatNumber } from '@/ui/Stepper'
import { spokenSet } from '@/features/today/spokenSet'
import { useFocusOnMount } from '@/lib/useFocusOnMount'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'
import { useExerciseName } from '@/i18n/seedExercise'
import type { Exercise, Workout, WorkoutExercise } from '@/domain/types'

interface SessionSummaryProps {
  workout: Workout
  exerciseById: Map<string, Exercise>
  /** Completed workouts for comparison — may safely include this workout */
  history: readonly Workout[]
}

export function SessionSummary({ workout, exerciseById, history }: SessionSummaryProps) {
  const { t, i18n } = useTranslation('workout')
  const { t: tCommon } = useTranslation('common')
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
      <p className="text-sm font-medium text-sage">{t('sessionSummary.eyebrow')}</p>
      <h1 ref={headingRef} tabIndex={-1} className="text-display mt-2 text-5xl text-ink">
        {t('sessionSummary.heading')}
      </h1>
      <p className="mt-4 max-w-[36ch] leading-relaxed text-ink-secondary">{insight}</p>

      {/* `flex-wrap`: see WeeklyReviewCard — a tile that does not fit at 320px moves to the next row whole. */}
      <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
        {summary.durationMinutes !== null && (
          <Stat label={t('sessionSummary.statMinutes')} value={String(summary.durationMinutes)} />
        )}
        <Stat label={t('sessionSummary.statSets')} value={String(summary.totalSets)} />
        <Stat label={t('sessionSummary.statVolume')} value={`${formatVolume(summary.volumeKg, i18n.language)} kg`} />
      </dl>

      <ul className="mt-10 space-y-4">
        {workout.exercises
          // A fully-skipped exercise (every prescribed level in
          // skippedLevels, zero logged sets, no custom slots) must still
          // appear — coach spec §4: "retain it in the audit history."
          // sets.length alone can be 0 for real, non-empty work.
          .filter((e) => e.sets.length > 0 || (e.skippedLevels?.length ?? 0) > 0)
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
        {tCommon('done')}
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
  const { t } = useTranslation('workout')
  const label = useTranslatedMessage(highlight?.label ?? { key: 'domain:highlight.steady' })
  const topSet = useTopSetLabel(workoutExercise)
  const exerciseName = useExerciseName(exercise?.id ?? workoutExercise.exerciseId)
  const customCount = workoutExercise.sets.filter((s) => s.custom).length
  const skippedCount = workoutExercise.skippedLevels?.length ?? 0
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
      <div className="min-w-0">
        <p className="text-ink">{exercise ? exerciseName : workoutExercise.exerciseId}</p>
        {topSet !== null && (
          <>
            {/*
              A14 remainder (batch A2): "4 sets · top 12 × 14 kg" is read "...middle
              dot ... 12 times 14 kilograms". Visible text unchanged and hidden from
              assistive technology; "4 sets, top set: 12 reps at 14 kg" follows.
            */}
            <p className="mt-0.5 text-sm text-ink-tertiary" data-numeric aria-hidden="true">
              {topSet.visible}
            </p>
            <p className="sr-only">{topSet.spoken}</p>
          </>
        )}
        {/*
          Coach spec §4, "surfaces in four places" — this is the summary's.
          Both can be true at once (a skipped level and an added set on the
          same exercise), so both render rather than picking one.
        */}
        {(customCount > 0 || skippedCount > 0) && (
          <p className="mt-0.5 text-sm text-ink-tertiary">
            {customCount > 0 && t('sessionSummary.customCount', { count: customCount })}
            {customCount > 0 && skippedCount > 0 && ' · '}
            {skippedCount > 0 && t('sessionSummary.skippedCount', { count: skippedCount })}
          </p>
        )}
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

/** Null for a fully-skipped exercise — zero logged sets means no "top set" to report. */
function useTopSetLabel(workoutExercise: WorkoutExercise): { visible: string; spoken: string } | null {
  const { t, i18n } = useTranslation('workout')
  const sets = workoutExercise.sets
  if (sets.length === 0) return null
  const best = sets.reduce((top, set) => {
    const effort = (set.weightKg ?? 0) * (set.reps ?? 0)
    const topEffort = (top.weightKg ?? 0) * (top.reps ?? 0)
    return effort > topEffort ? set : top
  })
  const countPhrase = t('sessionSummary.setCount', { count: sets.length })
  // The weight as the language writes it ("17,75" in French), formatted once and used
  // by the visible line and the spoken one, so the two cannot disagree. Interpolating
  // the number itself printed a point in every language.
  const weightText = best.weightKg !== null ? formatNumber(best.weightKg, i18n.language) : null
  const detail =
    weightText !== null && best.reps !== null
      ? t('sessionSummary.topWeightReps', { reps: best.reps, weight: weightText })
      : best.seconds !== null
        ? t('sessionSummary.topSeconds', { seconds: best.seconds })
        : t('sessionSummary.topReps', { reps: best.reps ?? 0 })
  // The spoken line differs from the visible one only where the visible has a
  // glyph: the weighted-reps detail ("12 × 14 kg") becomes "12 reps at 14 kg", and
  // the "·" before "top" becomes a comma. Seconds and bare-reps details are words
  // already and are reused as they are.
  const detailSpoken =
    weightText !== null && best.reps !== null
      ? spokenSet(t, {
          weight: weightText,
          effort: String(best.reps),
          effortCount: best.reps,
          mode: 'reps',
        })
      : detail
  return {
    visible: t('sessionSummary.topSetLine', {
      countPhrase,
      detail: best.assisted ? t('sessionSummary.assistedDetail', { detail }) : detail,
    }),
    spoken: t('sessionSummary.topSetLineSpoken', {
      countPhrase,
      detail: best.assisted ? t('sessionSummary.assistedDetail', { detail: detailSpoken }) : detailSpoken,
    }),
  }
}
