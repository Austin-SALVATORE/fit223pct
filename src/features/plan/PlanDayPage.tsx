import { useLiveQuery } from 'dexie-react-hooks'
import { Link, Navigate, useParams } from 'react-router'
import { exerciseRepo, programRepo, workoutRepo } from '@/data/repositories'
import { projectSchedule, type ScheduleDay } from '@/domain/schedule'
import { summarizeWorkout } from '@/domain/workout'
import { formatLongDate, parseDateKey, toDateKey } from '@/lib/dates'
import { ACTIVITY_KIND_LABEL } from '@/lib/activityKindLabel'
import { SessionPreview } from '@/features/today/SessionPreview'
import type { ActivityTemplate, Exercise, LoggedSet, SessionTemplate, Workout } from '@/domain/types'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Amendment (19 Jul) to docs/Plan.md: every day row is now clickable.
 * Today's row still links straight to Today — this page redirects there
 * rather than duplicating it.
 */
export function PlanDayPage() {
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
      <h1 className="text-display mt-6 text-4xl text-ink">{formatLongDate(parseDateKey(date))}</h1>
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
  if (day.workout && day.workout.completedAt !== null) {
    return (
      <CompletedDetail
        workout={day.workout}
        sessionName={day.session?.name ?? 'Session'}
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

  return (
    <p className="mt-6 leading-relaxed text-ink-secondary">
      Nothing was logged this day — the session shifted forward, nothing was lost.
    </p>
  )
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
  const summary = summarizeWorkout(workout)
  const loggedExercises = workout.exercises.filter((e) => e.sets.length > 0)

  return (
    <>
      <p className="mt-1 text-ink-secondary">{sessionName}</p>
      <p className="mt-4 text-sm text-ink-tertiary" data-numeric>
        {summary.totalSets} {summary.totalSets === 1 ? 'set' : 'sets'} ·{' '}
        {Math.round(summary.volumeKg)} kg
        {summary.durationMinutes !== null &&
          ` · ${summary.durationMinutes} ${summary.durationMinutes === 1 ? 'minute' : 'minutes'}`}
      </p>

      <h2 className="eyebrow mt-8">Exercises</h2>
      <ul
        aria-label="Logged exercises"
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
  return (
    <>
      <p className="mt-1 text-sm font-medium text-amber">Projected</p>
      <p className="mt-4 text-sm leading-relaxed text-ink-tertiary">
        Projected sessions assume every session between now and then gets completed — the
        rotation follows what you complete, not the date, so a missed day shifts everything
        after it.
      </p>
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
  return (
    <>
      <p className="mt-1 text-sm font-medium text-amber">{ACTIVITY_KIND_LABEL[activity.kind]}</p>
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
  return (
    <div>
      <BackToPlan />
      <p className="mt-10 text-ink-secondary">This date isn't part of this phase.</p>
    </div>
  )
}

function BackToPlan() {
  return (
    <Link
      to="/plan"
      className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
    >
      <span aria-hidden="true">←</span> Plan
    </Link>
  )
}

function formatLoggedSet(set: LoggedSet, mode: 'reps' | 'seconds'): string {
  const effort = mode === 'seconds' ? `${set.seconds}s` : `${set.reps}`
  const weight = set.weightKg !== null ? ` × ${set.weightKg} kg` : ''
  const rir = set.rir !== null ? `, RIR ${set.rir}` : ''
  return `${effort}${weight}${rir}`
}
