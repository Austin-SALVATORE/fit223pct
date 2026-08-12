import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import { exerciseRepo, programRepo, workoutRepo } from '@/data/repositories'
import { projectSchedule, type ScheduleDay } from '@/domain/schedule'
import { summarizeWorkout } from '@/domain/workout'
import { formatLongDate, isoWeekday, parseDateKey, toDateKey, type IsoWeekday } from '@/lib/dates'
import { useActivityKindLabel } from '@/lib/activityKindLabel'
import { useExerciseName } from '@/i18n/seedExercise'
import { useLocalizedActivation, useLocalizedActivity, useSessionName } from '@/i18n/seedProgram'
import { useLocale } from '@/i18n/useLocale'
import { SessionPreview } from '@/features/today/SessionPreview'
import { WarmupSection } from '@/features/today/WarmupSection'
import { warmupById } from '@/data/seed/warmups'
import type { ActivityTemplate, Exercise, LoggedSet, Program, SessionTemplate, Workout } from '@/domain/types'
import { ActivityItemList } from '@/features/recovery/ActivityItemList'
import { ExerciseThumbnail } from '@/ui/ExerciseThumbnail'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Never rendered — see CompletedDetail's resolvedSessionName comment. */
const EMPTY_SESSION: SessionTemplate = { id: '', name: '', focus: '', items: [] }

/**
 * Amendment (19 Jul) to docs/Plan.md: every day row is now clickable.
 * Today's row still links straight to Today — this page redirects there
 * rather than duplicating it.
 */
export function PlanDayPage() {
  const locale = useLocale()
  const { date } = useParams<{ date: string }>()
  const validDate = typeof date === 'string' && DATE_KEY_PATTERN.test(date)
  const todayKey = toDateKey(new Date())

  const data = useLiveQuery(async () => {
    if (!validDate || !date) return null
    const [program, exercises, workouts] = await Promise.all([
      programRepo.getActive(date),
      exerciseRepo.getAll(),
      // getAll(), not getCompleted() — see PlanPage.tsx's identical
      // comment: an abandoned day must reach projectSchedule to be
      // carried as attempted rather than discarded as skipped.
      workoutRepo.getAll(),
    ])
    if (!program) return { day: null }
    const days = projectSchedule(program, workouts, new Date())
    return {
      day: days.find((d) => d.date === date) ?? null,
      exerciseById: new Map(exercises.map((e) => [e.id, e])),
      programId: program.id,
      programOrigin: program.origin,
      schedulingMode: program.schedulingMode,
      // Read straight off `program`, same as TodayPage's DoneTodayActivities
      // — ScheduleDay carries no `activation` field, and this deliberately
      // stays out of domain scheduling (see ProjectedDetail's own comment).
      morningActivation: program.morningActivation ?? null,
    }
  }, [date, validDate])

  if (!validDate || !date) return <NotPartOfPhase />
  if (date === todayKey) return <Navigate to="/" replace />
  if (data === undefined) return null
  if (data === null || data.day === null || !data.exerciseById) return <NotPartOfPhase />

  return (
    <div>
      <BackToPlan />
      <h1 className="text-display mt-6 text-4xl text-ink">{formatLongDate(parseDateKey(date), locale)}</h1>
      <DayDetailBody
        day={data.day}
        exerciseById={data.exerciseById}
        date={date}
        programId={data.programId}
        programOrigin={data.programOrigin}
        schedulingMode={data.schedulingMode}
        morningActivation={data.morningActivation}
      />
    </div>
  )
}

function DayDetailBody({
  day,
  exerciseById,
  date,
  programId,
  programOrigin,
  schedulingMode,
  morningActivation,
}: {
  day: ScheduleDay
  exerciseById: Map<string, Exercise>
  date: string
  programId: string
  programOrigin: Program['origin']
  schedulingMode: Program['schedulingMode']
  morningActivation: ActivityTemplate | null
}) {
  const { t } = useTranslation('plan')

  const weekday = isoWeekday(parseDateKey(date))

  if (day.workout && day.workout.completedAt !== null) {
    return (
      <CompletedDetail
        workout={day.workout}
        session={day.session ?? undefined}
        activity={day.activity}
        programId={programId}
        programOrigin={programOrigin}
        weekday={weekday}
        exerciseById={exerciseById}
        date={date}
      />
    )
  }

  // An attempted day (started, sets logged, never finished —
  // `completedAt` stays null; `Workout.abandonedAt`'s doc: "closing is
  // not finishing"). Checked before `day.session` below: `day.session` is
  // non-null here too (the domain fix carries the session actually
  // started), and letting it fall to `ProjectedDetail` would render a
  // *prescription* for a past day — worse than "nothing logged", because
  // it shows a plan where sets already exist.
  if (day.workout && day.workout.completedAt === null) {
    return (
      <AttemptedDetail
        workout={day.workout}
        session={day.session ?? undefined}
        activity={day.activity}
        programId={programId}
        programOrigin={programOrigin}
        weekday={weekday}
        exerciseById={exerciseById}
        date={date}
      />
    )
  }

  {
    /*
      Session before activity, in that order and both present (7 Aug,
      superseding the 6 Aug exclusion below this comment used to state).
      `weekdayActivities` may claim a training weekday
      (docs/design/ActivityPrescriptionPhaseA.md §1: it renders as that
      day's post-strength cardio) and the two are not mutually exclusive.
      The session detail must still win the *primary* position — that
      part of the original ruling stands — but hiding the activity
      entirely reproduced the same bug on the day detail that
      `PlanPage.tsx` (`e793e80`) had already fixed on the Plan list: the
      owner tapped into the day and still couldn't find the ride. The
      current ruling is "the day detail shows both — session first,
      activity secondary." `PlanDayPage.test.tsx`'s regression test was
      rewritten, not deleted, to pin the new order instead of the old
      exclusion.
    */
  }
  if (day.session) {
    return (
      <ProjectedDetail
        session={day.session}
        activity={day.activity}
        activation={morningActivation}
        programId={programId}
        programOrigin={programOrigin}
        weekday={weekday}
        exerciseById={exerciseById}
        date={date}
        schedulingMode={schedulingMode}
      />
    )
  }

  if (day.activity) {
    return (
      <ActivityDetail
        programId={programId}
        programOrigin={programOrigin}
        weekday={weekday}
        activity={day.activity}
      />
    )
  }

  return (
    <p className="mt-6 leading-relaxed text-ink-secondary">
      {t(schedulingMode === 'weekday-pinned' ? 'dayDetail.nothingLoggedPinned' : 'dayDetail.nothingLogged')}
    </p>
  )
}

function CompletedDetail({
  workout,
  session,
  activity,
  programId,
  programOrigin,
  weekday,
  exerciseById,
  date,
}: {
  workout: Workout
  session: SessionTemplate | undefined
  activity: ActivityTemplate | null
  programId: string
  programOrigin: Program['origin']
  weekday: IsoWeekday
  exerciseById: Map<string, Exercise>
  date: string
}) {
  const { t } = useTranslation('plan')
  const formatLoggedSet = useFormatLoggedSet()
  // useSessionName always needs a SessionTemplate; a day.session-less
  // workout is defensive-only (shouldn't happen in practice), so the
  // empty placeholder below is never actually rendered — sessionFallback
  // covers that case instead.
  const resolvedSessionName = useSessionName(programId, session ?? EMPTY_SESSION, programOrigin)
  const sessionName = session ? resolvedSessionName : t('sessionFallback')
  const summary = summarizeWorkout(workout)
  // A fully-skipped exercise (every prescribed level in skippedLevels,
  // zero logged sets, no custom slots) must still appear — coach spec §4:
  // "retain it in the audit history." sets.length alone can be 0 for
  // real, non-empty work.
  const loggedExercises = workout.exercises.filter(
    (e) => e.sets.length > 0 || (e.skippedLevels?.length ?? 0) > 0,
  )
  const setsPhrase = t('dayDetail.sets', { count: summary.totalSets })
  const minutesPhrase =
    summary.durationMinutes !== null
      ? t('dayDetail.inMinutes', { count: summary.durationMinutes })
      : ''

  return (
    <>
      <p className="mt-1 text-ink-secondary">{sessionName}</p>
      <p className="mt-4 text-sm text-ink-tertiary" data-numeric>
        {t('dayDetail.summaryLine', {
          setsPhrase,
          volume: Math.round(summary.volumeKg),
          minutesPhrase,
        })}
      </p>

      <h2 className="eyebrow mt-8">{t('dayDetail.exercisesHeading')}</h2>
      <ul
        aria-label={t('dayDetail.loggedExercisesAriaLabel')}
        className="mt-3 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface"
      >
        {loggedExercises.map((we) => (
          <LoggedExerciseRow
            key={we.exerciseId}
            workoutExercise={we}
            exercise={exerciseById.get(we.exerciseId)}
            date={date}
            formatLoggedSet={formatLoggedSet}
          />
        ))}
      </ul>
      {activity && (
        <ActivitySecondary programId={programId} programOrigin={programOrigin} weekday={weekday} activity={activity} />
      )}
    </>
  )
}

/**
 * A day that was started and never finished. Deliberately not
 * `CompletedDetail` reused wholesale — that component's framing asserts
 * completion — but it shares `LoggedExerciseRow` (the logged sets are the
 * point, and they must be reachable exactly as a completed day's are) and
 * the same set/volume summary line, which never claims a duration:
 * `summarizeWorkout`'s `durationMinutes` is `null` whenever `completedAt`
 * is (workout.ts), so the line reads as "N sets · M kg" with nothing
 * implying how long the session ran. The heading above it is the one
 * thing that must never be ambiguous — neither failure language nor
 * completion language (docs/Design.md:68) — and copy is the owner's call
 * (§7 Q4 of the 11 Aug plan), not this component's.
 */
function AttemptedDetail({
  workout,
  session,
  activity,
  programId,
  programOrigin,
  weekday,
  exerciseById,
  date,
}: {
  workout: Workout
  session: SessionTemplate | undefined
  activity: ActivityTemplate | null
  programId: string
  programOrigin: Program['origin']
  weekday: IsoWeekday
  exerciseById: Map<string, Exercise>
  date: string
}) {
  const { t } = useTranslation('plan')
  const formatLoggedSet = useFormatLoggedSet()
  // Same defensive fallback as CompletedDetail's resolvedSessionName —
  // see that component's comment.
  const resolvedSessionName = useSessionName(programId, session ?? EMPTY_SESSION, programOrigin)
  const sessionName = session ? resolvedSessionName : t('sessionFallback')
  const summary = summarizeWorkout(workout)
  const loggedExercises = workout.exercises.filter(
    (e) => e.sets.length > 0 || (e.skippedLevels?.length ?? 0) > 0,
  )
  const setsPhrase = t('dayDetail.sets', { count: summary.totalSets })

  return (
    <>
      <p className="mt-1 text-sm font-medium text-amber">{t('dayDetail.attemptedHeading')}</p>
      <p className="mt-4 text-ink-secondary">{sessionName}</p>
      <p className="mt-1 text-sm text-ink-tertiary" data-numeric>
        {t('dayDetail.summaryLine', { setsPhrase, volume: Math.round(summary.volumeKg), minutesPhrase: '' })}
      </p>

      <h2 className="eyebrow mt-8">{t('dayDetail.exercisesHeading')}</h2>
      <ul
        aria-label={t('dayDetail.loggedExercisesAriaLabel')}
        className="mt-3 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface"
      >
        {loggedExercises.map((we) => (
          <LoggedExerciseRow
            key={we.exerciseId}
            workoutExercise={we}
            exercise={exerciseById.get(we.exerciseId)}
            date={date}
            formatLoggedSet={formatLoggedSet}
          />
        ))}
      </ul>
      {activity && (
        <ActivitySecondary programId={programId} programOrigin={programOrigin} weekday={weekday} activity={activity} />
      )}
    </>
  )
}

function LoggedExerciseRow({
  workoutExercise,
  exercise,
  date,
  formatLoggedSet,
}: {
  workoutExercise: Workout['exercises'][number]
  exercise: Exercise | undefined
  date: string
  formatLoggedSet: (set: LoggedSet, mode: 'reps' | 'seconds') => string
}) {
  const { t: tPlan } = useTranslation('plan')
  const exerciseName = useExerciseName(exercise?.id ?? '')
  return (
    <li className="px-4 py-3.5">
      {exercise ? (
        // Thumbnail and name share one Link, not two — the owner's "tap
        // either the thumbnail or the name" is satisfied by both sitting
        // inside a single interactive element, which is also what keeps a
        // screen reader from hearing "Goblet squat" as two adjacent links
        // to the same place. The logged-sets line stays outside it
        // (PlanDayPage.test.tsx already pins the link's accessible name to
        // just the exercise name) — history's numbers are data to read,
        // not something this row asks you to act on.
        <Link
          to={`/library/${exercise.id}`}
          state={{ from: 'plan-day', date }}
          className="flex min-h-11 items-center gap-3 transition-colors hover:text-amber focus-inset"
        >
          <ExerciseThumbnail exerciseId={exercise.id} />
          {/*
            `min-w-0 truncate`, not the free-wrap this replaced — measured
            live at 375px/fr: without it, "Extension triceps à la nuque
            avec haltère" wrapped onto two lines and grew the row instead
            of clipping. `min-w-0` is load-bearing on a flex child: without
            it the span's automatic minimum width is its content size,
            which blocks `truncate`'s `overflow-hidden` from ever engaging.
            Same fix as SessionPreview's name column (`d19f38c`), same
            reason — the full name is still real text in the DOM.
          */}
          <span className="min-w-0 flex-1 truncate font-medium text-ink">{exerciseName}</span>
        </Link>
      ) : (
        // No Library entry to link to, but still a designed tile rather
        // than a gap — ExerciseThumbnail resolves an unknown id to the
        // same reserved-tile placeholder, so a mixed list of known and
        // unknown ids still reads as one deliberate layout.
        <div className="flex items-center gap-3">
          <ExerciseThumbnail exerciseId={workoutExercise.exerciseId} />
          <p className="min-w-0 flex-1 truncate font-medium text-ink">{workoutExercise.exerciseId}</p>
        </div>
      )}
      {/* pl-[3.75rem] (60px) lines the numbers up under the name, not the
          thumbnail — thumbnail (3rem/48px) + the row's own gap-3 (12px).
          Absent entirely for a fully-skipped exercise — zero logged sets
          means nothing to join, and an empty line would sit above the
          "levels skipped" line for no reason. */}
      {workoutExercise.sets.length > 0 && (
        <p className="mt-1 pl-[3.75rem] text-sm text-ink-secondary" data-numeric>
          {workoutExercise.sets
            .map((set) => {
              const formatted = formatLoggedSet(set, workoutExercise.prescription.mode)
              // Coach spec §4 — a custom set never reads as a Pyramid level in
              // history either. Marked inline, not a separate line: it's one
              // set among several logged, the same granularity the line
              // already reads at.
              return set.custom ? tPlan('dayDetail.customSuffix', { set: formatted }) : formatted
            })
            .join(' · ')}
        </p>
      )}
      {/*
        A skipped level has no LoggedSet to append to the line above — it's
        never entered `sets` at all (workout.ts's plannedSetIndices/§3.3:
        "skippedLevels is audit and display only"). Its own line, since
        nothing else on this row can carry it.
      */}
      {(workoutExercise.skippedLevels?.length ?? 0) > 0 && (
        <p className="mt-1 pl-[3.75rem] text-sm text-ink-tertiary">
          {tPlan('dayDetail.skippedLevels', { count: workoutExercise.skippedLevels?.length ?? 0 })}
        </p>
      )}
    </li>
  )
}

function ProjectedDetail({
  session,
  activity,
  activation,
  programId,
  programOrigin,
  weekday,
  exerciseById,
  date,
  schedulingMode,
}: {
  session: SessionTemplate
  activity: ActivityTemplate | null
  activation: ActivityTemplate | null
  programId: string
  programOrigin: Program['origin']
  weekday: IsoWeekday
  exerciseById: Map<string, Exercise>
  date: string
  schedulingMode: Program['schedulingMode']
}) {
  const { t } = useTranslation('plan')
  const sessionName = useSessionName(programId, session, programOrigin)
  const warmup = session.warmupId ? warmupById(session.warmupId) : undefined
  return (
    <>
      <p className="mt-1 text-sm font-medium text-amber">{t('dayDetail.projectedLabel')}</p>
      <p className="mt-4 text-sm leading-relaxed text-ink-tertiary">
        {t(schedulingMode === 'weekday-pinned' ? 'projectedNotePinned' : 'projectedNote')}
      </p>
      {activation && (
        <MorningActivationPreview programId={programId} programOrigin={programOrigin} activation={activation} />
      )}
      {/* Activation → Warm-up → Strength, same order and same preview-only,
          no-control treatment as Today's own flow (11 Aug plan §4b). */}
      {warmup && <WarmupSection warmup={warmup} origin={{ from: 'plan-day', date }} />}
      <SessionPreview
        session={session}
        programId={programId}
        programOrigin={programOrigin}
        exerciseById={exerciseById}
        heading={sessionName}
        origin={{ from: 'plan-day', date }}
      />
      {activity && (
        <ActivitySecondary programId={programId} programOrigin={programOrigin} weekday={weekday} activity={activity} />
      )}
    </>
  )
}

/**
 * The one preparation round shown above the session on training days
 * (coach spec §13, `Program.morningActivation`'s own doc). `ScheduleDay`
 * carries no `activation` field (F13 of the M2 revision transcription
 * plan) — read straight off `program` at this UI call site, exactly as
 * `TodayPage.tsx`'s `DoneTodayActivities` already does, whose docblock
 * states this deliberately stays out of domain scheduling.
 *
 * Quieter than `SessionPreview` — the session keeps the primary position
 * (`DayDetailBody`'s 7 Aug comment already established this hierarchy
 * for the activity/session pair; the same ordering applies here: this
 * renders before the session, styled tertiary, matching Today's own
 * order where activation renders above the ride). Preview only — no
 * record control, unlike Today's `ActivationSection`; recording belongs
 * to the day it's actually being done, not a projected future day.
 */
function MorningActivationPreview({
  programId,
  programOrigin,
  activation,
}: {
  programId: string
  programOrigin: Program['origin']
  activation: ActivityTemplate
}) {
  const localized = useLocalizedActivation(programId, activation, programOrigin)
  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-ink-tertiary">{localized.title}</p>
      <ActivityItemList items={localized.items} />
    </div>
  )
}

/**
 * A training day's own activity, rendered secondary to the session that
 * owns the primary position above it (7 Aug — see DayDetailBody's
 * comment). Quieter than `ActivityDetail`'s own full presentation (kind
 * label demoted from amber to tertiary, title without the `text-display`
 * treatment) — this is a supporting fact about the day, not the day's
 * main content, the same distinction `PlanPage.tsx`'s `activitySuffix`
 * already draws at list scale.
 *
 * The leading item's `label` duplicates the title exactly
 * (`useLocalizedActivity`'s own map preserves that), so the title plus
 * that item's `detail` — where the seed carries duration — render
 * together as before, avoiding the repeat. That was true of every
 * seeded training-day activity until the M2 revision, which gives
 * `mesocycle2Build`'s training weekdays a *second* item — a
 * session-specific stretching prescription — that this block silently
 * dropped (device pass D3's single-item assumption stopped holding).
 * Any further items render through the same `ActivityItemList` Today
 * and `ActivityDetail` already use, so the stretch item is visible and,
 * once Phase 3 lands, its `routineId` is tappable.
 */
function ActivitySecondary({
  programId,
  programOrigin,
  weekday,
  activity,
}: {
  programId: string
  programOrigin: Program['origin']
  weekday: IsoWeekday
  activity: ActivityTemplate
}) {
  const kindLabel = useActivityKindLabel(activity.kind)
  const localized = useLocalizedActivity(programId, weekday, activity, programOrigin)
  const detail = localized.items[0]?.detail
  const remainingItems = localized.items.slice(1)
  return (
    <div className="mt-8 border-t border-border pt-6">
      <p className="text-sm font-medium text-ink-tertiary">{kindLabel}</p>
      <p className="mt-1 text-ink-secondary">{localized.title}</p>
      {detail && <p className="mt-0.5 text-sm text-ink-tertiary">{detail}</p>}
      {remainingItems.length > 0 && <ActivityItemList items={remainingItems} />}
    </div>
  )
}

function ActivityDetail({
  programId,
  programOrigin,
  weekday,
  activity,
}: {
  programId: string
  programOrigin: Program['origin']
  weekday: IsoWeekday
  activity: ActivityTemplate
}) {
  const kindLabel = useActivityKindLabel(activity.kind)
  const localized = useLocalizedActivity(programId, weekday, activity, programOrigin)
  return (
    <>
      <p className="mt-1 text-sm font-medium text-amber">{kindLabel}</p>
      <h2 className="text-display mt-1 text-2xl text-ink">{localized.title}</h2>
      <ActivityItemList items={localized.items} />
    </>
  )
}

function NotPartOfPhase() {
  const { t } = useTranslation('plan')
  return (
    <div>
      <BackToPlan />
      <p className="mt-10 text-ink-secondary">{t('dayDetail.notPartOfPhase')}</p>
    </div>
  )
}

function BackToPlan() {
  const { t } = useTranslation('common')
  // Carries the `program` param this page itself arrived with straight
  // through — PlanPage put it there (see PlanPage.tsx's dayHref) so a day
  // opened from Mesocycle 2 returns to Mesocycle 2, not the default phase.
  // Absent (a bare /plan/:date visit) falls back to the bare link, same
  // as before this fix existed.
  const [searchParams] = useSearchParams()
  const programId = searchParams.get('program')
  const to = programId ? `/plan?program=${encodeURIComponent(programId)}` : '/plan'
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
    >
      <span aria-hidden="true">←</span> {t('nav.plan')}
    </Link>
  )
}

function useFormatLoggedSet(): (set: LoggedSet, mode: 'reps' | 'seconds') => string {
  const { t } = useTranslation('plan')
  return (set, mode) => {
    const effort = mode === 'seconds' ? t('dayDetail.secondsEffort', { seconds: set.seconds }) : String(set.reps)
    const weight = set.weightKg !== null ? t('dayDetail.weightSuffix', { weight: set.weightKg }) : ''
    return `${effort}${weight}`
  }
}
