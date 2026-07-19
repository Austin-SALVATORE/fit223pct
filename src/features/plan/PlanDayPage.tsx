import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router'
import { exerciseRepo, programRepo, workoutRepo } from '@/data/repositories'
import { projectSchedule, type ScheduleDay } from '@/domain/schedule'
import { summarizeWorkout } from '@/domain/workout'
import { formatLongDate, parseDateKey, toDateKey } from '@/lib/dates'
import { useActivityKindLabel } from '@/lib/activityKindLabel'
import { useLocale } from '@/i18n/useLocale'
import { SessionPreview } from '@/features/today/SessionPreview'
import type { ActivityTemplate, Exercise, LoggedSet, SessionTemplate, Workout } from '@/domain/types'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

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
      <DayDetailBody day={data.day} exerciseById={data.exerciseById} date={date} />
    </div>
  )
}

function DayDetailBody({
  day,
  exerciseById,
  date,
}: {
  day: ScheduleDay
  exerciseById: Map<string, Exercise>
  date: string
}) {
  const { t } = useTranslation('plan')

  if (day.workout && day.workout.completedAt !== null) {
    return (
      <CompletedDetail
        workout={day.workout}
        sessionName={day.session?.name ?? t('sessionFallback')}
        exerciseById={exerciseById}
        date={date}
      />
    )
  }

  if (day.activity) {
    return <ActivityDetail activity={day.activity} />
  }

  if (day.session) {
    return <ProjectedDetail session={day.session} exerciseById={exerciseById} date={date} />
  }

  return <p className="mt-6 leading-relaxed text-ink-secondary">{t('dayDetail.nothingLogged')}</p>
}

function CompletedDetail({
  workout,
  sessionName,
  exerciseById,
  date,
}: {
  workout: Workout
  sessionName: string
  exerciseById: Map<string, Exercise>
  date: string
}) {
  const { t } = useTranslation('plan')
  const formatLoggedSet = useFormatLoggedSet()
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
        {loggedExercises.map((we) => {
          const exercise = exerciseById.get(we.exerciseId)
          return (
            <li key={we.exerciseId} className="px-4 py-3.5">
              {exercise ? (
                <Link
                  to={`/library/${exercise.id}`}
                  state={{ from: 'plan-day', date }}
                  className="font-medium text-ink transition-colors hover:text-amber"
                >
                  {exercise.name}
                </Link>
              ) : (
                <p className="font-medium text-ink">{we.exerciseId}</p>
              )}
              <p className="mt-1 text-sm text-ink-secondary" data-numeric>
                {we.sets.map((set) => formatLoggedSet(set, we.prescription.mode)).join(' · ')}
              </p>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function ProjectedDetail({
  session,
  exerciseById,
  date,
}: {
  session: SessionTemplate
  exerciseById: Map<string, Exercise>
  date: string
}) {
  const { t } = useTranslation('plan')
  return (
    <>
      <p className="mt-1 text-sm font-medium text-amber">{t('dayDetail.projectedLabel')}</p>
      <p className="mt-4 text-sm leading-relaxed text-ink-tertiary">{t('projectedNote')}</p>
      <SessionPreview
        session={session}
        exerciseById={exerciseById}
        heading={session.name}
        origin={{ from: 'plan-day', date }}
      />
    </>
  )
}

function ActivityDetail({ activity }: { activity: ActivityTemplate }) {
  const kindLabel = useActivityKindLabel(activity.kind)
  return (
    <>
      <p className="mt-1 text-sm font-medium text-amber">{kindLabel}</p>
      <h2 className="text-display mt-1 text-2xl text-ink">{activity.title}</h2>
      <ul className="mt-4 space-y-2">
        {activity.items.map((item, index) => (
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
    const rir = set.rir !== null ? t('dayDetail.rirSuffix', { rir: set.rir }) : ''
    return `${effort}${weight}${rir}`
  }
}
