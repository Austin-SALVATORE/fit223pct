import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import {
  activityRecordRepo,
  checkinRepo,
  exerciseRepo,
  programRepo,
  settingsRepo,
  workoutRepo,
} from '@/data/repositories'
import { resolveDayPlan } from '@/domain/schedule'
import { createWorkout, summarizeWorkout } from '@/domain/workout'
import { describeDrivers, readinessFrom, type Readiness } from '@/domain/readiness'
import { applyReadiness } from '@/domain/adjustments'
import { buildWeeklyReview, reviewIsUnseen, type WeeklyReview } from '@/domain/weeklyReview'
import { formatLongDate, isoWeekday, toDateKey, type IsoWeekday } from '@/lib/dates'
import { useActivityKindLabel } from '@/lib/activityKindLabel'
import { useFocusOnChange } from '@/lib/useFocusOnChange'
import { useLocale } from '@/i18n/useLocale'
import {
  useLocalizedActivation,
  useLocalizedActivity,
  useProgramName,
  useSessionFocus,
  useSessionName,
} from '@/i18n/seedProgram'
import { ActivityItemList } from '@/features/recovery/ActivityItemList'
import { RideRecordCard } from '@/features/activity/RideRecordCard'
import { ActivationRecordControl } from '@/features/activity/ActivationRecordControl'
import { ConfirmAction } from '@/ui/ConfirmAction'
import { SettingsLink } from '@/ui/SettingsLink'
import type {
  ActivityRecord,
  ActivityTemplate,
  CheckIn,
  Exercise,
  Program,
  SessionTemplate,
  Workout,
} from '@/domain/types'
import { CheckInCard } from '@/features/checkin/CheckInCard'
import { MeasurementCard } from '@/features/checkin/MeasurementCard'
import { SessionPreview } from './SessionPreview'
import { WeeklyReviewCard } from './WeeklyReviewCard'

/** Never rendered — see InProgress's Rules-of-Hooks comment. */
const EMPTY_SESSION: SessionTemplate = { id: '', name: '', focus: '', items: [] }

interface TodayData {
  program: Program | undefined
  exercises: Exercise[]
  activeWorkout: Workout | undefined
  todayWorkout: Workout | undefined
  todayCheckIn: CheckIn | undefined
  recentCheckIns: CheckIn[]
  completedCount: number
  weeklyReview: WeeklyReview | null
  lastSeenWeeklyReviewWeekStart: string | null
  /** Today's ride/activation records, if any (coach spec v2.11 §3) — at most one per kind. */
  todayActivityRecords: ActivityRecord[]
}

export function TodayPage() {
  const today = new Date()
  const todayKey = toDateKey(today)
  const reducedMotion = useReducedMotion()

  const data = useLiveQuery(async (): Promise<TodayData> => {
    const [
      program,
      exercises,
      activeWorkout,
      todayWorkout,
      todayCheckIn,
      recentCheckIns,
      settings,
      todayActivityRecords,
    ] = await Promise.all([
      programRepo.getActive(todayKey),
      exerciseRepo.getAll(),
      workoutRepo.getActive(),
      workoutRepo.getByDate(todayKey),
      checkinRepo.getByDate(todayKey),
      // readinessFrom's consecutive-day walk can run well past 14 days —
      // the default window undercounts any streak longer than that.
      checkinRepo.getRecent(60),
      settingsRepo.get(),
      activityRecordRepo.getByDate(todayKey),
    ])
    const completedCount = program ? await workoutRepo.countCompleted(program.id) : 0
    // Not gated to Monday — a review the user hasn't seen yet stays
    // available on every open of the week it covers, never tied to
    // whether they happened to open the app on any one particular day.
    const weeklyReview = program
      ? buildWeeklyReview(program, await workoutRepo.getCompleted(), today)
      : null
    return {
      program,
      exercises,
      activeWorkout,
      todayWorkout,
      todayCheckIn,
      recentCheckIns,
      completedCount,
      weeklyReview,
      lastSeenWeeklyReviewWeekStart: settings?.lastSeenWeeklyReviewWeekStart ?? null,
      todayActivityRecords,
    }
  }, [todayKey])

  // Root stays a single <motion.div> across loading and loaded states —
  // swapping root element types on load would force React to unmount and
  // remount everything underneath it, including the header, for no reason.
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Header date={today} />
      {data && <TodayBody data={data} today={today} todayKey={todayKey} />}
    </motion.div>
  )
}

function TodayBody({
  data,
  today,
  todayKey,
}: {
  data: TodayData
  today: Date
  todayKey: string
}) {
  const {
    program,
    exercises,
    activeWorkout,
    todayWorkout,
    todayCheckIn,
    recentCheckIns,
    completedCount,
    weeklyReview,
    lastSeenWeeklyReviewWeekStart,
    todayActivityRecords,
  } = data
  // Decided once, at this component instance's first render, and never
  // re-derived — marking the review "seen" writes to settings, which would
  // otherwise make this card vanish out from under the user moments after
  // it appeared, in the very session that's supposed to show it.
  const [showWeeklyReview] = useState(() =>
    reviewIsUnseen(weeklyReview, lastSeenWeeklyReviewWeekStart),
  )
  const exerciseById = new Map(exercises.map((e) => [e.id, e]))
  const doneToday = todayWorkout !== undefined && todayWorkout.completedAt !== null
  const readiness = readinessFrom(todayCheckIn ?? null, recentCheckIns)
  // Once today's session has started, the readiness it was started on is
  // fixed — editing the check-in now can't retroactively change that plan.
  const sessionStartedToday = activeWorkout !== undefined || doneToday
  const checkInCard = (
    <CheckInCard
      dateKey={todayKey}
      checkIn={todayCheckIn}
      readiness={readiness}
      locked={sessionStartedToday}
    />
  )

  return (
    <>
      {showWeeklyReview && weeklyReview && <WeeklyReviewCard review={weeklyReview} />}

      {activeWorkout ? (
        <>
          <InProgress workout={activeWorkout} program={program} />
          {checkInCard}
        </>
      ) : doneToday && todayWorkout ? (
        <>
          <DoneToday workout={todayWorkout} />
          {checkInCard}
        </>
      ) : program ? (
        <PlannedDay
          program={program}
          completedCount={completedCount}
          exerciseById={exerciseById}
          today={today}
          todayKey={todayKey}
          todayCheckIn={todayCheckIn}
          readiness={readiness}
          checkInCard={checkInCard}
          todayActivityRecords={todayActivityRecords}
        />
      ) : (
        <NoProgram checkInCard={checkInCard} />
      )}
    </>
  )
}

function NoProgram({ checkInCard }: { checkInCard: ReactNode }) {
  const { t } = useTranslation('today')
  return (
    <>
      <p className="mt-10 text-ink-secondary">{t('noProgram')}</p>
      {checkInCard}
    </>
  )
}

function PlannedDay({
  program,
  completedCount,
  exerciseById,
  today,
  todayKey,
  todayCheckIn,
  readiness,
  checkInCard,
  todayActivityRecords,
}: {
  program: Program
  completedCount: number
  exerciseById: Map<string, Exercise>
  today: Date
  todayKey: string
  todayCheckIn: CheckIn | undefined
  readiness: Readiness
  checkInCard: ReactNode
  todayActivityRecords: ActivityRecord[]
}) {
  const { t } = useTranslation('today')
  const programName = useProgramName(program)
  const plan = resolveDayPlan(program, today, completedCount)
  const eased = readiness.tier === 'easier'
  const rideRecord = todayActivityRecords.find((r) => r.kind === 'ride')
  const activationRecord = todayActivityRecords.find((r) => r.kind === 'activation')

  return (
    <>
      {plan.kind === 'upcoming' && (
        <UnscheduledDay
          program={program}
          session={plan.firstSession}
          exerciseById={exerciseById}
          todayKey={todayKey}
          todayCheckIn={todayCheckIn}
          readiness={readiness}
          checkInCard={checkInCard}
          activity={null}
          showStartButton
          hero={
            <Hero
              eyebrow={t('plannedDay.startsIn', { count: plan.daysUntilStart })}
              title={programName}
              subtitle={t('plannedDay.upcomingSubtitle')}
            />
          }
          heading={t('plannedDay.upcomingHeading')}
        />
      )}

      {plan.kind === 'training' && (
        <TrainingDay
          program={program}
          session={plan.session}
          exerciseById={exerciseById}
          todayKey={todayKey}
          today={today}
          readiness={readiness}
          rideRecord={rideRecord}
          activationRecord={activationRecord}
          checkInCard={checkInCard}
          activity={plan.activity}
          activation={plan.activation}
        />
      )}

      {plan.kind === 'rest' && plan.nextSession !== null && (
        <UnscheduledDay
          program={program}
          session={plan.nextSession}
          exerciseById={exerciseById}
          todayKey={todayKey}
          todayCheckIn={todayCheckIn}
          readiness={readiness}
          checkInCard={checkInCard}
          activity={plan.activity}
          showStartButton
          hero={
            plan.activity ? (
              <ActivityHero
                programId={program.id}
                programOrigin={program.origin}
                weekday={isoWeekday(today)}
                activity={plan.activity}
                todayKey={todayKey}
                rideRecord={rideRecord}
              />
            ) : (
              <Hero
                eyebrow={t('plannedDay.restEyebrow')}
                title={t('plannedDay.restTitle')}
                subtitle={
                  eased
                    ? t('plannedDay.restSubtitleEased')
                    : t('plannedDay.restSubtitleReady')
                }
              />
            )
          }
          heading={t('plannedDay.restHeading')}
        />
      )}

      {/*
        This program has no training day left on or before its own
        endDate (final-rest-day-lookahead.md §4 Phase 1a) — the bare
        fallback. The day's own authored activity (if any) still renders;
        there is simply nothing to preview as "next" from this program.
        No SessionPreview, no StartButton — there is no session to start.
      */}
      {plan.kind === 'rest' && plan.nextSession === null && (
        <>
          {plan.activity ? (
            <ActivityHero
              programId={program.id}
              programOrigin={program.origin}
              weekday={isoWeekday(today)}
              activity={plan.activity}
              todayKey={todayKey}
              rideRecord={rideRecord}
            />
          ) : (
            <Hero
              eyebrow={t('plannedDay.restEyebrow')}
              title={t('plannedDay.restTitle')}
              subtitle={t('plannedDay.phaseEndingSubtitle')}
            />
          )}
          {plan.activity?.kind === 'checkpoint' && (
            <MeasurementCard dateKey={todayKey} checkIn={todayCheckIn} />
          )}
          {checkInCard}
        </>
      )}

      {plan.kind === 'ended' && (
        <>
          <Hero
            eyebrow={t('plannedDay.endedEyebrow')}
            title={t('plannedDay.endedTitle')}
            subtitle={t('plannedDay.endedSubtitle')}
          />
          {checkInCard}
        </>
      )}
    </>
  )
}

function TrainingDay({
  program,
  session,
  exerciseById,
  todayKey,
  today,
  readiness,
  checkInCard,
  activity,
  activation,
  rideRecord,
  activationRecord,
}: {
  program: Program
  session: SessionTemplate
  exerciseById: Map<string, Exercise>
  todayKey: string
  today: Date
  readiness: Readiness
  checkInCard: ReactNode
  /** Post-strength cardio for this weekday, display only (docs/design/ActivityPrescriptionPhaseA.md §1). */
  activity: ActivityTemplate | null
  /** The one preparation round, shown before the session on every training day (§2). */
  activation: ActivityTemplate | null
  /** Today's ride record, if any (coach spec v2.11 §3) — undefined until logged. */
  rideRecord: ActivityRecord | undefined
  /** Today's activation record, if any. */
  activationRecord: ActivityRecord | undefined
}) {
  const { t } = useTranslation('today')
  const { t: tCommon } = useTranslation('common')
  const sessionName = useSessionName(program.id, session, program.origin)
  const sessionFocus = useSessionFocus(program.id, session, program.origin)
  const adjusted = applyReadiness(session, readiness)
  const eased = adjusted.adjustments.length > 0
  const because = describeDrivers(readiness.drivers)

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
      <Hero
        // Per-locale punctuation, not an ASCII join: zh-CN sets the middot
        // without surrounding spaces (docs/review-backlog.md I7). Visible on
        // Today every training day.
        eyebrow={tCommon('middotJoin', { a: sessionName, b: sessionFocus })}
        title={sessionFocus}
        subtitle={
          eased
            ? t('trainingDay.easedSubtitle', { driversKey: because.key, ...because.params })
            : t('trainingDay.readySubtitle')
        }
      />
      {checkInCard}
      <StartButton
        program={program}
        session={adjusted.session}
        readiness={readiness}
        todayKey={todayKey}
      />
      {readiness.consecutiveLowDays >= 2 && (
        <p className="mt-4 text-center text-sm leading-relaxed text-ink-secondary">
          {t('trainingDay.lowStreak', { count: readiness.consecutiveLowDays })}
        </p>
      )}
      <SessionPreview
        session={adjusted.session}
        programId={program.id}
        programOrigin={program.origin}
        exerciseById={exerciseById}
        heading={t('trainingDay.heading')}
        badge={eased ? t('trainingDay.adjustedBadge') : undefined}
        reasons={eased ? adjusted.adjustments.map((a) => t(a.reason.key, a.reason.params)) : undefined}
      />
      {activity && (
        <TrainingDayRide
          program={program}
          activity={activity}
          weekday={isoWeekday(today)}
          heading={t('trainingDay.rideHeading')}
          todayKey={todayKey}
          existing={rideRecord}
        />
      )}
    </>
  )
}

/**
 * The one preparation round, shown above the session hero on every
 * training day (docs/design/ActivityPrescriptionPhaseA.md §2) — not a
 * weekday-keyed `ActivityHero`, since it's the same six items regardless
 * of which training day this is. Compact by design: this sits above the
 * actual hero, so it must not compete with it for attention.
 */
function ActivationSection({
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

/**
 * Post-strength cardio for this weekday, shown below the session preview
 * — display only, free text (§1). Weekday-keyed like a rest day's
 * activity, reusing `useLocalizedActivity` rather than a parallel hook.
 */
function TrainingDayRide({
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

/**
 * A day with no scheduled session — a rest day, or any day before the
 * program starts. The day's framing (rest, anticipation) stays the hero;
 * the way into Workout Mode is a quiet affordance below the preview, so
 * training early is always possible but never the recommendation. What it
 * starts is exactly what the preview shows: the same readiness-adjusted
 * session a training day would offer.
 */
function UnscheduledDay({
  program,
  session,
  exerciseById,
  todayKey,
  todayCheckIn,
  readiness,
  checkInCard,
  activity,
  hero,
  heading,
  subtitle,
  showStartButton,
}: {
  program: Program
  session: SessionTemplate
  exerciseById: Map<string, Exercise>
  todayKey: string
  todayCheckIn: CheckIn | undefined
  readiness: Readiness
  checkInCard: ReactNode
  activity: ActivityTemplate | null
  hero: ReactNode
  heading: string
  /**
   * Timing context shown under the preview heading — e.g. "Starts in 2
   * days", reusing plannedDay.startsIn rather than inventing new copy
   * (final-rest-day-lookahead.md §9 Q2 amendment). Absent for the
   * ordinary "next scheduled session" case, where the next session is
   * always imminent enough that stating a day count adds nothing.
   */
  subtitle?: string
  /**
   * False for the cross-phase preview: the owner ruled no start button
   * across a phase boundary (final-rest-day-lookahead.md amendment A1) —
   * `program`/`session` here would belong to a program that has not
   * started yet, and `createWorkout` must not be reachable from it.
   */
  showStartButton: boolean
}) {
  const { t } = useTranslation('today')
  const adjusted = applyReadiness(session, readiness)
  const eased = adjusted.adjustments.length > 0

  return (
    <>
      {hero}
      {activity?.kind === 'checkpoint' && (
        <MeasurementCard dateKey={todayKey} checkIn={todayCheckIn} />
      )}
      {checkInCard}
      <SessionPreview
        session={adjusted.session}
        programId={program.id}
        programOrigin={program.origin}
        exerciseById={exerciseById}
        heading={heading}
        subtitle={subtitle}
        badge={eased ? t('trainingDay.adjustedBadge') : undefined}
        reasons={eased ? adjusted.adjustments.map((a) => t(a.reason.key, a.reason.params)) : undefined}
      />
      {showStartButton && (
        <StartButton
          program={program}
          session={adjusted.session}
          readiness={readiness}
          todayKey={todayKey}
          variant="quiet"
        />
      )}
    </>
  )
}

function StartButton({
  program,
  session,
  readiness,
  todayKey,
  variant = 'primary',
}: {
  program: Program
  session: SessionTemplate
  readiness: Readiness
  todayKey: string
  /** 'quiet' is the early-start affordance on unscheduled days — present, never insistent */
  variant?: 'primary' | 'quiet'
}) {
  const { t } = useTranslation('today')
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)

  async function start() {
    if (starting) return
    setStarting(true)
    const workout = {
      ...createWorkout({
        id: crypto.randomUUID(),
        programId: program.id,
        session,
        date: todayKey,
        startedAt: new Date().toISOString(),
      }),
      readiness: {
        tier: readiness.tier,
        drivers: readiness.drivers.map((d) => d.signal),
      },
    }
    await workoutRepo.put(workout)
    await navigate('/workout')
  }

  if (variant === 'quiet') {
    return (
      <button
        type="button"
        disabled={starting}
        onClick={() => void start()}
        className="mt-6 w-full rounded-card border border-border py-3.5 text-center text-base font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink disabled:opacity-60"
      >
        {t('startButton.quiet')}
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={starting}
      onClick={() => void start()}
      className="mt-8 w-full rounded-card bg-amber py-4 text-center text-lg font-semibold text-bg transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {t('startButton.primary')}
    </button>
  )
}

function InProgress({ workout, program }: { workout: Workout; program?: Program }) {
  const { t } = useTranslation('today')
  // Discard used to arm by swapping its own label in place. The element
  // stayed mounted, so nothing announced the state change and a blind user
  // could destroy an in-progress workout without ever perceiving a confirm
  // step (docs/review-backlog.md A4). It now uses the same confirm the swap
  // sheet does — one pattern for one concept.
  const [confirming, setConfirming] = useState(false)
  // Returns focus to the discard button when the confirm is cancelled. The
  // hook skips the first render by design, so an ordinary Today load with a
  // workout in progress never steals focus.
  const discardRef = useFocusOnChange<HTMLButtonElement>(!confirming)
  const session = program?.sessions.find((s) => s.id === workout.sessionTemplateId)
  // Called unconditionally with a placeholder when the workout's session
  // template can't be found — Rules of Hooks, mirroring PlanPage's DayRow.
  // Both values are localized: resuming used to render the stored English
  // focus verbatim (docs/review-backlog.md I1), and the session *name* never
  // appeared at all, so the day lost its identity the moment it started.
  const resolvedName = useSessionName(program?.id ?? '', session ?? EMPTY_SESSION, program?.origin)
  const resolvedFocus = useSessionFocus(program?.id ?? '', session ?? EMPTY_SESSION, program?.origin)
  const loggedSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0)

  return (
    <>
      <Hero
        eyebrow={
          session ? t('inProgress.eyebrowWithSession', { sessionName: resolvedName }) : t('inProgress.eyebrow')
        }
        title={session ? resolvedFocus : t('inProgress.sessionFallback')}
        subtitle={
          loggedSets > 0
            ? t('inProgress.loggedSets', { count: loggedSets })
            : t('inProgress.waiting')
        }
      />
      <Link
        to="/workout"
        className="mt-8 block w-full rounded-card bg-amber py-4 text-center text-lg font-semibold text-bg transition-transform active:scale-[0.98]"
      >
        {t('inProgress.resume')}
      </Link>
      {confirming ? (
        <div className="mt-8">
          <ConfirmAction
            heading={
              loggedSets > 0
                ? t('inProgress.discardConfirmHeading', { count: loggedSets })
                : t('inProgress.discardConfirmHeadingEmpty')
            }
            warning={t('inProgress.discardConfirmWarning')}
            confirmLabel={t('inProgress.discardConfirmAction')}
            cancelLabel={t('inProgress.discardConfirmCancel')}
            onConfirm={() => void workoutRepo.remove(workout.id)}
            onCancel={() => setConfirming(false)}
          />
        </div>
      ) : (
        <button
          ref={discardRef}
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 w-full text-center text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          {t('inProgress.discard')}
        </button>
      )}
    </>
  )
}

function DoneToday({ workout }: { workout: Workout }) {
  const { t } = useTranslation('today')
  const summary = summarizeWorkout(workout)
  const minutes = summary.durationMinutes
  const setsPhrase = t('doneToday.sets', { count: summary.totalSets })
  const minutesPhrase = minutes !== null ? t('doneToday.inMinutes', { count: minutes }) : ''
  return (
    <Hero
      eyebrow={t('doneToday.eyebrow')}
      title={t('doneToday.title')}
      subtitle={t('doneToday.subtitle', {
        setsPhrase,
        minutesPhrase,
        volume: Math.round(summary.volumeKg),
      })}
    />
  )
}

function Header({ date }: { date: Date }) {
  const { t } = useTranslation('common')
  const locale = useLocale()
  return (
    <header className="flex items-baseline justify-between gap-2">
      <p className="eyebrow">
        <time dateTime={toDateKey(date)}>{formatLongDate(date, locale)}</time>
      </p>
      <div className="flex items-center gap-3">
        <nav className="flex gap-3">
          <Link
            to="/plan"
            className="text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-secondary"
          >
            {t('nav.plan')}
          </Link>
          <Link
            to="/progress"
            className="text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-secondary"
          >
            {t('nav.progress')}
          </Link>
          <Link
            to="/library"
            className="text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-secondary"
          >
            {t('nav.library')}
          </Link>
        </nav>
        <SettingsLink origin="today" variant="inline" />
      </div>
    </header>
  )
}

interface HeroProps {
  eyebrow: string
  title: string
  subtitle: string
}

function Hero({ eyebrow, title, subtitle }: HeroProps) {
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-amber">{eyebrow}</p>
      <h1 className="text-display mt-2 text-5xl text-ink">{title}</h1>
      <p className="mt-4 max-w-[34ch] leading-relaxed text-ink-secondary">{subtitle}</p>
    </div>
  )
}

/**
 * Replaces the bare rest hero on a day with an authored activity — same
 * quiet tone, no completion state anywhere in it (see docs/DailyProgram.md:
 * skipping is always fine, a checkbox here would be a streak mechanic).
 */
function ActivityHero({
  programId,
  programOrigin,
  weekday,
  activity,
  todayKey,
  rideRecord,
}: {
  programId: string
  programOrigin: Program['origin']
  weekday: IsoWeekday
  activity: ActivityTemplate
  todayKey: string
  /** Today's ride record, if any (coach spec v2.11 §3) — only meaningful when this activity carries a recordable item. */
  rideRecord: ActivityRecord | undefined
}) {
  const kindLabel = useActivityKindLabel(activity.kind)
  const localized = useLocalizedActivity(programId, weekday, activity, programOrigin)
  // `recordable` marks the one item, if any, that a ride record control
  // belongs under — structural, not inferred from label text (types.ts).
  const recordable = localized.items.some((item) => item.recordable === 'ride')
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-amber">{kindLabel}</p>
      <h1 className="text-display mt-2 text-5xl text-ink">{localized.title}</h1>
      <ActivityItemList items={localized.items} />
      {recordable && <RideRecordCard dateKey={todayKey} programId={programId} existing={rideRecord} />}
    </div>
  )
}
