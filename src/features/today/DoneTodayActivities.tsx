import { useTranslation } from 'react-i18next'
import type { IsoWeekday } from '@/lib/dates'
import type { ActivityRecord, ActivityTemplate, Program } from '@/domain/types'
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
 * building parallel markup. `activity`/`activityWeekday` arrive already
 * resolved by the caller (`resolveActivityForDate`, postpone-day plan
 * §5 R2) rather than read directly off `program` for today's own
 * weekday — reading `program.weekdayActivities?.[isoWeekday(today)]`
 * here used to bypass `resolveDayPlan`'s shift resolution entirely, so
 * a completed session on a postponed-in Saturday would show Saturday's
 * own recovery block ("Complete rest is a fine choice too") instead of
 * the post-strength ride the athlete is meant to log — surfacing only
 * *after* completion, with nobody watching. `morningActivation` still
 * reads straight off `program`: it's one program-level round, not
 * weekday-keyed, so no shift can touch it.
 */
export function DoneTodayActivities({
  program,
  activity,
  activityWeekday,
  todayKey,
  todayActivityRecords,
}: {
  program: Program
  activity: ActivityTemplate | null
  activityWeekday: IsoWeekday
  todayKey: string
  todayActivityRecords: ActivityRecord[]
}) {
  const { t } = useTranslation('today')
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
          weekday={activityWeekday}
          heading={t('trainingDay.rideHeading')}
          todayKey={todayKey}
          existing={rideRecord}
        />
      )}
    </>
  )
}
