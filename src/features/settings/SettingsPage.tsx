import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { checkinRepo, programRepo, settingsRepo, workoutRepo } from '@/data/repositories'
import { buildFullDataExport, toFullDataExportJson, fullDataExportFilename } from '@/domain/dataExport'
import { shareOrDownloadFile } from '@/lib/shareOrDownloadFile'
import { toDateKey } from '@/lib/dates'
import { useLocale } from '@/i18n/useLocale'
import { SecondaryButton } from '@/ui/SecondaryButton'
import { LanguageSwitcher } from '@/ui/LanguageSwitcher'
import type { SupportedLocale } from '@/domain/types'

type ExportState = { status: 'idle' } | { status: 'done'; message: string }

/**
 * The app's first Settings page (see docs/DataPortability.md's revised
 * Surface section) — backup export plus, as of M7, the language switcher.
 */
export function SettingsPage() {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const locale = useLocale() as SupportedLocale
  const [exportState, setExportState] = useState<ExportState>({ status: 'idle' })

  async function exportAllData() {
    const [programs, workouts, checkins, settings] = await Promise.all([
      programRepo.getAll(),
      workoutRepo.getAll(),
      checkinRepo.getAll(),
      settingsRepo.get(),
    ])
    const data = buildFullDataExport({
      programs,
      workouts,
      checkins,
      settings,
      exportedAt: new Date().toISOString(),
    })
    const outcome = await shareOrDownloadFile(
      fullDataExportFilename(toDateKey(new Date())),
      toFullDataExportJson(data),
    )
    if (outcome !== 'cancelled') {
      setExportState({ status: 'done', message: t('backup.saved') })
    }
  }

  return (
    <div>
      <Link
        to="/plan"
        className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        <span aria-hidden="true">←</span> {tCommon('nav.plan')}
      </Link>
      <h1 className="text-display mt-6 text-4xl text-ink">{t('heading')}</h1>

      <section className="mt-8" aria-label={t('language.sectionLabel')}>
        <h2 className="eyebrow">{t('language.heading')}</h2>
        <div className="mt-4">
          <LanguageSwitcher
            value={locale}
            onChange={(next) => void settingsRepo.update({ locale: next })}
            groupLabel={t('language.heading')}
          />
        </div>
      </section>

      <section className="mt-8" aria-label={t('backup.sectionLabel')}>
        <h2 className="eyebrow">{t('backup.heading')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{t('backup.description')}</p>
        <div className="mt-4">
          <SecondaryButton onClick={() => void exportAllData()}>{t('backup.exportButton')}</SecondaryButton>
        </div>
        {exportState.status === 'done' && (
          <p role="status" className="mt-3 text-sm text-ink-secondary">
            {exportState.message}
          </p>
        )}
      </section>
    </div>
  )
}
