import { useTranslation } from 'react-i18next'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import { useExerciseName } from '@/i18n/seedExercise'
import { useSessionName, usePrescriptionNote } from '@/i18n/seedProgram'
import type { OriginState } from '@/lib/navigationOrigin'
import type { Exercise, ExercisePrescription, SessionTemplate } from '@/domain/types'

interface SessionPreviewProps {
  session: SessionTemplate
  /** For seed-content resolution (program.<id>.session.<id>...) — see i18n/seedProgram.ts */
  programId: string
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
  programId,
  exerciseById,
  heading,
  badge,
  reasons,
  origin = { from: 'today' },
}: SessionPreviewProps) {
  const sessionName = useSessionName(programId, session)
  return (
    <section className="mt-10" aria-label={`${heading}: ${sessionName}`}>
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
              <ItemRow
                key={item.exerciseId}
                item={item}
                exercise={exercise}
                origin={origin}
                programId={programId}
                sessionId={session.id}
              />
            )
          })}
        </GroupedList>
      </div>
    </section>
  )
}

function ItemRow({
  item,
  exercise,
  origin,
  programId,
  sessionId,
}: {
  item: ExercisePrescription
  exercise: Exercise
  origin: OriginState
  programId: string
  sessionId: string
}) {
  const { t } = useTranslation('today')
  const exerciseName = useExerciseName(exercise.id)
  const note = usePrescriptionNote(programId, sessionId, item)
  const perSideSuffix = item.perSide ? t('sessionPreview.perSideSuffix') : ''
  return (
    <GroupedRow to={`/library/${exercise.id}`} state={origin}>
      <div className="min-w-0">
        <p className="font-medium text-ink">{exerciseName}</p>
        {note && <p className="mt-0.5 text-sm text-ink-tertiary">{note}</p>}
      </div>
      <p className="shrink-0 text-sm text-ink-secondary" data-numeric>
        {formatPrescription(item, perSideSuffix)}
      </p>
    </GroupedRow>
  )
}

function formatPrescription(item: ExercisePrescription, perSideSuffix: string): string {
  const unit = item.mode === 'seconds' ? 's' : ''
  const load = item.startWeightKg !== null ? ` · ${item.startWeightKg} kg` : ''
  return `${item.sets} × ${item.range.min}–${item.range.max}${unit}${perSideSuffix}${load}`
}
