import { Link } from 'react-router'
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
      <ul className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
        {session.items.map((item) => {
          const exercise = exerciseById.get(item.exerciseId)
          if (!exercise) return null
          return (
            <li key={item.exerciseId}>
              <Link
                to={`/library/${exercise.id}`}
                className="flex items-baseline justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-raised"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{exercise.name}</p>
                  {item.note && (
                    <p className="mt-0.5 text-sm text-ink-tertiary">{item.note}</p>
                  )}
                </div>
                <p
                  className="shrink-0 text-sm text-ink-secondary"
                  data-numeric
                >
                  {formatPrescription(item)}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function formatPrescription(item: ExercisePrescription): string {
  const unit = item.mode === 'seconds' ? 's' : ''
  const side = item.perSide ? ' /side' : ''
  const load = item.startWeightKg !== null ? ` · ${item.startWeightKg} kg` : ''
  return `${item.sets} × ${item.range.min}–${item.range.max}${unit}${side}${load}`
}
