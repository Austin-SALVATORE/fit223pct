import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFocusOnChange } from '@/lib/useFocusOnChange'
import { ConfirmAction } from '@/ui/ConfirmAction'
import { Sheet } from '@/ui/Sheet'

interface SessionSheetProps {
  open: boolean
  /** Named in the confirm, so the user knows what the reset costs. */
  loggedSetCount: number
  onReset: () => void
  onClose: () => void
}

/**
 * Session-level actions, behind a secondary affordance rather than beside
 * "Log set" — Workout Mode shows one decision at a time, and a destructive
 * control must not sit where a thumb lands repeatedly.
 *
 * Reset ends exactly where the Today page's discard ends: workout deleted,
 * today back to not started. One concept, one behaviour — which is why both
 * use ConfirmAction and why A4 was fixed before this shipped rather than
 * after.
 */
export function SessionSheet({ open, loggedSetCount, onReset, onClose }: SessionSheetProps) {
  const { t } = useTranslation('workout')
  const [confirming, setConfirming] = useState(false)
  // Set by the cancel handler, never derived from `!confirming` — that
  // condition is also true when the sheet opens, which would make this focus
  // move depend on effect declaration order between here and Sheet (see
  // c05aaea, where exactly that dependency broke under extraction).
  const [justCancelled, setJustCancelled] = useState(false)
  const resetRowRef = useFocusOnChange<HTMLButtonElement>(justCancelled)

  useEffect(() => {
    setConfirming(false)
    setJustCancelled(false)
  }, [open])

  return (
    <Sheet
      open={open}
      label={t('sessionSheet.dialogAriaLabel')}
      closeLabel={t('sessionSheet.closeAriaLabel')}
      onClose={onClose}
    >
      {confirming ? (
        <ConfirmAction
          heading={
            loggedSetCount > 0
              ? t('sessionSheet.resetConfirmHeading', { count: loggedSetCount })
              : t('sessionSheet.resetConfirmHeadingEmpty')
          }
          warning={t('sessionSheet.resetConfirmWarning')}
          confirmLabel={t('sessionSheet.resetConfirmAction')}
          cancelLabel={t('sessionSheet.resetConfirmCancel')}
          onConfirm={onReset}
          onCancel={() => {
            setConfirming(false)
            setJustCancelled(true)
          }}
        />
      ) : (
        <>
          <h2 className="eyebrow">{t('sessionSheet.heading')}</h2>
          <button
            ref={resetRowRef}
            type="button"
            onClick={() => {
              // Re-arms the flag so a later cancel is a fresh false→true edge.
              setJustCancelled(false)
              setConfirming(true)
            }}
            className="mt-4 w-full rounded-card border border-border px-4 py-3 text-left transition-colors hover:border-border-strong"
          >
            <span className="block font-medium text-ink">{t('sessionSheet.reset')}</span>
            <span className="mt-0.5 block text-sm text-ink-tertiary">
              {t('sessionSheet.resetDescription')}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-card border border-border py-3 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            {t('sessionSheet.keepGoing')}
          </button>
        </>
      )}
    </Sheet>
  )
}
