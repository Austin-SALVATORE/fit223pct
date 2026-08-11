import { useTranslation } from 'react-i18next'
import { isoWeekday } from '@/lib/dates'
import type { ActivityRecord, Program } from '@/domain/types'
import { ActivationSection } from './ActivationSection'
import { TrainingDayRide } from './TrainingDayRide'

/**
 * The post-lift ride and the morning activation are prescribed
 * independently of whether today's session has already been completed
 * (coach spec v2.11 §3 — recording is available as soon as the session
 * ends). `TodayBody`'s `doneToday` branch used to render only
 * `DoneToday` + the check-in card, which made both controls unreachable
 * the moment a training day's workout was marked complete — exactly
 * when a post-lift ride is supposed to be logged (owner-reported defect,
 * M2 first live session, 10 Aug).
 *
 * Reuses `TrainingDayRide`/`ActivationSection` verbatim rather than
 * building parallel markup. What triggers them differs from a training
 * day's own branch: `weekdayActivities`/`morningActivation` are read
 * directly off `program` for today's weekday, not through
 * `resolveDayPlan` — this stays out of domain scheduling by design
 * (architecture.md), and a workout only exists for a day that was a
 * training day, so this is the same activity `resolveDayPlan` would
 * have surfaced.
 */
export function DoneTodayActivities({
  program,
  today,
  todayKey,
  todayActivityRecords,
}: {
  program: Program
  today: Date
  todayKey: string
  todayActivityRecords: ActivityRecord[]
}) {
  const { t } = useTranslation('today')
  const weekday = isoWeekday(today)
  const activity = program.weekdayActivities?.[weekday] ?? null
  const activation = program.morningActivation ?? null
  const rideRecord = todayActivityRecords.find((r) => r.kind === 'ride')
  const activationRecord = todayActivityRecords.find((r) => r.kind === 'activation')

  if (!activity && !activation) return null

  return (
    <>
      {activation && (
        <ActivationSection
          program={program}
          activation={activation}
          heading={t('trainingDay.activationHeading')}
          todayKey={todayKey}
          existing={activationRecord}
        />
      )}
      {activity && (
        <TrainingDayRide
          program={program}
          activity={activity}
          weekday={weekday}
          heading={t('trainingDay.rideHeading')}
          todayKey={todayKey}
          existing={rideRecord}
        />
      )}
    </>
  )
}
