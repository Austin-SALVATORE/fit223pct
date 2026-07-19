import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { checkinRepo, exerciseRepo, programRepo, workoutRepo } from '@/data/repositories'
import { consistencyTrend, strengthTrend, waistTrend } from '@/domain/trends'
import { detectStagnation } from '@/domain/stagnation'
import { toDateKey } from '@/lib/dates'
import type { Workout } from '@/domain/types'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import { ConsistencyCard } from './ConsistencyCard'
import { StrengthCard } from './StrengthCard'
import { WaistCard } from './WaistCard'

export function ProgressPage() {
  const todayKey = toDateKey(new Date())

  const data = useLiveQuery(async () => {
    const [program, exercises, completed, checkins] = await Promise.all([
      programRepo.getActive(todayKey),
      exerciseRepo.getAll(),
      workoutRepo.getCompleted(),
      checkinRepo.getAll(),
    ])
    return { program, exercises, completed, checkins }
  }, [todayKey])

  // Root stays a <div> in both states — see LibraryPage for why.
  if (!data) {
    return (
      <div>
        <Heading />
      </div>
    )
  }

  const { program, exercises, completed, checkins } = data
  const exerciseById = new Map(exercises.map((e) => [e.id, e]))

  const mainItems = program
    ? program.sessions.flatMap((s) => s.items.filter((i) => (i.role ?? 'main') === 'main'))
    : []
  const mainExerciseIds = [...new Set(mainItems.map((i) => i.exerciseId))]
  // First prescription wins if the same exercise appears in more than one
  // session — only its program-defined substitutionIds are needed here.
  const prescriptionByExerciseId = new Map<string, (typeof mainItems)[number]>()
  for (const item of mainItems) {
    if (!prescriptionByExerciseId.has(item.exerciseId)) prescriptionByExerciseId.set(item.exerciseId, item)
  }

  const consistency = program ? consistencyTrend(program, completed, new Date()) : null
  const waist = waistTrend(checkins)

  // Exercises with real history get a full trend card; exercises never
  // logged at all get nothing to say and are left out entirely — a wall of
  // "no data yet" cards is noise, not progress. Ones with a little history
  // (not yet enough for a direction) are named quietly in one line, not
  // given a repeated paragraph each.
  const withHistory = mainExerciseIds.filter((id) => sessionCount(id, completed) > 0)
  const gathering = withHistory.filter((id) => sessionCount(id, completed) < 3)
  const withTrend = withHistory.filter((id) => sessionCount(id, completed) >= 3)

  return (
    <div>
      <Heading />

      <section className="mt-8" aria-label="Consistency">
        <h2 className="eyebrow">Consistency</h2>
        <div className="mt-3">
          <ConsistencyCard trend={consistency} />
        </div>
      </section>

      {mainExerciseIds.length > 0 && (
        <section className="mt-8" aria-label="Strength">
          <h2 className="eyebrow">Strength</h2>

          {withHistory.length === 0 ? (
            <div className="mt-3 rounded-card border border-border bg-surface p-5">
              <p className="text-ink-secondary">
                Log a few sessions to start seeing strength trends here.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {withTrend.map((exerciseId) => {
                const exercise = exerciseById.get(exerciseId)
                if (!exercise) return null
                const trend = strengthTrend(exerciseId, completed)
                const stagnation = detectStagnation(
                  exercise,
                  completed,
                  prescriptionByExerciseId.get(exerciseId),
                )
                return (
                  <StrengthCard
                    key={exerciseId}
                    exercise={exercise}
                    trend={trend}
                    stagnation={stagnation}
                    substitution={
                      stagnation.status === 'stagnant' && stagnation.suggestedSubstitutionId
                        ? exerciseById.get(stagnation.suggestedSubstitutionId)
                        : undefined
                    }
                  />
                )
              })}

              {gathering.length > 0 && (
                <div>
                  <p className="text-xs text-ink-tertiary">Still gathering data</p>
                  <div className="mt-2">
                    <GroupedList>
                      {gathering.map((exerciseId) => {
                        const exercise = exerciseById.get(exerciseId)
                        if (!exercise) return null
                        return (
                          <GroupedRow
                            key={exerciseId}
                            to={`/library/${exercise.id}`}
                            state={{ from: 'progress' }}
                          >
                            <span className="text-ink">{exercise.name}</span>
                            <span
                              className="shrink-0 text-sm text-ink-tertiary"
                              data-numeric
                            >
                              {sessionCount(exerciseId, completed)} of 3 sessions
                            </span>
                          </GroupedRow>
                        )
                      })}
                    </GroupedList>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="mt-8" aria-label="Waist">
        <h2 className="eyebrow">Waist</h2>
        <div className="mt-3">
          <WaistCard trend={waist} />
        </div>
      </section>
    </div>
  )
}

function sessionCount(exerciseId: string, workouts: readonly Workout[]): number {
  return workouts.filter((w) => w.exercises.some((e) => e.exerciseId === exerciseId && e.sets.length > 0))
    .length
}

function Heading() {
  return (
    <header>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        <span aria-hidden="true">←</span> Today
      </Link>
      <h1 className="text-display mt-6 text-4xl text-ink">Progress</h1>
    </header>
  )
}
