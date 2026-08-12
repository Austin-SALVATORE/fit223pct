import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useExerciseName } from '@/i18n/seedExercise'
import { ExerciseThumbnail } from '@/ui/ExerciseThumbnail'
import type { OriginState } from '@/lib/navigationOrigin'
import type { Warmup, WarmupStep } from '@/domain/warmup'

/**
 * The pre-strength warm-up, display-only v1 (11 Aug plan §4b). Shared by
 * Today (before the session hero, and again while the session is in
 * progress — TodayPage.tsx's InProgress and TrainingDay both render it, so
 * it never vanishes the moment the owner taps Start, the dc5a119 lesson)
 * and the Plan day detail's projected-day preview — the only two
 * consumers (grep-confirmed), so this component's own fix covers both.
 *
 * Non-interactive by design in one respect only (coach UX requirement:
 * "prepared, not tired" — a warm-up must not feel like a second workout):
 * no record control, no timer, ramp-up loads render as plain text built
 * here at the UI layer — `WarmupStep` structurally cannot reach
 * `domain/progression.ts` (see domain/warmup.ts's docblock), so there is
 * nothing here to accidentally wire into the set engine.
 *
 * **Movement and ramp rows do link to their Library exercise** (12 Aug
 * 2026, owner-reported: "I can't click on the warm-up exercise") — the
 * same navigable idiom `SessionPreview`'s `ItemRow` uses
 * (`react-router` `Link`, `origin` carried as router state so Back
 * returns to wherever the visit started), not a new affordance invented
 * for this component. The `cycle` step has no `exerciseId` and stays a
 * plain row — no link, no hover state, no disabled-looking chevron; its
 * lack of affordance is the normal shape for a step that isn't tied to
 * an exercise, not a broken one.
 */
export function WarmupSection({ warmup, origin = { from: 'today' } }: { warmup: Warmup; origin?: OriginState }) {
  const { t } = useTranslation('today')
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-ink-tertiary">{t('trainingDay.warmupHeading')}</p>
      <ul className="mt-3 space-y-3">
        {warmup.steps.map((step, index) => (
          <li key={index}>
            <WarmupStepRow step={step} origin={origin} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function WarmupStepRow({ step, origin }: { step: WarmupStep; origin: OriginState }) {
  switch (step.kind) {
    case 'cycle':
      return <CycleRow step={step} />
    case 'movement':
      return <MovementRow step={step} origin={origin} />
    case 'ramp':
      return <RampRow step={step} origin={origin} />
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

/**
 * Shared by MovementRow and RampRow — same grid layout as before the
 * link (`grid-cols-[3rem_1fr] items-center gap-x-4`), now a `Link`
 * instead of a `div` so the whole row is one tap target (the 48px
 * thumbnail alone already clears the app's 44px standard —
 * `SettingsLink.tsx`'s own doc — the padding here is for the visible
 * hover/active affordance, not to reach a minimum size).
 */
function rowLinkClassName(): string {
  return '-mx-2 grid grid-cols-[3rem_1fr] items-center gap-x-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-raised active:bg-raised focus-inset'
}

function MovementRow({
  step,
  origin,
}: {
  step: Extract<WarmupStep, { kind: 'movement' }>
  origin: OriginState
}) {
  const { t } = useTranslation('today')
  const name = useExerciseName(step.exerciseId)
  const suffix = step.perSide ? t('sessionPreview.perSideSuffix') : ''
  return (
    <Link to={`/library/${step.exerciseId}`} state={origin} className={rowLinkClassName()}>
      <ExerciseThumbnail exerciseId={step.exerciseId} />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{name}</p>
        <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
          {t('warmup.reps', { count: step.reps })}
          {suffix}
        </p>
      </div>
    </Link>
  )
}

function RampRow({ step, origin }: { step: Extract<WarmupStep, { kind: 'ramp' }>; origin: OriginState }) {
  const { t } = useTranslation('today')
  const name = useExerciseName(step.exerciseId)
  const suffix = step.perSide ? t('sessionPreview.perSideSuffix') : ''
  // Distinct keys per implement (U-1) — the unit is stated, not inferred,
  // because this row makes a prose claim about what weight means, unlike
  // a bare setPlan number.
  const key = step.implement === 'barbell' ? 'warmup.rampWeightRepsBarbell' : 'warmup.rampWeightRepsDumbbell'
  return (
    <Link to={`/library/${step.exerciseId}`} state={origin} className={rowLinkClassName()}>
      <ExerciseThumbnail exerciseId={step.exerciseId} />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{name}</p>
        <p className="mt-0.5 text-sm text-ink-secondary" data-numeric>
          {t(key, { weight: step.weightKg, reps: step.reps })}
          {suffix}
        </p>
      </div>
    </Link>
  )
}
