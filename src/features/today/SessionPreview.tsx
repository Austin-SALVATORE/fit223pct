import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ExerciseThumbnail } from '@/ui/ExerciseThumbnail'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import { useExerciseName } from '@/i18n/seedExercise'
import { useSessionName, usePrescriptionNote } from '@/i18n/seedProgram'
import type { OriginState } from '@/lib/navigationOrigin'
import type { Exercise, ExercisePrescription, Program, SessionTemplate } from '@/domain/types'

interface SessionPreviewProps {
  session: SessionTemplate
  /** For seed-content resolution (program.<id>.session.<id>...) — see i18n/seedProgram.ts */
  programId: string
  /** 'imported' skips locale-key resolution entirely — see i18n/seedProgram.ts */
  programOrigin?: Program['origin']
  exerciseById: Map<string, Exercise>
  heading: string
  /**
   * Timing context under the heading — e.g. "Starts in 2 days"
   * (plannedDay.startsIn). Absent for the ordinary "next scheduled
   * session" case; used by the cross-phase preview, where the heading
   * names a program but says nothing about when (final-rest-day-
   * lookahead.md §9 Q2 amendment).
   */
  subtitle?: string
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
  programOrigin,
  exerciseById,
  heading,
  subtitle,
  badge,
  reasons,
  origin = { from: 'today' },
}: SessionPreviewProps) {
  const sessionName = useSessionName(programId, session, programOrigin)
  // Label/value and middot punctuation are per-locale (I7) — zh-CN drops the
  // ASCII spaces the English form needs.
  const { t: tCommon } = useTranslation('common')
  return (
    <section className="mt-10" aria-label={tCommon('labelValue', { label: heading, value: sessionName })}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow">{heading}</h2>
        {badge && <p className="text-xs font-medium text-amber">{badge}</p>}
      </div>
      {subtitle && <p className="mt-0.5 text-sm text-ink-tertiary">{subtitle}</p>}
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
            // D3, 12 Aug 2026 — a technique-rehearsal set renders above
            // its exercise's first working set, in the same static,
            // non-interactive treatment WarmupSection established.
            // Structurally invisible to setPlan/progression (types.ts).
            const rehearsal = 'rehearsal' in item ? item.rehearsal : undefined
            return (
              <Fragment key={item.exerciseId}>
                {rehearsal && <RehearsalRow exercise={exercise} rehearsal={rehearsal} />}
                <ItemRow
                  item={item}
                  exercise={exercise}
                  origin={origin}
                  programId={programId}
                  programOrigin={programOrigin}
                  sessionId={session.id}
                />
              </Fragment>
            )
          })}
        </GroupedList>
      </div>
    </section>
  )
}

/**
 * A technique-rehearsal set (D3) — same visual shape as ItemRow's
 * thumbnail-plus-text grid, but a plain `GroupedRow` with no `to`, since
 * this is not a navigable exercise slot. Never rendered from `setPlan`,
 * so it carries no note and no `formatPrescription` call.
 */
function RehearsalRow({ exercise, rehearsal }: { exercise: Exercise; rehearsal: { weightKg: number; reps: number } }) {
  const { t } = useTranslation('today')
  const exerciseName = useExerciseName(exercise.id)
  return (
    <GroupedRow>
      <div className="grid w-full min-w-0 grid-cols-[3rem_1fr] items-start gap-x-4">
        <ExerciseThumbnail exerciseId={exercise.id} />
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{exerciseName}</p>
          <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
            {t('sessionPreview.rehearsalWeightReps', { weight: rehearsal.weightKg, reps: rehearsal.reps })}
          </p>
        </div>
      </div>
    </GroupedRow>
  )
}

function ItemRow({
  item,
  exercise,
  origin,
  programId,
  programOrigin,
  sessionId,
}: {
  item: ExercisePrescription
  exercise: Exercise
  origin: OriginState
  programId: string
  programOrigin?: Program['origin']
  sessionId: string
}) {
  const { t } = useTranslation('today')
  const { t: tCommon } = useTranslation('common')
  const exerciseName = useExerciseName(exercise.id)
  const note = usePrescriptionNote(programId, sessionId, item, programOrigin)
  const perSideSuffix = item.perSide ? t('sessionPreview.perSideSuffix') : ''
  return (
    <GroupedRow to={`/library/${exercise.id}`} state={origin}>
      {/*
        A grid, not GroupedRow's own flex row, and the name and numbers
        stack instead of sitting side by side — deliberately, and only
        after measuring that a side-by-side split cannot work here.

        Sharing one row, name and prescription compete for a fixed ~206px
        (the row's inner width, less the thumbnail and gaps) at 375px. That
        budget is smaller than the *shorter* of the two on several real
        rows — "Dumbbell Romanian deadlift" alone is 209px, "12→14→15 kg ·
        12/10/8" alone is 160px, and 209+160 is nowhere close to 206 no
        matter how the columns are split. A min-width floor on the name
        column just moves the shortfall onto the prescription (which the
        brief requires stay intact, so it wraps instead) or, tried first,
        left the name crushed to "B…" for "Bulgarian split squat". Every
        column split was a trade between the two, never a fix.

        Stacked, each gets the row's *full* width (~254px) on its own
        line — comfortably past the longest name (209px) and longest
        prescription (186px) measured in the seed corpus, so both render
        without truncating or wrapping in the common case. `truncate`
        stays on the name as a floor under a name this corpus doesn't
        have, not as the primary mechanism.
      */}
      <div className="grid w-full min-w-0 grid-cols-[3rem_1fr] items-start gap-x-4">
        <ExerciseThumbnail exerciseId={exercise.id} />
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{exerciseName}</p>
          {note && <p className="mt-0.5 truncate text-sm text-ink-tertiary">{note}</p>}
          <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
            {formatPrescription(tCommon, item, perSideSuffix)}
          </p>
        </div>
      </div>
    </GroupedRow>
  )
}

/**
 * I7 only: the two ` · ` joins become the locale's own middot form. The
 * arrows, en-dash and × stay as they are — i18n correctly ruled those
 * locale-neutral, and rewriting them for screen readers is A14, a separate
 * defect on the same line that ships independently.
 */
function formatPrescription(
  t: TFunction<'common'>,
  item: ExercisePrescription,
  perSideSuffix: string,
): string {
  if (item.setPlan) {
    const weights = item.setPlan.map((rung) => (rung.weightKg !== null ? String(rung.weightKg) : '–'))
    const reps = item.setPlan.map((rung) => String(rung.reps))
    return t('middotJoin', {
      a: `${weights.join('→')} kg`,
      b: `${reps.join('/')}${perSideSuffix}`,
    })
  }
  const unit = item.mode === 'seconds' ? t('unitSeconds') : ''
  const base = `${item.sets} × ${item.range.min}–${item.range.max}${unit}${perSideSuffix}`
  return item.startWeightKg !== null
    ? t('middotJoin', { a: base, b: `${item.startWeightKg} kg` })
    : base
}
