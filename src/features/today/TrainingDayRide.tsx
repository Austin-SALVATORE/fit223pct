import { useLocalizedActivity } from '@/i18n/seedProgram'
import { ActivityItemList } from '@/features/recovery/ActivityItemList'
import { RideRecordCard } from '@/features/activity/RideRecordCard'
import type { IsoWeekday } from '@/lib/dates'
import type { ActivityRecord, ActivityTemplate, Program } from '@/domain/types'

/**
 * Post-strength cardio for this weekday, shown below the session preview
 * — display only, free text (§1). Weekday-keyed like a rest day's
 * activity, reusing `useLocalizedActivity` rather than a parallel hook.
 */
export function TrainingDayRide({
  program,
  activity,
  weekday,
  heading,
  todayKey,
  existing,
}: {
  program: Program
  activity: ActivityTemplate
  weekday: IsoWeekday
  heading: string
  todayKey: string
  /** Today's ride record, if any (coach spec v2.11 §3). */
  existing: ActivityRecord | undefined
}) {
  const localized = useLocalizedActivity(program.id, weekday, activity, program.origin)
  // `recordable` marks the one item, if any, that a ride record control
  // belongs under — structural, not inferred from label text (types.ts).
  const recordable = localized.items.some((item) => item.recordable === 'ride')
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-ink-tertiary">{heading}</p>
      <ActivityItemList items={localized.items} />
      {recordable && <RideRecordCard dateKey={todayKey} programId={program.id} existing={existing} />}
    </div>
  )
}
