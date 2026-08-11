import { useLocalizedActivation } from '@/i18n/seedProgram'
import { ActivityItemList } from '@/features/recovery/ActivityItemList'
import { ActivationRecordControl } from '@/features/activity/ActivationRecordControl'
import type { ActivityRecord, ActivityTemplate, Program } from '@/domain/types'

/**
 * The one preparation round, shown above the session hero on every
 * training day (docs/design/ActivityPrescriptionPhaseA.md §2) — not a
 * weekday-keyed `ActivityHero`, since it's the same six items regardless
 * of which training day this is. Compact by design: this sits above the
 * actual hero, so it must not compete with it for attention.
 */
export function ActivationSection({
  program,
  activation,
  heading,
  todayKey,
  existing,
}: {
  program: Program
  activation: ActivityTemplate
  heading: string
  todayKey: string
  /** Today's activation record, if any (coach spec v2.11 §3). */
  existing: ActivityRecord | undefined
}) {
  const localized = useLocalizedActivation(program.id, activation, program.origin)
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-ink-tertiary">{heading}</p>
      <ActivityItemList items={localized.items} />
      <ActivationRecordControl dateKey={todayKey} programId={program.id} existing={existing} />
    </div>
  )
}
