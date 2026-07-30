import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { checkinRepo, settingsRepo } from '@/data/repositories'
import { PAL_ORDER, type PhysicalActivityLevel } from '@/domain/energyReference'
import { resolveProfile, type Sex } from '@/domain/profile'
import { toDateKey } from '@/lib/dates'
import { CARD_SECTION } from '@/ui/cardSection'
import { Stepper } from '@/ui/Stepper'

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

/**
 * Anchor target for BaselineCard's "Choose your activity level".
 *
 * Carried on all three of this card's states, so the link never points at
 * nothing: which state renders depends on stored data the baseline card
 * cannot see.
 */
export const PROFILE_ANCHOR_ID = 'profile'

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
    /**
     * Starts at whatever is stored, **including null**, and saves as null if
     * still unchosen. No default: attributing an activity level to someone
     * who has not stated one is the defect this field was added to fix.
     */
    activityLevel: PhysicalActivityLevel | null
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
            activityLevel: settings?.activityLevel ?? null,
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
        activityLevel={profile.activityLevel}
        targetWeightKg={profile.targetWeightKg}
        onEdit={() =>
          setDraft({
            heightCm: profile.heightCm ?? DEFAULT_HEIGHT_CM,
            birthDate: settings?.birthDate ?? '',
            sex: profile.sex,
            activityLevel: profile.activityLevel,
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
      // Written through as null when unchosen. A confirmed profile with no
      // band is a normal state: it suppresses the single maintenance range
      // and nothing else.
      activityLevel: draft.activityLevel,
      targetWeightKg: draft.targetWeightKg,
      // The act that makes everything above trusted.
      profileConfirmedAt: toDateKey(new Date()),
    })
    setDraft(null)
  }

  return (
    <section
      id={PROFILE_ANCHOR_ID}
      aria-label={t('sectionLabel')}
      className={CARD_SECTION}
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
          <SexPicker
            value={draft.sex}
            onChange={(sex) => setDraft({ ...draft, sex })}
          />
        </div>
      </div>

      <div className="mt-6">
        <span className="text-sm text-ink-secondary">{t('activityLabel')}</span>
        {/*
          The FAO caveat has to reach the user or they will pick the wrong
          band. PAL is derived from *total* daily expenditure including all
          non-exercise movement, while the fitness convention's "sedentary" is
          defined more narrowly (energyReference.ts). Someone training three
          times a week reads themselves as "active" by gym intuition, where
          FAO puts a modal Western sedentary lifestyle at ~1.60 — a band
          boundary away. So every option is described in terms of the whole
          day, and the copy says outright that training frequency is not what
          this measures.
        */}
        <p className="mt-1 text-xs leading-relaxed text-ink-tertiary">{t('activityWhy')}</p>
        <div className="mt-2">
          <ActivityPicker
            value={draft.activityLevel}
            onChange={(activityLevel) => setDraft({ ...draft, activityLevel })}
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
 * Female / male, as text options sized by their own words.
 *
 * **This replaced `RatingPicker`, which was the wrong primitive rather than a
 * misconfigured one.** RatingPicker is the 1–5 check-in control: `h-11 w-11`
 * circles sized for a single digit. Given words, the circle geometry held and
 * the content overflowed it — "Female" rendered far outside its own 44px
 * button and collided with its neighbour's label. Measured at 390px, the
 * boxes were correct and 6px apart; only the text overlapped, which is what
 * made it look like a spacing bug and is why spacing was never the fix. The
 * three locales make the widths differ again, so any padding tuned to one
 * would be wrong in the other two.
 *
 * Same option-card shape as `ActivityPicker` below — a text choice in the
 * same form that already reads correctly — so the two look like one control
 * family. Full width, so the label length cannot affect the geometry.
 *
 * Semantics kept from RatingPicker deliberately: a labelled `role="group"` of
 * plain toggle buttons with `aria-pressed`, not `role="radio"`, because the
 * ARIA radio pattern promises arrow-key roving-tabindex navigation that this
 * does not implement.
 */
function SexPicker({
  value,
  onChange,
}: {
  value: Sex | null
  onChange: (value: Sex) => void
}) {
  const { t } = useTranslation('profile')
  const options: { sex: Sex; labelKey: string }[] = [
    { sex: 'female', labelKey: 'sexFemale' },
    { sex: 'male', labelKey: 'sexMale' },
  ]
  return (
    <div role="group" aria-label={t('sexLabel')} className="flex gap-2">
      {options.map(({ sex, labelKey }) => {
        const selected = value === sex
        return (
          <button
            key={sex}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(sex)}
            // Selection carries fill and weight as well as hue — the same
            // non-colour cue RatingPicker adopted for backlog A6, so the
            // choice survives greyscale and forced-colours mode.
            className={`flex-1 rounded-card border px-4 py-3 text-center text-sm transition-colors ${
              selected
                ? 'border-amber bg-amber/10 font-semibold text-ink'
                : 'border-border font-medium text-ink-secondary hover:border-border-strong hover:text-ink'
            }`}
          >
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}

/**
 * The three FAO/WHO/UNU bands, each described by what a whole day looks like.
 *
 * Stacked rows rather than `RatingPicker`: these options need a sentence each,
 * which a 44px circle cannot carry, and the description is the part that
 * prevents the wrong choice. Each button's accessible name is the band name
 * *plus* its description, deliberately — a screen-reader user choosing between
 * three bands needs the same information a sighted one is reading.
 *
 * Plain toggle buttons with `aria-pressed`, not `role="radio"`, for
 * `RatingPicker`'s stated reason: the ARIA radio pattern promises arrow-key
 * roving-tabindex navigation that this does not implement, and claiming the
 * role would promise behaviour that is not there.
 *
 * **No option is preselected, marked recommended, or ordered by likelihood.**
 * `PAL_ORDER` is lightest-first because that is a property of the bands, not
 * a hint about the user. Which band a trainee belongs in is a training-content
 * judgement and belongs to the owner's coach.
 */
function ActivityPicker({
  value,
  onChange,
}: {
  value: PhysicalActivityLevel | null
  onChange: (value: PhysicalActivityLevel) => void
}) {
  const { t } = useTranslation('profile')
  return (
    <div role="group" aria-label={t('activityLabel')} className="space-y-2">
      {PAL_ORDER.map((level) => {
        const selected = value === level
        return (
          <button
            key={level}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(level)}
            // Selection carries weight and fill as well as hue, the same
            // non-colour cue RatingPicker adopted for backlog A6: the choice
            // has to survive greyscale and forced-colours mode.
            className={`block w-full rounded-card border px-4 py-3 text-left transition-colors ${
              selected
                ? 'border-amber bg-amber/10 text-ink'
                : 'border-border text-ink-secondary hover:border-border-strong hover:text-ink'
            }`}
          >
            <span className={`block text-sm ${selected ? 'font-semibold' : 'font-medium'}`}>
              {t(`activityName.${level}`)}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-tertiary">
              {t(`activityDescription.${level}`)}
            </span>
          </button>
        )
      })}
    </div>
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
      id={PROFILE_ANCHOR_ID}
      aria-label={t('sectionLabel')}
      className={CARD_SECTION}
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
  activityLevel,
  targetWeightKg,
  onEdit,
}: {
  heightCm: number | null
  age: number | null
  sex: Sex | null
  activityLevel: PhysicalActivityLevel | null
  targetWeightKg: number | null
  onEdit: () => void
}) {
  const { t } = useTranslation('profile')
  const { t: tCommon } = useTranslation('common')
  const facts = [
    heightCm !== null ? t('heightValue', { heightCm }) : null,
    age !== null ? t('ageValue', { count: age }) : null,
    sex !== null ? t(sex === 'male' ? 'sexMale' : 'sexFemale') : null,
    // Absent simply does not appear, like every other fact here — a "not set"
    // placeholder would read as a gap to fill, and an unstated band is a
    // normal state rather than an omission.
    activityLevel !== null ? t(`activityName.${activityLevel}`) : null,
  ].filter((fact): fact is string => fact !== null)

  return (
    <section
      id={PROFILE_ANCHOR_ID}
      aria-label={t('sectionLabel')}
      className={CARD_SECTION}
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
