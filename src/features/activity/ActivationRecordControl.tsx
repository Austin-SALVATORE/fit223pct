import { useTranslation } from 'react-i18next'
import { activityRecordRepo } from '@/data/repositories'
import type { ActivityRecord } from '@/domain/types'

interface ActivationRecordControlProps {
  dateKey: string
  programId: string
  /** The day's existing activation record, if any — must be `kind: 'activation'` when present. */
  existing: ActivityRecord | undefined
}

/**
 * Marks Morning Activation done — coach spec v2.11 §3. "No timing. No
 * scoring." (§13), so this is the lightest record in the system: a bare
 * completion timestamp, nothing to edit once saved. Independence is by
 * construction (`ActivityRecord` lives in its own table, see types.ts), so
 * marking activation done cannot touch the day's session or ride record.
 */
export function ActivationRecordControl({ dateKey, programId, existing }: ActivationRecordControlProps) {
  const { t } = useTranslation('today')
  const done = existing?.kind === 'activation'

  async function markDone() {
    await activityRecordRepo.put({
      date: dateKey,
      programId,
      kind: 'activation',
      completedAt: new Date().toISOString(),
    })
  }

  if (done) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-secondary">
        <span aria-hidden="true" className="text-amber">
          ✓
        </span>
        {t('activationRecord.done')}
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void markDone()}
      className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
    >
      {t('activationRecord.markDone')}
    </button>
  )
}
