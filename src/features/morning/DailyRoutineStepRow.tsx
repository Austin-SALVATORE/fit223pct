import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useExerciseName } from '@/i18n/seedExercise'
import { ExerciseThumbnail } from '@/ui/ExerciseThumbnail'
import type { DailyRoutineStep } from '@/domain/dailyRoutine'

/**
 * One Morning Posture Reset row — `ExerciseThumbnail` + `useExerciseName` +
 * a units line, wrapped in a `Link` to `/library/<id>` with `origin` router
 * state (plan §3.6). Re-derives `WarmupSection.tsx`'s row markup
 * (`rowLinkClassName`) rather than importing it — **deliberately not
 * shared, not merely out of scope** (architect's reasoning). The two row
 * types look alike today by inheritance, not by requirement: three
 * warm-up rows appear only on training days and are strength-side content;
 * five morning rows appear every day and are program-independent by design
 * (plan §1.7). Extracting a shared helper now would put the morning list's
 * own future divergence on the strength side's helper, where this module
 * is meant to change nothing (Layer 2's whole point). **Revisit only on a
 * third consumer, or a ruling that the two lists must render identically**
 * — either is a real reason; visual coincidence between two is not.
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
    <>
      <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
        {t(key, { count: step.rounds, reps: step.reps, repsMax: step.repsMax })}
        {suffix}
      </p>
      {step.holdSecondsPerRep !== undefined ? (
        <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
          {t('morning.holdPerRep', { seconds: step.holdSecondsPerRep })}
        </p>
      ) : null}
    </>
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
