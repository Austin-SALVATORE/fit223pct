import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { programRepo, workoutRepo } from '@/data/repositories'
import { projectSchedule, type ScheduleDay } from '@/domain/schedule'
import { summarizeWorkout } from '@/domain/workout'
import { addDays, isoWeekday, parseDateKey, toDateKey } from '@/lib/dates'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import { ProgramDataActions } from './ProgramDataActions'
import type { Program } from '@/domain/types'

const WEEKDAY_ABBR: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
}

export function PlanPage() {
  const { t } = useTranslation('plan')
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
      <PhaseHeader program={program} />

      <PhaseNav
        previous={previousProgram}
        next={nextProgram}
        onSelect={setSelectedProgramId}
      />

      <ProgramDataActions program={program} />

      {hasProjectedDays && <p className="mt-6 text-sm leading-relaxed text-ink-tertiary">{t('projectedNote')}</p>}

      {weeks.map((week) => {
        const weekLabel = t('weekOf', { weekStart: week.weekStart })
        return (
          <section key={week.weekStart} className="mt-6" aria-label={weekLabel}>
            <GroupedList label={weekLabel}>
              {week.days.map((day) => (
                <DayRow key={day.date} day={day} />
              ))}
            </GroupedList>
          </section>
        )
      })}
    </div>
  )
}

function DayRow({ day }: { day: ScheduleDay }) {
  const { t } = useTranslation('plan')
  const { t: tCommon } = useTranslation('common')
  const label = formatDayLabel(day.date)

  if (day.isToday) {
    return (
      <GroupedRow to="/">
        <span className="font-medium text-ink">
          {label} <span className="text-ink-tertiary">· {tCommon('nav.today')}</span>
        </span>
        <span className="shrink-0 text-sm text-ink-secondary">
          {day.session ? day.session.name : (day.activity?.title ?? t('restFallback'))}
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
          {day.session?.name ?? t('sessionFallback')}
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
          {day.session.name}
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

function PhaseHeader({ program }: { program: Program }) {
  const { t, i18n } = useTranslation('plan')
  const uniqueRotation = [...new Set(program.rotation)]
  // Intl.ListFormat, not a hardcoded ' and ' join — the same latent i18n
  // bug the driver-phrase composition caught in Phase 2, here too: joining
  // words are locale grammar, not punctuation.
  const rotationList = new Intl.ListFormat(i18n.language, {
    style: 'long',
    type: 'conjunction',
  }).format(uniqueRotation)
  const weekdaysLabel = program.trainingWeekdays
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_ABBR[d])
    .join(' / ')

  return (
    <section className="mt-6">
      <h2 className="eyebrow">{program.name}</h2>
      <p className="mt-1 text-sm text-ink-secondary">
        {formatShortDate(program.startDate)}
        {' – '}
        {program.endDate ? formatShortDate(program.endDate) : t('ongoing')}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
        {program.sessions.map((s) => `${s.name} — ${s.focus}`).join(' · ')}
      </p>
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
  if (!previous && !next) return null
  return (
    <nav className="mt-4 flex items-center justify-between text-sm">
      {previous ? (
        <button
          type="button"
          onClick={() => onSelect(previous.id)}
          className="text-ink-secondary transition-colors hover:text-ink"
        >
          ← {previous.name}
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
          {next.name} →
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
        <Link
          to="/settings"
          aria-label={t('settings')}
          className="-mr-2.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          <GearIcon />
        </Link>
      </div>
    </header>
  )
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
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

function formatDayLabel(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatShortDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
