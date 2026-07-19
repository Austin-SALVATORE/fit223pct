import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router'
import { exerciseRepo } from '@/data/repositories'
import { useMuscleGroupLabels } from '@/lib/muscleGroupLabel'
import {
  useExerciseCues,
  useExerciseName,
  useExerciseTeachingConcept,
} from '@/i18n/seedExercise'
import type { Exercise } from '@/domain/types'
import { originTarget, resolveOrigin, type OriginState } from './navigationOrigin'

export function ExercisePage() {
  const { t } = useTranslation('library')
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const origin = resolveOrigin(useLocation().state)

  const data = useLiveQuery(async () => {
    if (!exerciseId) return null
    const exercise = await exerciseRepo.getById(exerciseId)
    if (!exercise) return null
    const substitutions = await Promise.all(
      exercise.substitutionIds.map((id) => exerciseRepo.getById(id)),
    )
    return {
      exercise,
      substitutions: substitutions.filter((s) => s !== undefined),
    }
  }, [exerciseId])

  // Called unconditionally, before either early return below, so hook order
  // stays stable across the loading → not-found → loaded transitions.
  const muscleLabels = useMuscleGroupLabels(data?.exercise.muscles ?? [])
  const exerciseName = useExerciseName(data?.exercise.id ?? '')
  const cues = useExerciseCues(data?.exercise.id ?? '')
  const teachingConcept = useExerciseTeachingConcept(data?.exercise.id ?? '')

  if (data === undefined) return null
  if (data === null) {
    return (
      <div>
        <BackLink origin={origin} />
        <p className="mt-10 text-ink-secondary">{t('notFound')}</p>
      </div>
    )
  }

  const { exercise, substitutions } = data

  return (
    <div>
      <BackLink origin={origin} />
      <header className="mt-6">
        <p className="eyebrow">
          {muscleLabels.join(' · ')}
          {exercise.isUnilateral && ` · ${t('unilateralSuffix')}`}
        </p>
        <h1 className="text-display mt-2 text-4xl text-ink">{exerciseName}</h1>
      </header>

      <section className="mt-8" aria-label={t('techniqueSectionAriaLabel')}>
        <h2 className="eyebrow">{t('techniqueHeading')}</h2>
        <ul className="mt-3 space-y-2.5">
          {cues.map((cue) => (
            <li key={cue} className="flex gap-3 leading-relaxed text-ink-secondary">
              <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-amber" />
              {cue}
            </li>
          ))}
        </ul>
      </section>

      {teachingConcept && (
        <section
          className="mt-8 rounded-card border border-border bg-surface p-5"
          aria-label={t('conceptSectionAriaLabel')}
        >
          <h2 className="eyebrow">{t('whyItMatters', { title: teachingConcept.title })}</h2>
          <p className="mt-3 leading-relaxed text-ink-secondary">{teachingConcept.body}</p>
        </section>
      )}

      {substitutions.length > 0 && (
        <section className="mt-8" aria-label={t('substitutionsSectionAriaLabel')}>
          <h2 className="eyebrow">{t('swapFor')}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {substitutions.map((sub) => (
              <SubstitutionLink key={sub.id} exercise={sub} origin={origin} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function SubstitutionLink({ exercise, origin }: { exercise: Exercise; origin: OriginState }) {
  const name = useExerciseName(exercise.id)
  return (
    <li>
      <Link
        to={`/library/${exercise.id}`}
        state={{ from: origin.from, date: origin.date }}
        className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
      >
        {name}
      </Link>
    </li>
  )
}

function BackLink({ origin }: { origin: OriginState }) {
  const { t } = useTranslation()
  const target = originTarget(origin)
  return (
    <Link
      to={target.path}
      className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
    >
      <span aria-hidden="true">←</span> {t(target.labelKey)}
    </Link>
  )
}
