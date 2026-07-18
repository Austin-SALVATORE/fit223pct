import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import type { Exercise, ExercisePrescription, SessionTemplate } from '@/domain/types'

interface SessionPreviewProps {
  session: SessionTemplate
  exerciseById: Map<string, Exercise>
  heading: string
}

export function SessionPreview({ session, exerciseById, heading }: SessionPreviewProps) {
  return (
    <section className="mt-10" aria-label={`${heading}: ${session.name}`}>
      <h2 className="eyebrow">{heading}</h2>
      <div className="mt-3">
        <GroupedList>
          {session.items.map((item) => {
            const exercise = exerciseById.get(item.exerciseId)
            if (!exercise) return null
            return (
              <GroupedRow
                key={item.exerciseId}
                to={`/library/${exercise.id}`}
                state={{ from: 'today' }}
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{exercise.name}</p>
                  {item.note && (
                    <p className="mt-0.5 text-sm text-ink-tertiary">{item.note}</p>
                  )}
                </div>
                <p className="shrink-0 text-sm text-ink-secondary" data-numeric>
                  {formatPrescription(item)}
                </p>
              </GroupedRow>
            )
          })}
        </GroupedList>
      </div>
    </section>
  )
}

function formatPrescription(item: ExercisePrescription): string {
  const unit = item.mode === 'seconds' ? 's' : ''
  const side = item.perSide ? ' /side' : ''
  const load = item.startWeightKg !== null ? ` · ${item.startWeightKg} kg` : ''
  return `${item.sets} × ${item.range.min}–${item.range.max}${unit}${side}${load}`
}
