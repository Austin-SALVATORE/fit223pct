import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { programRepo, workoutRepo } from '@/data/repositories'
import { projectSchedule, type ScheduleDay } from '@/domain/schedule'
import { summarizeWorkout } from '@/domain/workout'
import { addDays, dateFormattingLocale, isoWeekday, parseDateKey, toDateKey } from '@/lib/dates'
import { useLocale } from '@/i18n/useLocale'
import { useProgramName, useSessionName } from '@/i18n/seedProgram'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import { SettingsLink } from '@/ui/SettingsLink'
import { ProgramDataActions } from './ProgramDataActions'
import type { Program, SessionTemplate } from '@/domain/types'

// A known Monday — used only to look up each ISO weekday's short name via
// Intl.DateTimeFormat, never as a real date.
const REFERENCE_MONDAY = new Date(2024, 0, 1)

/** Never rendered — see DayRow's resolvedSessionName comment. */
const EMPTY_SESSION: SessionTemplate = { id: '', name: '', focus: '', items: [] }

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
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)

  const data = useLiveQuery(async () => {
    const [programs, activeProgram, workouts] = await Promise.all([
      programRepo.getAll(),
      programRepo.getActive(todayKey),
      workoutRepo.getCompleted(),
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
  const program = programs.find((p) => p.id === selectedProgramId) ?? defaultProgram
  const index = programs.findIndex((p) => p.id === program.id)
  const previousProgram = index > 0 ? programs[index - 1] : null
  const nextProgram = index < programs.length - 1 ? programs[index + 1] : null

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
        onSelect={setSelectedProgramId}
      />

      <ProgramDataActions program={program} />

      {hasProjectedDays && <p className="mt-6 text-sm leading-relaxed text-ink-tertiary">{t('projectedNote')}</p>}

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

  if (day.isToday) {
    return (
      <GroupedRow to="/">
        <span className="font-medium text-ink">
          {label} <span className="text-ink-tertiary">· {tCommon('nav.today')}</span>
        </span>
        <span className="shrink-0 text-sm text-ink-secondary">
          {day.session ? resolvedSessionName : (day.activity?.title ?? t('restFallback'))}
        </span>
      </GroupedRow>
    )
  }

  if (day.workout) {
    const summary = summarizeWorkout(day.workout)
    return (
      <GroupedRow to={`/plan/${day.date}`}>
        <span className="font-medium text-ink">{label}</span>
        <span className="shrink-0 text-right text-sm text-ink-secondary">
          {sessionName}
          <span className="block text-ink-tertiary">
            {t('setsVolume', { count: summary.totalSets, volume: Math.round(summary.volumeKg) })}
          </span>
        </span>
      </GroupedRow>
    )
  }

  if (day.session) {
    return (
      <GroupedRow to={`/plan/${day.date}`}>
        <span className="font-medium text-ink">{label}</span>
        <span className="shrink-0 text-sm text-ink-secondary">
          {resolvedSessionName}
          {day.projected && <span className="text-ink-tertiary"> · {t('projectedBadge')}</span>}
        </span>
      </GroupedRow>
    )
  }

  // Activity days are visually quieter than strength sessions (no
  // font-medium/text-ink treatment) — and carry no completion state,
  // because there's none to show: activities have no workout to complete.
  if (day.activity) {
    return (
      <GroupedRow to={`/plan/${day.date}`}>
        <span className="text-ink-secondary">{label}</span>
        <span className="shrink-0 text-sm text-ink-tertiary">{day.activity.title}</span>
      </GroupedRow>
    )
  }

  return (
    <GroupedRow to={`/plan/${day.date}`}>
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
  const uniqueRotation = [...new Set(program.rotation)]
  // Intl.ListFormat, not a hardcoded ' and ' join — the same latent i18n
  // bug the driver-phrase composition caught in Phase 2, here too: joining
  // words are locale grammar, not punctuation.
  const rotationList = new Intl.ListFormat(locale, {
    style: 'long',
    type: 'conjunction',
  }).format(uniqueRotation)
  // Chinese doesn't use inter-word spacing — 'zh-CN' renders as
  // "周一/周三/周五", not "周一 / 周三 / 周五" (that ASCII spacing reads as
  // visibly foreign, the same class of bug as the joins above).
  const weekdaySeparator = locale.startsWith('zh') ? '/' : ' / '
  const weekdaysLabel = program.trainingWeekdays
    .slice()
    .sort((a, b) => a - b)
    .map((d) => weekdayAbbr(d, locale))
    .join(weekdaySeparator)

  // Mapped, so this can't call the useSessionName/useSessionFocus hooks
  // (Rules of Hooks) — same origin guard as those, inlined: an imported
  // program's own session names/foci must never resolve through the
  // seed's locale keys, even reusing the seed's session ids.
  const imported = program.origin === 'imported'
  const sessionsLine = program.sessions
    .map((s) => {
      const name = imported
        ? s.name
        : tSeed(`program.${program.id}.session.${s.id}.name`, { defaultValue: s.name })
      const focus = imported
        ? s.focus
        : tSeed(`program.${program.id}.session.${s.id}.focus`, { defaultValue: s.focus })
      return `${name} — ${focus}`
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
      <p className="mt-1 text-sm text-ink-tertiary">
        {t('rotationLine', { rotationList, weekdays: weekdaysLabel })}
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
