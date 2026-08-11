import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { programRepo, workoutRepo } from '@/data/repositories'
import { projectSchedule, type ScheduleDay } from '@/domain/schedule'
import { summarizeWorkout } from '@/domain/workout'
import { addDays, dateFormattingLocale, isoWeekday, parseDateKey, toDateKey } from '@/lib/dates'
import { useLocale } from '@/i18n/useLocale'
import {
  resolveSessionFocus,
  resolveSessionName,
  useLocalizedActivity,
  useProgramName,
  useSessionName,
} from '@/i18n/seedProgram'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import { SettingsLink } from '@/ui/SettingsLink'
import { ProgramDataActions } from './ProgramDataActions'
import type { ActivityTemplate, Program, SessionTemplate } from '@/domain/types'

// A known Monday — used only to look up each ISO weekday's short name via
// Intl.DateTimeFormat, never as a real date.
const REFERENCE_MONDAY = new Date(2024, 0, 1)

/** Never rendered — see DayRow's resolvedSessionName comment. */
const EMPTY_SESSION: SessionTemplate = { id: '', name: '', focus: '', items: [] }

/** Never rendered — see DayRow's localizedActivity comment. */
const EMPTY_ACTIVITY: ActivityTemplate = { kind: 'recovery', title: '', items: [] }

/** Never rendered — see PhaseNav's previousName/nextName comment. */
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

function weekdayAbbr(weekday: number, locale: string): string {
  return addDays(REFERENCE_MONDAY, weekday - 1).toLocaleDateString(dateFormattingLocale(locale), {
    weekday: 'short',
  })
}

export function PlanPage() {
  const { t } = useTranslation('plan')
  const locale = useLocale()
  const today = new Date()
  const todayKey = toDateKey(today)
  // The viewed phase lives in the URL, not component state — /plan and
  // /plan/:date are sibling routes, so opening a day and pressing back
  // remounts this page. Component state would reset to the default phase
  // on every such round trip (the bug this fixes); a query param survives
  // back, forward, and a hard refresh by construction.
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedProgramId = searchParams.get('program')

  const data = useLiveQuery(async () => {
    const [programs, activeProgram, workouts] = await Promise.all([
      programRepo.getAll(),
      programRepo.getActive(todayKey),
      // getAll(), not getCompleted() — an abandoned day (completedAt still
      // null; see Workout.abandonedAt's doc) must still reach
      // projectSchedule so it can be carried as attempted rather than
      // discarded as skipped. getCompleted()'s filter would exclude it
      // before projectSchedule ever sees it.
      workoutRepo.getAll(),
    ])
    return { programs, activeProgram, workouts }
  }, [todayKey])

  // Root stays a <div> in both states — see LibraryPage for why.
  if (!data) {
    return (
      <div>
        <Heading />
      </div>
    )
  }

  const { programs, activeProgram, workouts } = data

  if (programs.length === 0) {
    return (
      <div>
        <Heading />
        <p className="mt-10 text-ink-secondary">{t('noProgram')}</p>
      </div>
    )
  }

  const defaultProgram = activeProgram ?? programs[0]
  // A stale/unknown id in the URL (a manually-edited link, or a program
  // since removed) falls back the same way an unset param always has —
  // never a crash, never stuck on a phase that no longer exists.
  const program = programs.find((p) => p.id === selectedProgramId) ?? defaultProgram
  const index = programs.findIndex((p) => p.id === program.id)
  const previousProgram = index > 0 ? programs[index - 1] : null
  const nextProgram = index < programs.length - 1 ? programs[index + 1] : null

  function selectProgram(id: string): void {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('program', id)
      return next
    })
  }

  const days = projectSchedule(program, workouts, today)
  const hasProjectedDays = days.some((d) => d.projected)
  const weeks = groupByWeek(days)

  return (
    <div>
      <Heading />
      <PhaseHeader program={program} locale={locale} />

      <PhaseNav
        previous={previousProgram}
        next={nextProgram}
        onSelect={selectProgram}
      />

      <ProgramDataActions program={program} />

      {hasProjectedDays && (
        <p className="mt-6 text-sm leading-relaxed text-ink-tertiary">
          {program.schedulingMode === 'weekday-pinned' ? t('projectedNotePinned') : t('projectedNote')}
        </p>
      )}

      {weeks.map((week) => {
        const weekLabel = t('weekOf', { weekStart: formatShortDate(week.weekStart, locale) })
        return (
          <section key={week.weekStart} className="mt-6" aria-label={weekLabel}>
            <GroupedList label={weekLabel}>
              {week.days.map((day) => (
                <DayRow
                  key={day.date}
                  day={day}
                  locale={locale}
                  programId={program.id}
                  programOrigin={program.origin}
                />
              ))}
            </GroupedList>
          </section>
        )
      })}
    </div>
  )
}

function DayRow({
  day,
  locale,
  programId,
  programOrigin,
}: {
  day: ScheduleDay
  locale: string
  programId: string
  programOrigin: Program['origin']
}) {
  const { t } = useTranslation('plan')
  const { t: tCommon } = useTranslation('common')
  const label = formatDayLabel(day.date, locale)
  // Called unconditionally, before any of the state-specific returns below,
  // so hook order stays stable across day states.
  const resolvedSessionName = useSessionName(programId, day.session ?? EMPTY_SESSION, programOrigin)
  const sessionName = day.session ? resolvedSessionName : t('sessionFallback')
  const localizedActivity = useLocalizedActivity(
    programId,
    isoWeekday(parseDateKey(day.date)),
    day.activity ?? EMPTY_ACTIVITY,
    programOrigin,
  )

  // A training day's own activity (post-strength cardio, display only)
  // is not mutually exclusive with its session (docs/design/
  // ActivityPrescriptionPhaseA.md §1) — the owner found it missing from
  // every session-carrying row on this page (isToday, a completed
  // workout, a projected session) while activity-only days showed it
  // fine. Shown secondarily, in the same quiet treatment an activity-only
  // day already gets below, never replacing the session.
  const activitySuffix = day.session && day.activity ? (
    <span className="block text-ink-tertiary">{localizedActivity.title}</span>
  ) : null

  // Carries the currently-viewed phase through to the day detail so its
  // own back link can return here, not to whatever phase is the default —
  // the fix for the back-navigation bug this component's own PhaseNav can
  // put you into (routed through the URL, not component state).
  const dayHref = `/plan/${day.date}?program=${encodeURIComponent(programId)}`

  if (day.isToday) {
    return (
      <GroupedRow to="/">
        <span className="font-medium text-ink">
          {label} <span className="text-ink-tertiary">· {tCommon('nav.today')}</span>
        </span>
        <span className="shrink-0 text-right text-sm text-ink-secondary">
          {day.session ? resolvedSessionName : (day.activity ? localizedActivity.title : t('restFallback'))}
          {activitySuffix}
        </span>
      </GroupedRow>
    )
  }

  // An attempted day (started, sets logged, never finished —
  // `day.workout.completedAt === null` because `closeStaleWorkouts`
  // never sets it; see `Workout.abandonedAt`'s "closing is not
  // finishing" doc) must not read as a completed one: same real
  // session name and set/volume summary, plus a quiet qualifier that
  // is neither failure nor completion language (docs/Design.md:68).
  if (day.workout && day.workout.completedAt === null) {
    const summary = summarizeWorkout(day.workout)
    return (
      <GroupedRow to={dayHref}>
        <span className="font-medium text-ink">{label}</span>
        <span className="shrink-0 text-right text-sm text-ink-secondary">
          {sessionName}
          <span className="block text-ink-tertiary">
            {t('setsVolume', { count: summary.totalSets, volume: Math.round(summary.volumeKg) })}
          </span>
          <span className="block text-ink-tertiary">{t('attemptedBadge')}</span>
          {activitySuffix}
        </span>
      </GroupedRow>
    )
  }

  if (day.workout) {
    const summary = summarizeWorkout(day.workout)
    return (
      <GroupedRow to={dayHref}>
        <span className="font-medium text-ink">{label}</span>
        <span className="shrink-0 text-right text-sm text-ink-secondary">
          {sessionName}
          <span className="block text-ink-tertiary">
            {t('setsVolume', { count: summary.totalSets, volume: Math.round(summary.volumeKg) })}
          </span>
          {activitySuffix}
        </span>
      </GroupedRow>
    )
  }

  if (day.session) {
    return (
      <GroupedRow to={dayHref}>
        <span className="font-medium text-ink">{label}</span>
        <span className="shrink-0 text-right text-sm text-ink-secondary">
          {resolvedSessionName}
          {day.projected && <span className="text-ink-tertiary"> · {t('projectedBadge')}</span>}
          {activitySuffix}
        </span>
      </GroupedRow>
    )
  }

  // Activity days are visually quieter than strength sessions (no
  // font-medium/text-ink treatment) — and carry no completion state,
  // because there's none to show: activities have no workout to complete.
  if (day.activity) {
    return (
      <GroupedRow to={dayHref}>
        <span className="text-ink-secondary">{label}</span>
        <span className="shrink-0 text-sm text-ink-tertiary">{localizedActivity.title}</span>
      </GroupedRow>
    )
  }

  return (
    <GroupedRow to={dayHref}>
      <span className="text-ink-secondary">{label}</span>
      <span className="shrink-0 text-sm text-ink-tertiary" aria-label={t('noSessionAriaLabel')}>
        —
      </span>
    </GroupedRow>
  )
}

function PhaseHeader({ program, locale }: { program: Program; locale: string }) {
  const { t } = useTranslation('plan')
  const { t: tSeed } = useTranslation('seed')
  const programName = useProgramName(program)

  // Mapped below (rotation, sessions, weekday-pinned lines all use this),
  // so this can't call the useSessionName/useSessionFocus hooks (Rules of
  // Hooks) — hence the non-hook resolver, which carries the same origin
  // guard: an imported program's own session names/foci must never
  // resolve through the seed's locale keys, even reusing the seed's
  // session ids. Inlining that guard here instead is what §4 of
  // docs/review-backlog.md calls the duplication seam.
  function sessionName(session: SessionTemplate): string {
    return resolveSessionName(tSeed, program.id, session, program.origin)
  }

  // `program.rotation` is session IDS (mesocycle2-chest-back, …) — never
  // rendered raw (owner finding, zh-CN, 7 Aug: the ids leaked straight
  // into the rendered sentence). Resolved through `sessionName` with the
  // same defensive fallback to the bare id `weekdaySessionsLine` below
  // uses, for a rotation entry that somehow doesn't resolve, rather than
  // crashing on a malformed program.
  const uniqueRotationIds = [...new Set(program.rotation)]
  const uniqueRotationNames = uniqueRotationIds.map((id) => {
    const session = program.sessions.find((s) => s.id === id)
    return session ? sessionName(session) : id
  })
  // Intl.ListFormat, not a hardcoded ' and ' join — the same latent i18n
  // bug the driver-phrase composition caught in Phase 2, here too: joining
  // words are locale grammar, not punctuation.
  const rotationList = new Intl.ListFormat(locale, {
    style: 'long',
    type: 'conjunction',
  }).format(uniqueRotationNames)

  const sessionsLine = program.sessions
    .map((s) => `${sessionName(s)} — ${resolveSessionFocus(tSeed, program.id, s, program.origin)}`)
    .join(' · ')

  // Pinned mode has no rotation to describe — name each weekday's fixed
  // session instead (Question A consequence #2: "A and B alternate" is
  // simply false once every weekday always offers the same session).
  const weekdaySessionsLine = Object.entries(program.weekdaySessions ?? {})
    .map(([weekday, sessionId]) => [Number(weekday), sessionId] as const)
    .sort(([a], [b]) => a - b)
    .map(([weekday, sessionId]) => {
      const session = program.sessions.find((s) => s.id === sessionId)
      return `${weekdayAbbr(weekday, locale)} ${session ? sessionName(session) : sessionId}`
    })
    .join(' · ')

  return (
    <section className="mt-6">
      <h2 className="eyebrow">{programName}</h2>
      <p className="mt-1 text-sm text-ink-secondary">
        {formatShortDate(program.startDate, locale)}
        {' – '}
        {program.endDate ? formatShortDate(program.endDate, locale) : t('ongoing')}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{sessionsLine}</p>
      {/*
        Rotation mode's own copy dropped the weekday clause (owner/coach
        ruling, 7 Aug): the coach's model is "first completed strength
        day -> Session A", completion order, never calendar day — the
        same reason weekday-pinned mode gets its own sentence just above
        rather than reusing this one (Question A consequence #2). Naming
        specific weekdays in the same breath as "alternate" read as a
        binding rotation mode doesn't make; the true weekday rhythm
        still shows where it's actually authoritative, the calendar
        grid below. `rotationLine`'s own locale-file value (en/fr/zh-CN
        plan.json) carries the wording, JSON can't carry the "why" — it
        lives here instead.
      */}
      <p className="mt-1 text-sm text-ink-tertiary">
        {program.schedulingMode === 'weekday-pinned'
          ? weekdaySessionsLine
          : t('rotationLine', { rotationList })}
      </p>
    </section>
  )
}

function PhaseNav({
  previous,
  next,
  onSelect,
}: {
  previous: Program | null
  next: Program | null
  onSelect: (id: string) => void
}) {
  // Called unconditionally, before the early return below, so hook order
  // stays stable whether or not previous/next resolve.
  const previousName = useProgramName(previous ?? EMPTY_PROGRAM)
  const nextName = useProgramName(next ?? EMPTY_PROGRAM)
  if (!previous && !next) return null
  return (
    <nav className="mt-4 flex items-center justify-between text-sm">
      {previous ? (
        <button
          type="button"
          onClick={() => onSelect(previous.id)}
          className="text-ink-secondary transition-colors hover:text-ink"
        >
          ← {previousName}
        </button>
      ) : (
        <span />
      )}
      {next ? (
        <button
          type="button"
          onClick={() => onSelect(next.id)}
          className="text-ink-secondary transition-colors hover:text-ink"
        >
          {nextName} →
        </button>
      ) : (
        <span />
      )}
    </nav>
  )
}

function Heading() {
  const { t } = useTranslation('common')
  return (
    <header>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        <span aria-hidden="true">←</span> {t('nav.today')}
      </Link>
      <div className="mt-6 flex items-start justify-between gap-4">
        <h1 className="text-display text-4xl text-ink">{t('nav.plan')}</h1>
        <SettingsLink origin="plan" />
      </div>
    </header>
  )
}

function groupByWeek(days: readonly ScheduleDay[]): { weekStart: string; days: ScheduleDay[] }[] {
  const groups = new Map<string, ScheduleDay[]>()
  for (const day of days) {
    const weekStart = mondayOf(day.date)
    const group = groups.get(weekStart)
    if (group) {
      group.push(day)
    } else {
      groups.set(weekStart, [day])
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weekDays]) => ({ weekStart, days: weekDays }))
}

function mondayOf(dateKey: string): string {
  const date = parseDateKey(dateKey)
  return toDateKey(addDays(date, -(isoWeekday(date) - 1)))
}

function formatDayLabel(dateKey: string, locale: string): string {
  return parseDateKey(dateKey).toLocaleDateString(dateFormattingLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatShortDate(dateKey: string, locale: string): string {
  return parseDateKey(dateKey).toLocaleDateString(dateFormattingLocale(locale), {
    day: 'numeric',
    month: 'short',
  })
}
