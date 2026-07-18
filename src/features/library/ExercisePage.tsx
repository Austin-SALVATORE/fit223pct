import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useLocation, useParams } from 'react-router'
import { exerciseRepo } from '@/data/repositories'
import { originTarget, resolveOrigin, type NavigationOrigin } from './navigationOrigin'

export function ExercisePage() {
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

  if (data === undefined) return null
  if (data === null) {
    return (
      <div>
        <BackLink origin={origin} />
        <p className="mt-10 text-ink-secondary">
          This exercise isn't in the library. It may have been renamed.
        </p>
      </div>
    )
  }

  const { exercise, substitutions } = data

  return (
    <div>
      <BackLink origin={origin} />
      <header className="mt-6">
        <p className="eyebrow">
          {exercise.muscles.join(' · ')}
          {exercise.isUnilateral && ' · one side at a time'}
        </p>
        <h1 className="text-display mt-2 text-4xl text-ink">{exercise.name}</h1>
      </header>

      <section className="mt-8" aria-label="Technique cues">
        <h2 className="eyebrow">Technique</h2>
        <ul className="mt-3 space-y-2.5">
          {exercise.cues.map((cue) => (
            <li key={cue} className="flex gap-3 leading-relaxed text-ink-secondary">
              <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-amber" />
              {cue}
            </li>
          ))}
        </ul>
      </section>

      {exercise.teachingConcept && (
        <section
          className="mt-8 rounded-card border border-border bg-surface p-5"
          aria-label="Concept"
        >
          <h2 className="eyebrow">Why it matters — {exercise.teachingConcept.title}</h2>
          <p className="mt-3 leading-relaxed text-ink-secondary">
            {exercise.teachingConcept.body}
          </p>
        </section>
      )}

      {substitutions.length > 0 && (
        <section className="mt-8" aria-label="Substitutions">
          <h2 className="eyebrow">Swap for</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {substitutions.map((sub) => (
              <li key={sub.id}>
                <Link
                  to={`/library/${sub.id}`}
                  state={{ from: origin }}
                  className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function BackLink({ origin }: { origin: NavigationOrigin }) {
  const target = originTarget(origin)
  return (
    <Link
      to={target.path}
      className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
    >
      <span aria-hidden="true">←</span> {target.label}
    </Link>
  )
}
