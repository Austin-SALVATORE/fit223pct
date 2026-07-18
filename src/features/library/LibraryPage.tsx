import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { exerciseRepo } from '@/data/repositories'
import type { Exercise, MuscleGroup } from '@/domain/types'

const groupOrder: { key: string; label: string; muscles: MuscleGroup[] }[] = [
  { key: 'lower', label: 'Lower body', muscles: ['quads', 'hamstrings', 'glutes'] },
  { key: 'push', label: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
  { key: 'pull', label: 'Pull', muscles: ['back', 'biceps'] },
  { key: 'core', label: 'Core', muscles: ['core'] },
]

export function LibraryPage() {
  const exercises = useLiveQuery(() => exerciseRepo.getAll(), [])

  if (!exercises) return <Heading />

  const grouped = groupOrder
    .map((group) => ({
      ...group,
      exercises: exercises.filter((e) => group.muscles.includes(e.muscles[0])),
    }))
    .filter((group) => group.exercises.length > 0)

  return (
    <div>
      <Heading />
      {grouped.map((group) => (
        <section key={group.key} className="mt-8" aria-label={group.label}>
          <h2 className="eyebrow">{group.label}</h2>
          <ul className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
            {group.exercises.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
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
      <h1 className="text-display mt-6 text-4xl text-ink">Exercises</h1>
    </header>
  )
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  return (
    <li>
      <Link
        to={`/library/${exercise.id}`}
        className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-raised"
      >
        <p className="font-medium text-ink">{exercise.name}</p>
        <p className="shrink-0 text-sm capitalize text-ink-tertiary">
          {exercise.equipment[0]}
        </p>
      </Link>
    </li>
  )
}
