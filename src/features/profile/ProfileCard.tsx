import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { checkinRepo, settingsRepo } from '@/data/repositories'
import { resolveProfile, type Sex } from '@/domain/profile'
import { toDateKey } from '@/lib/dates'
import { Stepper } from '@/ui/Stepper'
import { RatingPicker } from '@/ui/RatingPicker'

/**
 * The profile: height, birth date, sex, and optional targets.
 *
 * **Height's first UI ever.** The field has existed in `UserSettings` since
 * M1 and been read by nothing, while the seed wrote 180 for the owner — a
 * number never displayed and never confirmed. This screen is what turns it
 * from an invented value into his own, and until he saves, `resolveProfile`
 * reports it as missing however complete the stored record looks.
 *
 * Saving sets `profileConfirmedAt`. That is the only thing that makes stored
 * settings trusted, so the form deliberately does **not** auto-save per
 * field the way the check-in cards do: a confirmation has to be an act, not
 * a side effect of touching a stepper.
 */

const DEFAULT_HEIGHT_CM = 170
const DEFAULT_TARGET_WEIGHT_KG = 75

export function ProfileCard() {
  const { t } = useTranslation('profile')
  const { t: tCommon } = useTranslation('common')

  const data = useLiveQuery(async () => {
    const [settings, checkins] = await Promise.all([settingsRepo.get(), checkinRepo.getAll()])
    return { settings, profile: resolveProfile(settings ?? {}, checkins) }
  }, [])

  const [draft, setDraft] = useState<{
    heightCm: number
    birthDate: string
    sex: Sex | null
    targetWeightKg: number | null
  } | null>(null)

  if (!data) return null
  const { settings, profile } = data

  const editing = draft !== null
  if (!editing && !profile.confirmed) {
    return (
      <Unconfirmed
        onStart={() =>
          setDraft({
            // The stored height seeds the *form* — offering it back is how he
            // confirms or corrects it — but it stays untrusted until saved.
            heightCm: settings?.heightCm ?? DEFAULT_HEIGHT_CM,
            birthDate: settings?.birthDate ?? '',
            sex: settings?.sex ?? null,
            targetWeightKg: settings?.targetWeightKg ?? null,
          })
        }
      />
    )
  }

  if (!editing) {
    return (
      <Summary
        heightCm={profile.heightCm}
        age={profile.age}
        sex={profile.sex}
        targetWeightKg={profile.targetWeightKg}
        onEdit={() =>
          setDraft({
            heightCm: profile.heightCm ?? DEFAULT_HEIGHT_CM,
            birthDate: settings?.birthDate ?? '',
            sex: profile.sex,
            targetWeightKg: profile.targetWeightKg,
          })
        }
      />
    )
  }

  async function save() {
    if (!draft) return
    await settingsRepo.update({
      heightCm: draft.heightCm,
      birthDate: draft.birthDate === '' ? null : draft.birthDate,
      sex: draft.sex,
      targetWeightKg: draft.targetWeightKg,
      // The act that makes everything above trusted.
      profileConfirmedAt: toDateKey(new Date()),
    })
    setDraft(null)
  }

  return (
    <section
      aria-label={t('sectionLabel')}
      className="mt-8 rounded-card border border-border bg-surface p-5"
    >
      <h2 className="eyebrow">{t('heading')}</h2>

      <div className="mt-5 flex justify-center">
        <Stepper
          label={t('heightLabel')}
          value={draft.heightCm}
          step={1}
          min={120}
          max={230}
          unit="cm"
          onChange={(heightCm) => setDraft({ ...draft, heightCm })}
        />
      </div>

      <label className="mt-6 block">
        <span className="text-sm text-ink-secondary">{t('birthDateLabel')}</span>
        <input
          type="date"
          value={draft.birthDate}
          onChange={(event) => setDraft({ ...draft, birthDate: event.target.value })}
          className="mt-1.5 w-full rounded-card border border-border bg-raised px-4 py-3 text-ink"
        />
        <span className="mt-1 block text-xs text-ink-tertiary">{t('birthDateWhy')}</span>
      </label>

      <div className="mt-6">
        <span className="text-sm text-ink-secondary">{t('sexLabel')}</span>
        {/*
          The copy states plainly that this parameterises the calculation.
          A required field with no stated purpose reads as data collection and
          invites the reasonable question of why a training app wants it; the
          same field explaining itself reads as a tool being honest. It also
          does defensive work — the consequence of relaxing the field sits
          next to the field.
        */}
        <p className="mt-1 text-xs leading-relaxed text-ink-tertiary">{t('sexWhy')}</p>
        <div className="mt-2">
          <RatingPicker
            label={t('sexLabel')}
            options={[
              { value: 0, display: t('sexFemale') },
              { value: 1, display: t('sexMale') },
            ]}
            value={draft.sex === null ? null : draft.sex === 'male' ? 1 : 0}
            onChange={(value) => setDraft({ ...draft, sex: value === 1 ? 'male' : 'female' })}
          />
        </div>
      </div>

      <div className="mt-6">
        <span className="text-sm text-ink-secondary">{t('targetWeightLabel')}</span>
        <p className="mt-1 text-xs leading-relaxed text-ink-tertiary">{t('targetOptional')}</p>
        {draft.targetWeightKg === null ? (
          <button
            type="button"
            onClick={() => setDraft({ ...draft, targetWeightKg: DEFAULT_TARGET_WEIGHT_KG })}
            className="mt-2 w-full rounded-card border border-border py-3 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
          >
            {t('targetWeightAdd')}
          </button>
        ) : (
          <div className="mt-2 flex items-start justify-center gap-4">
            <Stepper
              label={t('targetWeightLabel')}
              value={draft.targetWeightKg}
              step={0.5}
              min={30}
              unit="kg"
              onChange={(targetWeightKg) => setDraft({ ...draft, targetWeightKg })}
            />
            <button
              type="button"
              onClick={() => setDraft({ ...draft, targetWeightKg: null })}
              className="self-center text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
            >
              {t('targetWeightClear')}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => void save()}
        className="mt-8 w-full rounded-card bg-amber py-3.5 text-center text-base font-semibold text-bg"
      >
        {t('save')}
      </button>
      <button
        type="button"
        onClick={() => setDraft(null)}
        className="mt-2 w-full text-center text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        {tCommon('cancel')}
      </button>
    </section>
  )
}

/**
 * Invites completion **once, quietly**. Not a progress bar and not a nag:
 * "profile 60% complete" is the same mechanic as a streak, and this app does
 * not chase people.
 */
function Unconfirmed({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation('profile')
  return (
    <section
      aria-label={t('sectionLabel')}
      className="mt-8 rounded-card border border-border bg-surface p-5"
    >
      <h2 className="eyebrow">{t('heading')}</h2>
      <p className="mt-2 leading-relaxed text-ink-secondary">{t('unconfirmedBody')}</p>
      <button
        type="button"
        onClick={onStart}
        className="mt-4 w-full rounded-card border border-border py-3 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
      >
        {t('unconfirmedAction')}
      </button>
    </section>
  )
}

function Summary({
  heightCm,
  age,
  sex,
  targetWeightKg,
  onEdit,
}: {
  heightCm: number | null
  age: number | null
  sex: Sex | null
  targetWeightKg: number | null
  onEdit: () => void
}) {
  const { t } = useTranslation('profile')
  const { t: tCommon } = useTranslation('common')
  const facts = [
    heightCm !== null ? t('heightValue', { heightCm }) : null,
    age !== null ? t('ageValue', { count: age }) : null,
    sex !== null ? t(sex === 'male' ? 'sexMale' : 'sexFemale') : null,
  ].filter((fact): fact is string => fact !== null)

  return (
    <section
      aria-label={t('sectionLabel')}
      className="mt-8 rounded-card border border-border bg-surface p-5"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="eyebrow">{t('heading')}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          {tCommon('edit')}
        </button>
      </div>
      {/*
        Facts only, and only the ones present — a missing field simply does
        not appear rather than showing a placeholder that reads as a gap to
        fill. No baseline here: that is phase 4.
      */}
      <p className="mt-2 text-ink">{facts.join(' · ')}</p>
      {targetWeightKg !== null && (
        <p className="mt-1 text-sm text-ink-tertiary">{t('targetWeightValue', { targetWeightKg })}</p>
      )}
    </section>
  )
}
