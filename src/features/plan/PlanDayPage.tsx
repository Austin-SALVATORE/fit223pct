import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router'
import { exerciseRepo, programRepo, workoutRepo } from '@/data/repositories'
import { projectSchedule, type ScheduleDay } from '@/domain/schedule'
import { summarizeWorkout } from '@/domain/workout'
import { formatLongDate, isoWeekday, parseDateKey, toDateKey, type IsoWeekday } from '@/lib/dates'
import { useActivityKindLabel } from '@/lib/activityKindLabel'
import { useExerciseName } from '@/i18n/seedExercise'
import { useLocalizedActivity, useSessionName } from '@/i18n/seedProgram'
import { useLocale } from '@/i18n/useLocale'
import { SessionPreview } from '@/features/today/SessionPreview'
import type { ActivityTemplate, Exercise, LoggedSet, Program, SessionTemplate, Workout } from '@/domain/types'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Never rendered — see CompletedDetail's resolvedSessionName comment. */
const EMPTY_SESSION: SessionTemplate = { id: '', name: '', focus: '', items: [] }

/**
 * Amendment (19 Jul) to docs/Plan.md: every day row is now clickable.
 * Today's row still links straight to Today — this page redirects there
 * rather than duplicating it.
 */
export function PlanDayPage() {
  const locale = useLocale()
  const { date } = useParams<{ date: string }>()
  const validDate = typeof date === 'string' && DATE_KEY_PATTERN.test(date)
  const todayKey = toDateKey(new Date())

  const data = useLiveQuery(async () => {
    if (!validDate || !date) return null
    const [program, exercises, workouts] = await Promise.all([
      programRepo.getActive(date),
      exerciseRepo.getAll(),
      workoutRepo.getCompleted(),
    ])
    if (!program) return { day: null }
    const days = projectSchedule(program, workouts, new Date())
    return {
      day: days.find((d) => d.date === date) ?? null,
      exerciseById: new Map(exercises.map((e) => [e.id, e])),
      programId: program.id,
      programOrigin: program.origin,
      schedulingMode: program.schedulingMode,
    }
  }, [date, validDate])

  if (!validDate || !date) return <NotPartOfPhase />
  if (date === todayKey) return <Navigate to="/" replace />
  if (data === undefined) return null
  if (data === null || data.day === null || !data.exerciseById) return <NotPartOfPhase />

  return (
    <div>
      <BackToPlan />
      <h1 className="text-display mt-6 text-4xl text-ink">{formatLongDate(parseDateKey(date), locale)}</h1>
      <DayDetailBody
        day={data.day}
        exerciseById={data.exerciseById}
        date={date}
        programId={data.programId}
        programOrigin={data.programOrigin}
        schedulingMode={data.schedulingMode}
      />
    </div>
  )
}

function DayDetailBody({
  day,
  exerciseById,
  date,
  programId,
  programOrigin,
  schedulingMode,
}: {
  day: ScheduleDay
  exerciseById: Map<string, Exercise>
  date: string
  programId: string
  programOrigin: Program['origin']
  schedulingMode: Program['schedulingMode']
}) {
  const { t } = useTranslation('plan')

  if (day.workout && day.workout.completedAt !== null) {
    return (
      <CompletedDetail
        workout={day.workout}
        session={day.session ?? undefined}
        programId={programId}
        programOrigin={programOrigin}
        exerciseById={exerciseById}
        date={date}
      />
    )
  }

  if (day.activity) {
    return (
      <ActivityDetail
        programId={programId}
        programOrigin={programOrigin}
        weekday={isoWeekday(parseDateKey(date))}
        activity={day.activity}
      />
    )
  }

  if (day.session) {
    return (
      <ProjectedDetail
        session={day.session}
        programId={programId}
        programOrigin={programOrigin}
        exerciseById={exerciseById}
        date={date}
        schedulingMode={schedulingMode}
      />
    )
  }

  return (
    <p className="mt-6 leading-relaxed text-ink-secondary">
      {t(schedulingMode === 'weekday-pinned' ? 'dayDetail.nothingLoggedPinned' : 'dayDetail.nothingLogged')}
    </p>
  )
}

function CompletedDetail({
  workout,
  session,
  programId,
  programOrigin,
  exerciseById,
  date,
}: {
  workout: Workout
  session: SessionTemplate | undefined
  programId: string
  programOrigin: Program['origin']
  exerciseById: Map<string, Exercise>
  date: string
}) {
  const { t } = useTranslation('plan')
  const formatLoggedSet = useFormatLoggedSet()
  // useSessionName always needs a SessionTemplate; a day.session-less
  // workout is defensive-only (shouldn't happen in practice), so the
  // empty placeholder below is never actually rendered — sessionFallback
  // covers that case instead.
  const resolvedSessionName = useSessionName(programId, session ?? EMPTY_SESSION, programOrigin)
  const sessionName = session ? resolvedSessionName : t('sessionFallback')
  const summary = summarizeWorkout(workout)
  const loggedExercises = workout.exercises.filter((e) => e.sets.length > 0)
  const setsPhrase = t('dayDetail.sets', { count: summary.totalSets })
  const minutesPhrase =
    summary.durationMinutes !== null
      ? t('dayDetail.inMinutes', { count: summary.durationMinutes })
      : ''

  return (
    <>
      <p className="mt-1 text-ink-secondary">{sessionName}</p>
      <p className="mt-4 text-sm text-ink-tertiary" data-numeric>
        {t('dayDetail.summaryLine', {
          setsPhrase,
          volume: Math.round(summary.volumeKg),
          minutesPhrase,
        })}
      </p>

      <h2 className="eyebrow mt-8">{t('dayDetail.exercisesHeading')}</h2>
      <ul
        aria-label={t('dayDetail.loggedExercisesAriaLabel')}
        className="mt-3 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface"
      >
        {loggedExercises.map((we) => (
          <LoggedExerciseRow
            key={we.exerciseId}
            workoutExercise={we}
            exercise={exerciseById.get(we.exerciseId)}
            date={date}
            formatLoggedSet={formatLoggedSet}
          />
        ))}
      </ul>
    </>
  )
}

function LoggedExerciseRow({
  workoutExercise,
  exercise,
  date,
  formatLoggedSet,
}: {
  workoutExercise: Workout['exercises'][number]
  exercise: Exercise | undefined
  date: string
  formatLoggedSet: (set: LoggedSet, mode: 'reps' | 'seconds') => string
}) {
  const exerciseName = useExerciseName(exercise?.id ?? '')
  return (
    <li className="px-4 py-3.5">
      {exercise ? (
        <Link
          to={`/library/${exercise.id}`}
          state={{ from: 'plan-day', date }}
          className="font-medium text-ink transition-colors hover:text-amber"
        >
          {exerciseName}
        </Link>
      ) : (
        <p className="font-medium text-ink">{workoutExercise.exerciseId}</p>
      )}
      <p className="mt-1 text-sm text-ink-secondary" data-numeric>
        {workoutExercise.sets.map((set) => formatLoggedSet(set, workoutExercise.prescription.mode)).join(' · ')}
      </p>
    </li>
  )
}

function ProjectedDetail({
  session,
  programId,
  programOrigin,
  exerciseById,
  date,
  schedulingMode,
}: {
  session: SessionTemplate
  programId: string
  programOrigin: Program['origin']
  exerciseById: Map<string, Exercise>
  date: string
  schedulingMode: Program['schedulingMode']
}) {
  const { t } = useTranslation('plan')
  const sessionName = useSessionName(programId, session, programOrigin)
  return (
    <>
      <p className="mt-1 text-sm font-medium text-amber">{t('dayDetail.projectedLabel')}</p>
      <p className="mt-4 text-sm leading-relaxed text-ink-tertiary">
        {t(schedulingMode === 'weekday-pinned' ? 'projectedNotePinned' : 'projectedNote')}
      </p>
      <SessionPreview
        session={session}
        programId={programId}
        programOrigin={programOrigin}
        exerciseById={exerciseById}
        heading={sessionName}
        origin={{ from: 'plan-day', date }}
      />
    </>
  )
}

function ActivityDetail({
  programId,
  programOrigin,
  weekday,
  activity,
}: {
  programId: string
  programOrigin: Program['origin']
  weekday: IsoWeekday
  activity: ActivityTemplate
}) {
  const kindLabel = useActivityKindLabel(activity.kind)
  const localized = useLocalizedActivity(programId, weekday, activity, programOrigin)
  return (
    <>
      <p className="mt-1 text-sm font-medium text-amber">{kindLabel}</p>
      <h2 className="text-display mt-1 text-2xl text-ink">{localized.title}</h2>
      <ul className="mt-4 space-y-2">
        {localized.items.map((item, index) => (
          <li key={index} className="leading-relaxed text-ink-secondary">
            <span className="text-ink">{item.label}</span>
            {item.detail && <span className="text-ink-tertiary"> — {item.detail}</span>}
          </li>
        ))}
      </ul>
    </>
  )
}

function NotPartOfPhase() {
  const { t } = useTranslation('plan')
  return (
    <div>
      <BackToPlan />
      <p className="mt-10 text-ink-secondary">{t('dayDetail.notPartOfPhase')}</p>
    </div>
  )
}

function BackToPlan() {
  const { t } = useTranslation('common')
  return (
    <Link
      to="/plan"
      className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
    >
      <span aria-hidden="true">←</span> {t('nav.plan')}
    </Link>
  )
}

function useFormatLoggedSet(): (set: LoggedSet, mode: 'reps' | 'seconds') => string {
  const { t } = useTranslation('plan')
  return (set, mode) => {
    const effort = mode === 'seconds' ? t('dayDetail.secondsEffort', { seconds: set.seconds }) : String(set.reps)
    const weight = set.weightKg !== null ? t('dayDetail.weightSuffix', { weight: set.weightKg }) : ''
    return `${effort}${weight}`
  }
}
