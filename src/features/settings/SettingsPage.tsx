import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { activityRecordRepo, checkinRepo, programRepo, settingsRepo, workoutRepo } from '@/data/repositories'
import { buildFullDataExport, toFullDataExportJson, fullDataExportFilename } from '@/domain/dataExport'
import { shareOrDownloadFile } from '@/lib/shareOrDownloadFile'
import { toDateKey } from '@/lib/dates'
import { originTarget, resolveOrigin } from '@/lib/navigationOrigin'
import { useLocale } from '@/i18n/useLocale'
import { SecondaryButton } from '@/ui/SecondaryButton'
import { LanguageSwitcher } from '@/ui/LanguageSwitcher'
import { CARD_SECTION } from '@/ui/cardSection'
import { ProfileCard } from '@/features/profile/ProfileCard'
import { BaselineCard } from '@/features/profile/BaselineCard'
import { TodayMeasurementCard } from '@/features/checkin/TodayMeasurementCard'
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
  const origin = resolveOrigin(useLocation().state)
  const backTarget = originTarget(origin)

  async function exportAllData() {
    const [programs, workouts, checkins, settings, activityRecords] = await Promise.all([
      programRepo.getAll(),
      workoutRepo.getAll(),
      checkinRepo.getAll(),
      settingsRepo.get(),
      activityRecordRepo.getAll(),
    ])
    const data = buildFullDataExport({
      programs,
      workouts,
      checkins,
      settings,
      activityRecords,
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
        to={backTarget.path}
        className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        <span aria-hidden="true">←</span> {tCommon(backTarget.labelKey)}
      </Link>
      <h1 className="text-display mt-6 text-4xl text-ink">{t('heading')}</h1>

      {/* Profile first: it is the section a new install most needs, and the
          only one whose absence changes what the rest of the app can show. */}
      <ProfileCard />
      {/* Measurements sit between the stated facts and the figure derived from
          them, and before the baseline for the same reason the profile form is:
          a number the user was never given a chance to enter should not appear
          as theirs. Writes today's CheckIn — never a second copy on
          UserSettings, which would drift (docs/UserProfile.md). */}
      <TodayMeasurementCard />
      {/* Renders nothing until the profile is confirmed — a baseline computed
          before the user was asked would show the seeded height as theirs. */}
      <BaselineCard />

      <section className={CARD_SECTION} aria-label={t('language.sectionLabel')}>
        <h2 className="eyebrow">{t('language.heading')}</h2>
        <div className="mt-4">
          <LanguageSwitcher
            value={locale}
            onChange={(next) => void settingsRepo.update({ locale: next })}
            groupLabel={t('language.heading')}
          />
        </div>
      </section>

      <section className={CARD_SECTION} aria-label={t('backup.sectionLabel')}>
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
