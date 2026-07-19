import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import type { OriginState } from '@/features/library/navigationOrigin'
import type { Exercise, ExercisePrescription, SessionTemplate } from '@/domain/types'

interface SessionPreviewProps {
  session: SessionTemplate
  exerciseById: Map<string, Exercise>
  heading: string
  /** Short canonical label shown beside the numbers when they've been modulated */
  badge?: string
  /** One line per applied adjustment, shown under the heading */
  reasons?: string[]
  /** Where exercise links should return to — defaults to Today, the original and still most common caller */
  origin?: OriginState
}

export function SessionPreview({
  session,
  exerciseById,
  heading,
  badge,
  reasons,
  origin = { from: 'today' },
}: SessionPreviewProps) {
  return (
    <section className="mt-10" aria-label={`${heading}: ${session.name}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow">{heading}</h2>
        {badge && <p className="text-xs font-medium text-amber">{badge}</p>}
      </div>
      {reasons && reasons.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {reasons.map((reason) => (
            <li key={reason} className="text-xs leading-relaxed text-ink-tertiary">
              {reason}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <GroupedList>
          {session.items.map((item) => {
            const exercise = exerciseById.get(item.exerciseId)
            if (!exercise) return null
            return (
              <GroupedRow
                key={item.exerciseId}
                to={`/library/${exercise.id}`}
                state={origin}
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
