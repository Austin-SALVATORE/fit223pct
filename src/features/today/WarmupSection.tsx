import { useTranslation } from 'react-i18next'
import { useExerciseName } from '@/i18n/seedExercise'
import { ExerciseThumbnail } from '@/ui/ExerciseThumbnail'
import type { Warmup, WarmupStep } from '@/domain/warmup'

/**
 * The pre-strength warm-up, display-only v1 (11 Aug plan §4b). Shared by
 * Today (before the session hero, and again while the session is in
 * progress — TodayPage.tsx's InProgress and TrainingDay both render it, so
 * it never vanishes the moment the owner taps Start, the dc5a119 lesson)
 * and the Plan day detail's projected-day preview.
 *
 * Static and non-interactive by design (coach UX requirement: "prepared,
 * not tired" — a warm-up must not feel like a second workout). No links,
 * no record control, no timer. Ramp-up loads render as plain text built
 * here at the UI layer — `WarmupStep` structurally cannot reach
 * `domain/progression.ts` (see domain/warmup.ts's docblock), so there is
 * nothing for this component to accidentally wire into the set engine.
 */
export function WarmupSection({ warmup }: { warmup: Warmup }) {
  const { t } = useTranslation('today')
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-ink-tertiary">{t('trainingDay.warmupHeading')}</p>
      <ul className="mt-3 space-y-3">
        {warmup.steps.map((step, index) => (
          <li key={index}>
            <WarmupStepRow step={step} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function WarmupStepRow({ step }: { step: WarmupStep }) {
  switch (step.kind) {
    case 'cycle':
      return <CycleRow step={step} />
    case 'movement':
      return <MovementRow step={step} />
    case 'ramp':
      return <RampRow step={step} />
  }
}

function CycleRow({ step }: { step: Extract<WarmupStep, { kind: 'cycle' }> }) {
  const { t } = useTranslation('today')
  return (
    <p className="text-sm leading-relaxed text-ink-secondary" data-numeric>
      {t('warmup.cycleLine', { minutes: step.minutes })}
    </p>
  )
}

function MovementRow({ step }: { step: Extract<WarmupStep, { kind: 'movement' }> }) {
  const { t } = useTranslation('today')
  const name = useExerciseName(step.exerciseId)
  const suffix = step.perSide ? t('sessionPreview.perSideSuffix') : ''
  return (
    <div className="grid grid-cols-[3rem_1fr] items-center gap-x-4">
      <ExerciseThumbnail exerciseId={step.exerciseId} />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{name}</p>
        <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
          {t('warmup.reps', { count: step.reps })}
          {suffix}
        </p>
      </div>
    </div>
  )
}

function RampRow({ step }: { step: Extract<WarmupStep, { kind: 'ramp' }> }) {
  const { t } = useTranslation('today')
  const name = useExerciseName(step.exerciseId)
  const suffix = step.perSide ? t('sessionPreview.perSideSuffix') : ''
  // Distinct keys per implement (U-1) — the unit is stated, not inferred,
  // because this row makes a prose claim about what weight means, unlike
  // a bare setPlan number.
  const key = step.implement === 'barbell' ? 'warmup.rampWeightRepsBarbell' : 'warmup.rampWeightRepsDumbbell'
  return (
    <div className="grid grid-cols-[3rem_1fr] items-center gap-x-4">
      <ExerciseThumbnail exerciseId={step.exerciseId} />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{name}</p>
        <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
          {t(key, { weight: step.weightKg, reps: step.reps })}
          {suffix}
        </p>
      </div>
    </div>
  )
}
