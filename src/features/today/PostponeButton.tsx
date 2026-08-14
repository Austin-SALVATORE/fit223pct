import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { settingsRepo } from '@/data/repositories'
import { postponeBlockedReason, weekStartKey } from '@/domain/scheduleShift'
import { parseDateKey } from '@/lib/dates'
import type { Program, ScheduleShift } from '@/domain/types'

/**
 * A quiet, present-never-insistent control (postpone-day plan §9,
 * placement precedent: `StartButton variant="quiet"`) — moves today's
 * session to tomorrow, cascading the rest of this ISO week forward
 * (`scheduleShift.ts`'s own doc). No confirmation dialog: postponing
 * destroys nothing (rotation preserves the session identity either way —
 * `docs`'s §1 finding), so the guard lives in the mechanism (one shift
 * per week, an undo visible on the vacated day), not a modal.
 *
 * Only ever rendered from `TrainingDay`, which itself only renders
 * pre-workout (`TodayBody`'s branching) — so "not offered once a workout
 * exists for today" is structural, not a check this component makes.
 */
export function PostponeButton({
  program,
  todayKey,
  existingShift,
}: {
  program: Program
  todayKey: string
  existingShift: ScheduleShift | null
}) {
  const { t } = useTranslation('today')
  const [pending, setPending] = useState(false)
  const blockedReason = postponeBlockedReason(program, todayKey, existingShift)

  // Hidden, not disabled, when the day is structurally not a training
  // day (§8.6) — a disabled control on a rest day would explain nothing.
  // Defensive only: `TrainingDay` never renders this outside a
  // confirmed training day.
  if (blockedReason?.key === 'domain:schedule.postponeBlockedNotTrainingDay') return null

  async function postpone() {
    if (pending || blockedReason !== null) return
    setPending(true)
    try {
      const shift: ScheduleShift = {
        programId: program.id,
        weekStart: weekStartKey(parseDateKey(todayKey)),
        fromDate: todayKey,
        days: 1,
        createdAt: new Date().toISOString(),
      }
      await settingsRepo.setScheduleShift(shift)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending || blockedReason !== null}
        onClick={() => void postpone()}
        className="w-full rounded-card py-3 text-center text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-secondary disabled:opacity-60"
      >
        {t('postpone.action')}
      </button>
      {blockedReason && (
        <p className="mt-1.5 text-center text-xs text-ink-tertiary">
          {t(blockedReason.key, blockedReason.params)}
        </p>
      )}
    </div>
  )
}
