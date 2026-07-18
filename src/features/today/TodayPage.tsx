import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { checkinRepo, exerciseRepo, programRepo, settingsRepo, workoutRepo } from '@/data/repositories'
import { resolveDayPlan } from '@/domain/schedule'
import { createWorkout, summarizeWorkout } from '@/domain/workout'
import { describeDrivers, readinessFrom, type Readiness } from '@/domain/readiness'
import { applyReadiness } from '@/domain/adjustments'
import { buildWeeklyReview, reviewIsUnseen, type WeeklyReview } from '@/domain/weeklyReview'
import { formatLongDate, toDateKey } from '@/lib/dates'
import type { CheckIn, Exercise, Program, SessionTemplate, Workout } from '@/domain/types'
import { CheckInCard } from '@/features/checkin/CheckInCard'
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
        checkinRepo.getRecent(),
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
  readiness,
  checkInCard,
}: {
  program: Program
  completedCount: number
  exerciseById: Map<string, Exercise>
  today: Date
  todayKey: string
  readiness: Readiness
  checkInCard: ReactNode
}) {
  const plan = resolveDayPlan(program, today, completedCount)
  const eased = readiness.tier === 'easier'

  return (
    <>
      {plan.kind === 'upcoming' && (
        <>
          <Hero
            eyebrow={
              plan.daysUntilStart === 1
                ? 'Starts tomorrow'
                : `Starts in ${plan.daysUntilStart} days`
            }
            title={program.name}
            subtitle="Your first session is ready. Nothing to do today except look forward to it."
          />
          {checkInCard}
          <SessionPreview
            session={plan.firstSession}
            exerciseById={exerciseById}
            heading="First up"
          />
        </>
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
        <>
          <Hero
            eyebrow="Rest day"
            title="Recovery is progress"
            subtitle={
              eased
                ? 'A genuine rest day, perfectly timed. Recharge — your next session will wait.'
                : 'Swim, play, walk — or do nothing at all. Your next session is ready when you are.'
            }
          />
          {checkInCard}
          <SessionPreview
            session={plan.nextSession}
            exerciseById={exerciseById}
            heading="Next up"
          />
        </>
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
  const adjusted = applyReadiness(session, readiness)
  const eased = adjusted.adjustments.length > 0
  const drivers = describeDrivers(readiness.drivers)

  return (
    <>
      <Hero
        eyebrow={`${session.name} · ${session.focus}`}
        title={session.focus}
        subtitle={
          eased
            ? `Eased back a touch today — ${drivers}. Showing up on a day like this counts double.`
            : "Warm up well. Your starting numbers are below — they'll be waiting in the session."
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
        badge={eased ? 'Adjusted for readiness' : undefined}
        reasons={eased ? adjusted.adjustments.map((a) => a.reason) : undefined}
      />
    </>
  )
}

function StartButton({
  program,
  session,
  readiness,
  todayKey,
}: {
  program: Program
  session: SessionTemplate
  readiness: Readiness
  todayKey: string
}) {
  const navigate = useNavigate()

  async function start() {
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

  return (
    <button
      type="button"
      onClick={() => void start()}
      className="mt-8 w-full rounded-card bg-amber py-4 text-center text-lg font-semibold text-bg transition-transform active:scale-[0.98]"
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
