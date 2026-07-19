import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { checkinRepo, exerciseRepo, programRepo, settingsRepo, workoutRepo } from '@/data/repositories'
import { resolveDayPlan } from '@/domain/schedule'
import { createWorkout, summarizeWorkout } from '@/domain/workout'
import { describeDrivers, readinessFrom, type Readiness } from '@/domain/readiness'
import { applyReadiness } from '@/domain/adjustments'
import { buildWeeklyReview, reviewIsUnseen, type WeeklyReview } from '@/domain/weeklyReview'
import { formatLongDate, toDateKey } from '@/lib/dates'
import { ACTIVITY_KIND_LABEL } from '@/lib/activityKindLabel'
import type { ActivityTemplate, CheckIn, Exercise, Program, SessionTemplate, Workout } from '@/domain/types'
import { CheckInCard } from '@/features/checkin/CheckInCard'
import { MeasurementCard } from '@/features/checkin/MeasurementCard'
import { SessionPreview } from './SessionPreview'
import { WeeklyReviewCard } from './WeeklyReviewCard'

interface TodayData {
  program: Program | undefined
  exercises: Exercise[]
  activeWorkout: Workout | undefined
  todayWorkout: Workout | undefined
  todayCheckIn: CheckIn | undefined
  recentCheckIns: CheckIn[]
  completedCount: number
  weeklyReview: WeeklyReview | null
  lastSeenWeeklyReviewWeekStart: string | null
}

export function TodayPage() {
  const today = new Date()
  const todayKey = toDateKey(today)
  const reducedMotion = useReducedMotion()

  const data = useLiveQuery(async (): Promise<TodayData> => {
    const [program, exercises, activeWorkout, todayWorkout, todayCheckIn, recentCheckIns, settings] =
      await Promise.all([
        programRepo.getActive(todayKey),
        exerciseRepo.getAll(),
        workoutRepo.getActive(),
        workoutRepo.getByDate(todayKey),
        checkinRepo.getByDate(todayKey),
        // readinessFrom's consecutive-day walk can run well past 14 days —
        // the default window undercounts any streak longer than that.
        checkinRepo.getRecent(60),
        settingsRepo.get(),
      ])
    const completedCount = program ? await workoutRepo.countCompleted(program.id) : 0
    // Not gated to Monday — a review the user hasn't seen yet stays
    // available on every open of the week it covers, never tied to
    // whether they happened to open the app on any one particular day.
    const weeklyReview = program
      ? buildWeeklyReview(program, await workoutRepo.getCompleted(), today)
      : null
    return {
      program,
      exercises,
      activeWorkout,
      todayWorkout,
      todayCheckIn,
      recentCheckIns,
      completedCount,
      weeklyReview,
      lastSeenWeeklyReviewWeekStart: settings?.lastSeenWeeklyReviewWeekStart ?? null,
    }
  }, [todayKey])

  // Root stays a single <motion.div> across loading and loaded states —
  // swapping root element types on load would force React to unmount and
  // remount everything underneath it, including the header, for no reason.
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Header date={today} />
      {data && <TodayBody data={data} today={today} todayKey={todayKey} />}
    </motion.div>
  )
}

function TodayBody({
  data,
  today,
  todayKey,
}: {
  data: TodayData
  today: Date
  todayKey: string
}) {
  const {
    program,
    exercises,
    activeWorkout,
    todayWorkout,
    todayCheckIn,
    recentCheckIns,
    completedCount,
    weeklyReview,
    lastSeenWeeklyReviewWeekStart,
  } = data
  // Decided once, at this component instance's first render, and never
  // re-derived — marking the review "seen" writes to settings, which would
  // otherwise make this card vanish out from under the user moments after
  // it appeared, in the very session that's supposed to show it.
  const [showWeeklyReview] = useState(() =>
    reviewIsUnseen(weeklyReview, lastSeenWeeklyReviewWeekStart),
  )
  const exerciseById = new Map(exercises.map((e) => [e.id, e]))
  const doneToday = todayWorkout !== undefined && todayWorkout.completedAt !== null
  const readiness = readinessFrom(todayCheckIn ?? null, recentCheckIns)
  // Once today's session has started, the readiness it was started on is
  // fixed — editing the check-in now can't retroactively change that plan.
  const sessionStartedToday = activeWorkout !== undefined || doneToday
  const checkInCard = (
    <CheckInCard
      dateKey={todayKey}
      checkIn={todayCheckIn}
      readiness={readiness}
      locked={sessionStartedToday}
    />
  )

  return (
    <>
      {showWeeklyReview && weeklyReview && <WeeklyReviewCard review={weeklyReview} />}

      {activeWorkout ? (
        <>
          <InProgress workout={activeWorkout} program={program} />
          {checkInCard}
        </>
      ) : doneToday && todayWorkout ? (
        <>
          <DoneToday workout={todayWorkout} />
          {checkInCard}
        </>
      ) : program ? (
        <PlannedDay
          program={program}
          completedCount={completedCount}
          exerciseById={exerciseById}
          today={today}
          todayKey={todayKey}
          todayCheckIn={todayCheckIn}
          readiness={readiness}
          checkInCard={checkInCard}
        />
      ) : (
        <>
          <p className="mt-10 text-ink-secondary">
            No training program is set up yet. Your next phase will appear here.
          </p>
          {checkInCard}
        </>
      )}
    </>
  )
}

function PlannedDay({
  program,
  completedCount,
  exerciseById,
  today,
  todayKey,
  todayCheckIn,
  readiness,
  checkInCard,
}: {
  program: Program
  completedCount: number
  exerciseById: Map<string, Exercise>
  today: Date
  todayKey: string
  todayCheckIn: CheckIn | undefined
  readiness: Readiness
  checkInCard: ReactNode
}) {
  const plan = resolveDayPlan(program, today, completedCount)
  const eased = readiness.tier === 'easier'

  return (
    <>
      {plan.kind === 'upcoming' && (
        <UnscheduledDay
          program={program}
          session={plan.firstSession}
          exerciseById={exerciseById}
          todayKey={todayKey}
          todayCheckIn={todayCheckIn}
          readiness={readiness}
          checkInCard={checkInCard}
          activity={null}
          hero={
            <Hero
              eyebrow={
                plan.daysUntilStart === 1
                  ? 'Starts tomorrow'
                  : `Starts in ${plan.daysUntilStart} days`
              }
              title={program.name}
              subtitle="Your first session is ready — begin on day one, or jump in early if you can't wait."
            />
          }
          heading="First up"
        />
      )}

      {plan.kind === 'training' && (
        <TrainingDay
          program={program}
          session={plan.session}
          exerciseById={exerciseById}
          todayKey={todayKey}
          readiness={readiness}
          checkInCard={checkInCard}
        />
      )}

      {plan.kind === 'rest' && (
        <UnscheduledDay
          program={program}
          session={plan.nextSession}
          exerciseById={exerciseById}
          todayKey={todayKey}
          todayCheckIn={todayCheckIn}
          readiness={readiness}
          checkInCard={checkInCard}
          activity={plan.activity}
          hero={
            plan.activity ? (
              <ActivityHero activity={plan.activity} />
            ) : (
              <Hero
                eyebrow="Rest day"
                title="Recovery is progress"
                subtitle={
                  eased
                    ? 'A genuine rest day, perfectly timed. Recharge — your next session will wait.'
                    : 'Swim, play, walk — or do nothing at all. Your next session is ready when you are.'
                }
              />
            )
          }
          heading="Next up"
        />
      )}

      {plan.kind === 'ended' && (
        <>
          <Hero
            eyebrow="Phase complete"
            title="That's a wrap on this phase"
            subtitle="Your next program will appear here once it begins."
          />
          {checkInCard}
        </>
      )}
    </>
  )
}

function TrainingDay({
  program,
  session,
  exerciseById,
  todayKey,
  readiness,
  checkInCard,
}: {
  program: Program
  session: SessionTemplate
  exerciseById: Map<string, Exercise>
  todayKey: string
  readiness: Readiness
  checkInCard: ReactNode
}) {
  const { t } = useTranslation('today')
  const adjusted = applyReadiness(session, readiness)
  const eased = adjusted.adjustments.length > 0
  const because = describeDrivers(readiness.drivers)

  return (
    <>
      <Hero
        eyebrow={`${session.name} · ${session.focus}`}
        title={session.focus}
        subtitle={
          eased
            ? t('trainingDay.easedSubtitle', { driversKey: because.key, ...because.params })
            : t('trainingDay.readySubtitle')
        }
      />
      {checkInCard}
      <StartButton
        program={program}
        session={adjusted.session}
        readiness={readiness}
        todayKey={todayKey}
      />
      {readiness.consecutiveLowDays >= 2 && (
        <p className="mt-4 text-center text-sm leading-relaxed text-ink-secondary">
          {readiness.consecutiveLowDays} low days in a row now — making this a
          rest day is a completely fine choice. Your session will wait for you.
        </p>
      )}
      <SessionPreview
        session={adjusted.session}
        exerciseById={exerciseById}
        heading="Today"
        badge={eased ? t('trainingDay.adjustedBadge') : undefined}
        reasons={eased ? adjusted.adjustments.map((a) => t(a.reason.key, a.reason.params)) : undefined}
      />
    </>
  )
}

/**
 * A day with no scheduled session — a rest day, or any day before the
 * program starts. The day's framing (rest, anticipation) stays the hero;
 * the way into Workout Mode is a quiet affordance below the preview, so
 * training early is always possible but never the recommendation. What it
 * starts is exactly what the preview shows: the same readiness-adjusted
 * session a training day would offer.
 */
function UnscheduledDay({
  program,
  session,
  exerciseById,
  todayKey,
  todayCheckIn,
  readiness,
  checkInCard,
  activity,
  hero,
  heading,
}: {
  program: Program
  session: SessionTemplate
  exerciseById: Map<string, Exercise>
  todayKey: string
  todayCheckIn: CheckIn | undefined
  readiness: Readiness
  checkInCard: ReactNode
  activity: ActivityTemplate | null
  hero: ReactNode
  heading: string
}) {
  const { t } = useTranslation('today')
  const adjusted = applyReadiness(session, readiness)
  const eased = adjusted.adjustments.length > 0

  return (
    <>
      {hero}
      {activity?.kind === 'checkpoint' && (
        <MeasurementCard dateKey={todayKey} checkIn={todayCheckIn} />
      )}
      {checkInCard}
      <SessionPreview
        session={adjusted.session}
        exerciseById={exerciseById}
        heading={heading}
        badge={eased ? t('trainingDay.adjustedBadge') : undefined}
        reasons={eased ? adjusted.adjustments.map((a) => t(a.reason.key, a.reason.params)) : undefined}
      />
      <StartButton
        program={program}
        session={adjusted.session}
        readiness={readiness}
        todayKey={todayKey}
        variant="quiet"
      />
    </>
  )
}

function StartButton({
  program,
  session,
  readiness,
  todayKey,
  variant = 'primary',
}: {
  program: Program
  session: SessionTemplate
  readiness: Readiness
  todayKey: string
  /** 'quiet' is the early-start affordance on unscheduled days — present, never insistent */
  variant?: 'primary' | 'quiet'
}) {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)

  async function start() {
    if (starting) return
    setStarting(true)
    const workout = {
      ...createWorkout({
        id: crypto.randomUUID(),
        programId: program.id,
        session,
        date: todayKey,
        startedAt: new Date().toISOString(),
      }),
      readiness: {
        tier: readiness.tier,
        drivers: readiness.drivers.map((d) => d.signal),
      },
    }
    await workoutRepo.put(workout)
    await navigate('/workout')
  }

  if (variant === 'quiet') {
    return (
      <button
        type="button"
        disabled={starting}
        onClick={() => void start()}
        className="mt-6 w-full rounded-card border border-border py-3.5 text-center text-base font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink disabled:opacity-60"
      >
        Start this session now
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={starting}
      onClick={() => void start()}
      className="mt-8 w-full rounded-card bg-amber py-4 text-center text-lg font-semibold text-bg transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      Start session
    </button>
  )
}

function InProgress({ workout, program }: { workout: Workout; program?: Program }) {
  const [discardArmed, setDiscardArmed] = useState(false)
  const sessionName =
    program?.sessions.find((s) => s.id === workout.sessionTemplateId)?.focus ?? 'Session'
  const loggedSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0)

  return (
    <>
      <Hero
        eyebrow="In progress"
        title={sessionName}
        subtitle={
          loggedSets > 0
            ? `${loggedSets} ${loggedSets === 1 ? 'set' : 'sets'} logged so far. Pick up right where you left off.`
            : 'Your session is open and waiting.'
        }
      />
      <Link
        to="/workout"
        className="mt-8 block w-full rounded-card bg-amber py-4 text-center text-lg font-semibold text-bg transition-transform active:scale-[0.98]"
      >
        Resume session
      </Link>
      <button
        type="button"
        onClick={() => {
          if (discardArmed) void workoutRepo.remove(workout.id)
          else setDiscardArmed(true)
        }}
        className="mt-4 w-full text-center text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        {discardArmed ? 'Tap again to discard this session' : 'Discard session'}
      </button>
    </>
  )
}

function DoneToday({ workout }: { workout: Workout }) {
  const summary = summarizeWorkout(workout)
  const minutes = summary.durationMinutes
  return (
    <Hero
      eyebrow="Session complete"
      title="Done for today"
      subtitle={`${summary.totalSets} ${summary.totalSets === 1 ? 'set' : 'sets'}${minutes !== null ? ` in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : ''} · ${Math.round(summary.volumeKg)} kg moved. Rest well — that's part of the plan.`}
    />
  )
}

function Header({ date }: { date: Date }) {
  return (
    <header className="flex items-baseline justify-between">
      <p className="eyebrow">
        <time dateTime={toDateKey(date)}>{formatLongDate(date)}</time>
      </p>
      <nav className="flex gap-4">
        <Link
          to="/plan"
          className="text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          Plan
        </Link>
        <Link
          to="/progress"
          className="text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          Progress
        </Link>
        <Link
          to="/library"
          className="text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          Library
        </Link>
      </nav>
    </header>
  )
}

interface HeroProps {
  eyebrow: string
  title: string
  subtitle: string
}

function Hero({ eyebrow, title, subtitle }: HeroProps) {
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-amber">{eyebrow}</p>
      <h1 className="text-display mt-2 text-5xl text-ink">{title}</h1>
      <p className="mt-4 max-w-[34ch] leading-relaxed text-ink-secondary">{subtitle}</p>
    </div>
  )
}

/**
 * Replaces the bare rest hero on a day with an authored activity — same
 * quiet tone, no completion state anywhere in it (see docs/DailyProgram.md:
 * skipping is always fine, a checkbox here would be a streak mechanic).
 */
function ActivityHero({ activity }: { activity: ActivityTemplate }) {
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-amber">{ACTIVITY_KIND_LABEL[activity.kind]}</p>
      <h1 className="text-display mt-2 text-5xl text-ink">{activity.title}</h1>
      <ul className="mt-4 space-y-2">
        {activity.items.map((item, index) => (
          <li key={index} className="leading-relaxed text-ink-secondary">
            <span className="text-ink">{item.label}</span>
            {item.detail && <span className="text-ink-tertiary"> — {item.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
