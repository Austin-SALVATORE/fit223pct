import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { checkinRepo, exerciseRepo, programRepo, workoutRepo } from '@/data/repositories'
import { consistencyTrend, strengthTrend, waistTrend } from '@/domain/trends'
import { detectStagnation } from '@/domain/stagnation'
import { toDateKey } from '@/lib/dates'
import { useExerciseName } from '@/i18n/seedExercise'
import type { Workout } from '@/domain/types'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import { SettingsLink } from '@/ui/SettingsLink'
import { ConsistencyCard } from './ConsistencyCard'
import { StrengthCard } from './StrengthCard'
import { WaistCard } from './WaistCard'

export function ProgressPage() {
  const { t } = useTranslation('progress')
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

      <section className="mt-8" aria-label={t('consistency.sectionLabel')}>
        <h2 className="eyebrow">{t('consistency.sectionLabel')}</h2>
        <div className="mt-3">
          <ConsistencyCard trend={consistency} />
        </div>
      </section>

      {mainExerciseIds.length > 0 && (
        <section className="mt-8" aria-label={t('strength.sectionLabel')}>
          <h2 className="eyebrow">{t('strength.sectionLabel')}</h2>

          {withHistory.length === 0 ? (
            <div className="mt-3 rounded-card border border-border bg-surface p-5">
              <p className="text-ink-secondary">{t('strength.noHistory')}</p>
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
                  <p className="text-xs text-ink-tertiary">{t('strength.stillGathering')}</p>
                  <div className="mt-2">
                    <GroupedList>
                      {gathering.map((exerciseId) => {
                        const exercise = exerciseById.get(exerciseId)
                        if (!exercise) return null
                        return (
                          <GatheringRow
                            key={exerciseId}
                            exerciseId={exerciseId}
                            sessionCount={sessionCount(exerciseId, completed)}
                          />
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

      <section className="mt-8" aria-label={t('waist.sectionLabel')}>
        <h2 className="eyebrow">{t('waist.sectionLabel')}</h2>
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

function GatheringRow({
  exerciseId,
  sessionCount,
}: {
  exerciseId: string
  sessionCount: number
}) {
  const { t } = useTranslation('progress')
  const exerciseName = useExerciseName(exerciseId)
  return (
    <GroupedRow to={`/library/${exerciseId}`} state={{ from: 'progress' }}>
      <span className="text-ink">{exerciseName}</span>
      <span className="shrink-0 text-sm text-ink-tertiary" data-numeric>
        {t('strength.sessionsOfThree', { count: sessionCount })}
      </span>
    </GroupedRow>
  )
}

function Heading() {
  const { t } = useTranslation('common')
  return (
    <header>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        <span aria-hidden="true">←</span> {t('nav.today')}
      </Link>
      <div className="mt-6 flex items-start justify-between gap-4">
        <h1 className="text-display text-4xl text-ink">{t('nav.progress')}</h1>
        <SettingsLink origin="progress" />
      </div>
    </header>
  )
}
