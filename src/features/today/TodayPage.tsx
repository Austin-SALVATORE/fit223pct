import { useLiveQuery } from 'dexie-react-hooks'
import { motion, useReducedMotion } from 'motion/react'
import { exerciseRepo, programRepo, workoutRepo } from '@/data/repositories'
import { resolveDayPlan } from '@/domain/schedule'
import { formatLongDate, toDateKey } from '@/lib/dates'
import { SessionPreview } from './SessionPreview'

export function TodayPage() {
  const today = new Date()
  const todayKey = toDateKey(today)
  const reducedMotion = useReducedMotion()

  const data = useLiveQuery(async () => {
    const [program, exercises] = await Promise.all([
      programRepo.getActive(todayKey),
      exerciseRepo.getAll(),
    ])
    if (!program) return null
    const completedCount = await workoutRepo.countCompleted(program.id)
    return { program, completedCount, exercises }
  }, [todayKey])

  // Live query still resolving (or seeding) — render the stable frame only.
  if (data === undefined) return <Header date={today} />
  if (data === null) {
    return (
      <>
        <Header date={today} />
        <p className="mt-10 text-ink-secondary">
          No training program is set up yet. Your next phase will appear here.
        </p>
      </>
    )
  }

  const { program, completedCount, exercises } = data
  const plan = resolveDayPlan(program, today, completedCount)
  const exerciseById = new Map(exercises.map((e) => [e.id, e]))

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Header date={today} />

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
            subtitle="Take your time warming up. The weights below are your starting points."
          />
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
    </motion.div>
  )
}

function Header({ date }: { date: Date }) {
  return (
    <header>
      <p className="eyebrow">
        <time dateTime={toDateKey(date)}>{formatLongDate(date)}</time>
      </p>
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
