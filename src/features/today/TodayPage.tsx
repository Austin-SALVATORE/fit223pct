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
import { warmupById } from '@/data/seed/warmups'
import { describeDrivers, readinessFrom, type Readiness } from '@/domain/readiness'
import { applyReadiness } from '@/domain/adjustments'
import { buildWeeklyReview, reviewIsUnseen, type WeeklyReview } from '@/domain/weeklyReview'
import { resolveActivityForDate } from '@/domain/scheduleShift'
import { formatLongDate, isoWeekday, parseDateKey, toDateKey, type IsoWeekday } from '@/lib/dates'
import { useActivityKindLabel } from '@/lib/activityKindLabel'
import { useFocusOnChange } from '@/lib/useFocusOnChange'
import { useLocale } from '@/i18n/useLocale'
import {
  useLocalizedActivity,
  useProgramName,
  useSessionFocus,
  useSessionName,
} from '@/i18n/seedProgram'
import { ActivityItemList } from '@/features/recovery/ActivityItemList'
import { RideRecordCard } from '@/features/activity/RideRecordCard'
import { ConfirmAction } from '@/ui/ConfirmAction'
import { SettingsLink } from '@/ui/SettingsLink'
import type {
  ActivityRecord,
  ActivityTemplate,
  CheckIn,
  Exercise,
  Program,
  ScheduleShift,
  SessionTemplate,
  Workout,
} from '@/domain/types'
import { CheckInCard } from '@/features/checkin/CheckInCard'
import { MeasurementCard } from '@/features/checkin/MeasurementCard'
import { SessionPreview } from './SessionPreview'
import { WeeklyReviewCard } from './WeeklyReviewCard'
import { ActivationSection } from './ActivationSection'
import { TrainingDayRide } from './TrainingDayRide'
import { DoneTodayActivities } from './DoneTodayActivities'
import { WarmupSection } from './WarmupSection'
import { PostponeButton } from './PostponeButton'

/** Never rendered — see InProgress's Rules-of-Hooks comment. */
const EMPTY_SESSION: SessionTemplate = { id: '', name: '', focus: '', items: [] }

/**
 * Never rendered — same Rules-of-Hooks reasoning as EMPTY_SESSION.
 * useProgramName already guards `id === ''` (i18n/seedProgram.ts), so
 * calling it unconditionally with this placeholder when there is no
 * successor program is safe (final-rest-day-lookahead.md §4 Phase 1b).
 */
const EMPTY_PROGRAM: Program = {
  id: '',
  name: '',
  phase: 0,
  startDate: '',
  endDate: null,
  trainingWeekdays: [],
  rotation: [],
  sessions: [],
}

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
  /** The successor program, if the current one has already ended or is about to (final-rest-day-lookahead.md §4 Phase 1b). */
  nextProgram: Program | undefined
  nextProgramCompletedCount: number
  /** The athlete's one active postpone this ISO week, if any (postpone-day plan §3). */
  scheduleShift: ScheduleShift | null
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
      nextProgram,
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
      programRepo.getNext(todayKey),
    ])
    const completedCount = program ? await workoutRepo.countCompleted(program.id) : 0
    const nextProgramCompletedCount = nextProgram ? await workoutRepo.countCompleted(nextProgram.id) : 0
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
      nextProgram,
      nextProgramCompletedCount,
      scheduleShift: settings?.scheduleShift ?? null,
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
    nextProgram,
    nextProgramCompletedCount,
    scheduleShift,
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
          {program && (
            <DoneTodayActivities
              program={program}
              {...resolveActivityForDate(program, todayKey, scheduleShift)}
              todayKey={todayKey}
              todayActivityRecords={todayActivityRecords}
            />
          )}
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
          nextProgram={nextProgram}
          nextProgramCompletedCount={nextProgramCompletedCount}
          scheduleShift={scheduleShift}
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
  nextProgram,
  nextProgramCompletedCount,
  scheduleShift,
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
  nextProgram: Program | undefined
  nextProgramCompletedCount: number
  scheduleShift: ScheduleShift | null
}) {
  const { t } = useTranslation('today')
  const programName = useProgramName(program)
  // Unconditional (Rules of Hooks) — useProgramName already guards `id
  // === ''`, so EMPTY_PROGRAM is safe when there is no successor.
  const nextProgramName = useProgramName(nextProgram ?? EMPTY_PROGRAM)
  const plan = resolveDayPlan(program, today, completedCount, scheduleShift)
  const eased = readiness.tier === 'easier'
  const rideRecord = todayActivityRecords.find((r) => r.kind === 'ride')
  const activationRecord = todayActivityRecords.find((r) => r.kind === 'activation')
  /*
    The successor program's own `upcoming` state, asked directly rather
    than built as new cross-program scheduling logic (final-rest-day-
    lookahead.md §2) — `nextProgram.startDate > todayKey` by construction
    (programRepo.getNext), so `resolveDayPlan` on it always returns
    `upcoming` when the precondition below holds. A malformed successor
    (no training weekdays, or weekday-pinned with no session for the
    weekday `nextTrainingDateOnOrAfter` lands on) would throw inside
    `resolveDayPlan` — there is no error boundary anywhere in `src/` — so
    this precondition is what keeps a bad future program from blanking
    today's screen; residual risk on the second throw site is unchanged
    from what the `upcoming` branch already accepts for the current
    program.
  */
  const nextPhaseUsable =
    nextProgram !== undefined &&
    nextProgram.trainingWeekdays.length > 0 &&
    nextProgram.sessions.length > 0
  const nextPhasePlan =
    nextPhaseUsable && nextProgram
      ? resolveDayPlan(nextProgram, today, nextProgramCompletedCount)
      : null

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
          readiness={readiness}
          rideRecord={rideRecord}
          activationRecord={activationRecord}
          checkInCard={checkInCard}
          activity={plan.activity}
          activation={plan.activation}
          activityWeekday={plan.activityWeekday}
          shiftedFrom={plan.shiftedFrom}
          scheduleShift={scheduleShift}
        />
      )}

      {plan.kind === 'rest' && plan.postponedTo !== null && (
        <PostponedDay postponedTo={plan.postponedTo} checkInCard={checkInCard} />
      )}

      {plan.kind === 'rest' && plan.postponedTo === null && plan.nextSession !== null && (
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
        endDate (final-rest-day-lookahead.md §4). Two sub-cases:
        - A successor program exists and is usable (Phase 1b) — preview
          its opening session, no start button (owner ruling, amendment
          A1: a workout must not be creatable across a phase boundary).
        - No usable successor (Phase 1a's bare fallback) — the day's own
          authored activity (if any) still renders; there is simply
          nothing to preview as "next" from any program.
      */}
      {plan.kind === 'rest' &&
        plan.nextSession === null &&
        plan.postponedTo === null &&
        (nextPhasePlan && nextPhasePlan.kind === 'upcoming' && nextProgram ? (
          <UnscheduledDay
            program={nextProgram}
            session={nextPhasePlan.firstSession}
            exerciseById={exerciseById}
            todayKey={todayKey}
            todayCheckIn={todayCheckIn}
            readiness={readiness}
            checkInCard={checkInCard}
            activity={plan.activity}
            showStartButton={false}
            // Reuses plannedDay.startsIn rather than new phrasing
            // (amendment A3) — the heading names the successor program
            // but says nothing about when, same gap the `upcoming` hero
            // already fills with this exact key.
            subtitle={t('plannedDay.startsIn', { count: nextPhasePlan.daysUntilStart })}
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
            heading={t('plannedDay.nextPhaseHeading', { program: nextProgramName })}
          />
        ) : (
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
        ))}

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
  readiness,
  checkInCard,
  activity,
  activation,
  activityWeekday,
  shiftedFrom,
  scheduleShift,
  rideRecord,
  activationRecord,
}: {
  program: Program
  session: SessionTemplate
  exerciseById: Map<string, Exercise>
  todayKey: string
  readiness: Readiness
  checkInCard: ReactNode
  /** Post-strength cardio for this weekday, display only (docs/design/ActivityPrescriptionPhaseA.md §1). */
  activity: ActivityTemplate | null
  /** The one preparation round, shown before the session on every training day (§2). */
  activation: ActivityTemplate | null
  /** The weekday whose locale key `activity` resolves under — the source weekday when this session was shifted in (postpone-day plan §5 R1), never today's own weekday. */
  activityWeekday: IsoWeekday
  /** Source date this session was postponed from, when a shift moved it here; null for an ordinary unshifted training day. */
  shiftedFrom: string | null
  /** The athlete's one active postpone this ISO week, if any — what `PostponeButton` checks for "already shifted". */
  scheduleShift: ScheduleShift | null
  /** Today's ride record, if any (coach spec v2.11 §3) — undefined until logged. */
  rideRecord: ActivityRecord | undefined
  /** Today's activation record, if any. */
  activationRecord: ActivityRecord | undefined
}) {
  const { t } = useTranslation('today')
  const { t: tCommon } = useTranslation('common')
  const locale = useLocale()
  const sessionName = useSessionName(program.id, session, program.origin)
  const sessionFocus = useSessionFocus(program.id, session, program.origin)
  const adjusted = applyReadiness(session, readiness)
  const eased = adjusted.adjustments.length > 0
  const because = describeDrivers(readiness.drivers)
  const warmup = session.warmupId ? warmupById(session.warmupId) : undefined

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
      {/*
        Activation → Warm-up → Strength, per the coach's own flow (11 Aug
        plan §4b). Also rendered in InProgress below, for the same reason
        ActivationSection/TrainingDayRide render in both branches — a
        static card placed only here vanishes the moment the owner taps
        Start (dc5a119), exactly when a ramp-up load is needed.
      */}
      {warmup && <WarmupSection warmup={warmup} />}
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
      {/* States what's happening (postpone-day plan §9) — a postponed session's receiving day names the day it moved from. */}
      {shiftedFrom !== null && (
        <p className="mt-1 text-sm text-ink-tertiary">
          {t('trainingDay.shiftedFrom', { date: formatLongDate(parseDateKey(shiftedFrom), locale) })}
        </p>
      )}
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
          weekday={activityWeekday}
          heading={t('trainingDay.rideHeading')}
          todayKey={todayKey}
          existing={rideRecord}
        />
      )}
      <PostponeButton program={program} todayKey={todayKey} existingShift={scheduleShift} />
    </>
  )
}

/**
 * The vacated day a postpone moved a session away from — a rest hero
 * that states plainly what happened, never language implying a mistake
 * (postpone-day plan §9: "moved to Saturday", not "skipped"). No session
 * preview and no start button: starting today would offer exactly the
 * same session Saturday will (rotation preserves identity — §1), but the
 * UI's whole point is to agree with the athlete's own decision that
 * today isn't the day, so nothing here should invite otherwise.
 */
function PostponedDay({
  postponedTo,
  checkInCard,
}: {
  postponedTo: string
  checkInCard: ReactNode
}) {
  const { t } = useTranslation('today')
  const locale = useLocale()
  // Undo must vanish once a workout exists on the shifted date — undoing
  // then would silently rewrite a day already trained (§8.6). `undefined`
  // covers both "still loading" and "genuinely nothing there yet"; a
  // vanishingly rare loading-frame flash is an acceptable cost for
  // reusing the same live-query pattern the rest of this page uses.
  const shiftedWorkout = useLiveQuery(() => workoutRepo.getByDate(postponedTo), [postponedTo])
  const canUndo = shiftedWorkout === undefined

  async function undo() {
    await settingsRepo.setScheduleShift(null)
  }

  return (
    <>
      <Hero
        eyebrow={t('postponed.eyebrow')}
        title={t('postponed.title', { date: formatLongDate(parseDateKey(postponedTo), locale) })}
        subtitle={t('postponed.subtitle')}
      />
      {checkInCard}
      {canUndo && (
        <button
          type="button"
          onClick={() => void undo()}
          className="mt-6 w-full rounded-card border border-border py-3.5 text-center text-base font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
        >
          {t('postponed.undo')}
        </button>
      )}
    </>
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
  // The non-obvious rendering case (11 Aug plan §4b): without this, the
  // warm-up card is only ever visible in the planned branch and vanishes
  // the instant the owner taps Start — exactly when "5.2 kg × 8" is
  // needed at the dumbbells. Same dc5a119 reasoning as TrainingDayRide.
  const warmup = session?.warmupId ? warmupById(session.warmupId) : undefined

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
      {warmup && <WarmupSection warmup={warmup} />}
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
