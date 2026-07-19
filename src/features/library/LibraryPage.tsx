import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { exerciseRepo } from '@/data/repositories'
import { useEquipmentLabel } from '@/lib/equipmentLabel'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import type { Exercise, MuscleGroup } from '@/domain/types'

const groupOrder: { key: string; labelKey: string; muscles: MuscleGroup[] }[] = [
  { key: 'lower', labelKey: 'group.lower', muscles: ['quads', 'hamstrings', 'glutes'] },
  { key: 'push', labelKey: 'group.push', muscles: ['chest', 'shoulders', 'triceps'] },
  { key: 'pull', labelKey: 'group.pull', muscles: ['back', 'biceps'] },
  { key: 'core', labelKey: 'group.core', muscles: ['core'] },
]

export function LibraryPage() {
  const { t } = useTranslation('library')
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
      {grouped.map((group) => {
        const groupLabel = t(group.labelKey)
        return (
          <section key={group.key} className="mt-8" aria-label={groupLabel}>
            <h2 className="eyebrow">{groupLabel}</h2>
            <div className="mt-3">
              <GroupedList>
                {group.exercises.map((exercise) => (
                  <ExerciseRow key={exercise.id} exercise={exercise} />
                ))}
              </GroupedList>
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const equipmentLabel = useEquipmentLabel(exercise.equipment[0])
  return (
    <GroupedRow to={`/library/${exercise.id}`} state={{ from: 'library' }}>
      <p className="font-medium text-ink">{exercise.name}</p>
      <p className="shrink-0 text-sm text-ink-tertiary">{equipmentLabel}</p>
    </GroupedRow>
  )
}

function Heading() {
  const { t } = useTranslation('library')
  const { t: tCommon } = useTranslation('common')
  return (
    <header>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        <span aria-hidden="true">←</span> {tCommon('nav.today')}
      </Link>
      <h1 className="text-display mt-6 text-4xl text-ink">{t('heading')}</h1>
    </header>
  )
}
