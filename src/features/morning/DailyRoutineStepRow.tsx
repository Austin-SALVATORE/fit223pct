import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useExerciseName } from '@/i18n/seedExercise'
import { ExerciseThumbnail } from '@/ui/ExerciseThumbnail'
import type { DailyRoutineStep } from '@/domain/dailyRoutine'

/**
 * One Morning Posture Reset row — `ExerciseThumbnail` + `useExerciseName` +
 * a units line, wrapped in a `Link` to `/library/<id>` with `origin` router
 * state (plan §3.6). Deliberately re-derives `WarmupSection.tsx`'s row
 * markup (`rowLinkClassName`) rather than importing it — that file was not
 * in this phase's stated scope, so this duplicates a small, stable class
 * string instead of an unscoped edit to an unrelated component. Flagged in
 * the phase report; happy to extract a shared primitive if preferred.
 *
 * Always `{ from: 'today' }` — Morning Posture Reset renders only on Today
 * in v1 (no Plan-page preview exists for it), so there is no second origin
 * to thread through, unlike `WarmupSection`'s own optional `origin` prop.
 */
const ORIGIN = { from: 'today' as const }

function rowLinkClassName(): string {
  return '-mx-2 grid grid-cols-[3rem_1fr] items-center gap-x-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-raised active:bg-raised focus-inset'
}

export function DailyRoutineStepRow({ step }: { step: DailyRoutineStep }) {
  const name = useExerciseName(step.exerciseId)

  return (
    <Link to={`/library/${step.exerciseId}`} state={ORIGIN} className={rowLinkClassName()}>
      <ExerciseThumbnail exerciseId={step.exerciseId} />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{name}</p>
        {step.kind === 'breathing' ? <BreathingDetail step={step} /> : <MovementDetail step={step} />}
      </div>
    </Link>
  )
}

function MovementDetail({ step }: { step: Extract<DailyRoutineStep, { kind: 'movement' }> }) {
  const { t } = useTranslation('today')
  const key = step.repsMax !== undefined ? 'morning.roundsRepsRange' : 'morning.roundsReps'
  const suffix = step.perSide ? t('sessionPreview.perSideSuffix') : ''
  return (
    <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
      {t(key, { count: step.rounds, reps: step.reps, repsMax: step.repsMax })}
      {suffix}
    </p>
  )
}

/**
 * Not a compact unit line (plan §3.6/§9.2) — the coach's two-sentence
 * instruction is carried verbatim, so this row needs a layout that
 * accommodates a sentence rather than a bare "rounds × reps" fragment. The
 * rounds count still gets its own small line above it, matching every
 * other row's dose-first structure and doc 23's own FINAL V1 PRESCRIPTION,
 * which lists "2 rounds" as a fact distinct from the per-breath
 * instruction.
 */
function BreathingDetail({ step }: { step: Extract<DailyRoutineStep, { kind: 'breathing' }> }) {
  const { t } = useTranslation('today')
  return (
    <>
      <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
        {t('morning.roundsLabel', { count: step.rounds })}
      </p>
      <p className="mt-0.5 text-sm leading-relaxed text-ink-secondary">{t('morning.breathingInstruction')}</p>
    </>
  )
}
