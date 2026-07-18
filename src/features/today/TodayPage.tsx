import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { exerciseRepo, programRepo, workoutRepo } from '@/data/repositories'
import { resolveDayPlan } from '@/domain/schedule'
import { createWorkout, summarizeWorkout } from '@/domain/workout'
import { formatLongDate, toDateKey } from '@/lib/dates'
import type { Exercise, Program, SessionTemplate, Workout } from '@/domain/types'
import { SessionPreview } from './SessionPreview'

export function TodayPage() {
  const today = new Date()
  const todayKey = toDateKey(today)
  const reducedMotion = useReducedMotion()

  const data = useLiveQuery(async () => {
    const [program, exercises, activeWorkout, todayWorkout] = await Promise.all([
      programRepo.getActive(todayKey),
      exerciseRepo.getAll(),
      workoutRepo.getActive(),
      workoutRepo.getByDate(todayKey),
    ])
    const completedCount = program ? await workoutRepo.countCompleted(program.id) : 0
    return { program, exercises, activeWorkout, todayWorkout, completedCount }
  }, [todayKey])

  if (data === undefined) return <Header date={today} />

  const { program, exercises, activeWorkout, todayWorkout, completedCount } = data
  const exerciseById = new Map(exercises.map((e) => [e.id, e]))
  const doneToday = todayWorkout !== undefined && todayWorkout.completedAt !== null

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Header date={today} />

      {activeWorkout ? (
        <InProgress workout={activeWorkout} program={program} />
      ) : doneToday && todayWorkout ? (
        <DoneToday workout={todayWorkout} />
      ) : program ? (
        <PlannedDay
          program={program}
          completedCount={completedCount}
          exerciseById={exerciseById}
          today={today}
          todayKey={todayKey}
        />
      ) : (
        <p className="mt-10 text-ink-secondary">
          No training program is set up yet. Your next phase will appear here.
        </p>
      )}
    </motion.div>
  )
}

function PlannedDay({
  program,
  completedCount,
  exerciseById,
  today,
  todayKey,
}: {
  program: Program
  completedCount: number
  exerciseById: Map<string, Exercise>
  today: Date
  todayKey: string
}) {
  const plan = resolveDayPlan(program, today, completedCount)

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
          <SessionPreview
            session={plan.firstSession}
            exerciseById={exerciseById}
            heading="First up"
          />
        </>
      )}

      {plan.kind === 'training' && (
        <>
          <Hero
            eyebrow={`${plan.session.name} · ${plan.session.focus}`}
            title={plan.session.focus}
            subtitle="Warm up well. Your starting numbers are below — they'll be waiting in the session."
          />
          <StartButton program={program} session={plan.session} todayKey={todayKey} />
          <SessionPreview session={plan.session} exerciseById={exerciseById} heading="Today" />
        </>
      )}

      {plan.kind === 'rest' && (
        <>
          <Hero
            eyebrow="Rest day"
            title="Recovery is progress"
            subtitle="Swim, play, walk — or do nothing at all. Your next session is ready when you are."
          />
          <SessionPreview
            session={plan.nextSession}
            exerciseById={exerciseById}
            heading="Next up"
          />
        </>
      )}

      {plan.kind === 'ended' && (
        <Hero
          eyebrow="Phase complete"
          title="That's a wrap on this phase"
          subtitle="Your next program will appear here once it begins."
        />
      )}
    </>
  )
}

function StartButton({
  program,
  session,
  todayKey,
}: {
  program: Program
  session: SessionTemplate
  todayKey: string
}) {
  const navigate = useNavigate()

  async function start() {
    const workout = createWorkout({
      id: crypto.randomUUID(),
      programId: program.id,
      session,
      date: todayKey,
      startedAt: new Date().toISOString(),
    })
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
    <>
      <Hero
        eyebrow="Session complete"
        title="Done for today"
        subtitle={`${summary.totalSets} sets${minutes !== null ? ` in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : ''} · ${Math.round(summary.volumeKg)} kg moved. Rest well — that's part of the plan.`}
      />
    </>
  )
}

function Header({ date }: { date: Date }) {
  return (
    <header className="flex items-baseline justify-between">
      <p className="eyebrow">
        <time dateTime={toDateKey(date)}>{formatLongDate(date)}</time>
      </p>
      <Link
        to="/library"
        className="text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        Library
      </Link>
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
