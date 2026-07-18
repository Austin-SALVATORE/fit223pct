import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { exerciseRepo } from '@/data/repositories'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import type { MuscleGroup } from '@/domain/types'

const groupOrder: { key: string; label: string; muscles: MuscleGroup[] }[] = [
  { key: 'lower', label: 'Lower body', muscles: ['quads', 'hamstrings', 'glutes'] },
  { key: 'push', label: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
  { key: 'pull', label: 'Pull', muscles: ['back', 'biceps'] },
  { key: 'core', label: 'Core', muscles: ['core'] },
]

export function LibraryPage() {
  const exercises = useLiveQuery(() => exerciseRepo.getAll(), [])

  // Root stays a <div> in both states — swapping root element types on
  // load forces React to unmount and remount everything underneath it,
  // including the heading, for no reason.
  if (!exercises) {
    return (
      <div>
        <Heading />
      </div>
    )
  }

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
          <div className="mt-3">
            <GroupedList>
              {group.exercises.map((exercise) => (
                <GroupedRow
                  key={exercise.id}
                  to={`/library/${exercise.id}`}
                  state={{ from: 'library' }}
                >
                  <p className="font-medium text-ink">{exercise.name}</p>
                  <p className="shrink-0 text-sm capitalize text-ink-tertiary">
                    {exercise.equipment[0]}
                  </p>
                </GroupedRow>
              ))}
            </GroupedList>
          </div>
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
