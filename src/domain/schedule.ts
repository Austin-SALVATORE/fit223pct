import { addDays, isoWeekday, toDateKey } from '@/lib/dates'
import type { Program, SessionTemplate } from './types'

export type DayPlan =
  | { kind: 'upcoming'; daysUntilStart: number; firstSession: SessionTemplate }
  | { kind: 'training'; session: SessionTemplate }
  | { kind: 'rest'; nextSession: SessionTemplate; nextDate: string }
  | { kind: 'ended' }

/**
 * What does this program ask of the given day?
 *
 * The session identity is driven by how many workouts have been completed,
 * not by the calendar — a missed day never skips a session and never
 * generates guilt. The calendar only decides *whether* today is a
 * scheduled training day.
 */
export function resolveDayPlan(
  program: Program,
  date: Date,
  completedCount: number,
): DayPlan {
  const dateKey = toDateKey(date)

  if (program.endDate !== null && dateKey > program.endDate) {
    return { kind: 'ended' }
  }

  const nextSession = sessionAt(program, completedCount)

  if (dateKey < program.startDate) {
    return {
      kind: 'upcoming',
      daysUntilStart: daysBetween(dateKey, program.startDate),
      firstSession: nextSession,
    }
  }

  if (program.trainingWeekdays.includes(isoWeekday(date))) {
    return { kind: 'training', session: nextSession }
  }

  return {
    kind: 'rest',
    nextSession,
    nextDate: nextTrainingDate(program, date),
  }
}

function sessionAt(program: Program, completedCount: number): SessionTemplate {
  const sessionId = program.rotation[completedCount % program.rotation.length]
  const session = program.sessions.find((s) => s.id === sessionId)
  if (!session) {
    throw new Error(
      `Program "${program.id}" rotation references unknown session "${sessionId}"`,
    )
  }
  return session
}

function nextTrainingDate(program: Program, from: Date): string {
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = addDays(from, offset)
    if (program.trainingWeekdays.includes(isoWeekday(candidate))) {
      return toDateKey(candidate)
    }
  }
  throw new Error(`Program "${program.id}" has no training weekdays`)
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`)
  const to = new Date(`${toKey}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}
