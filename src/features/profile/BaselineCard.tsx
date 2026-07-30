import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { checkinRepo, settingsRepo } from '@/data/repositories'
import type { PhysicalActivityLevel } from '@/domain/energyReference'
import {
  maintenanceKcal,
  resolveProfile,
  restingEnergyExpenditure,
  restingEnergyExpenditureFromLeanMass,
} from '@/domain/profile'
import { weightGoalProgress, type GoalProgress } from '@/domain/goals'
import { weightTrend } from '@/domain/trends'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'

/**
 * The energy baseline and goal distance — the milestone's visible output.
 *
 * Two things this screen must never do, both of which would be easy and
 * would feel helpful:
 *
 *  - **Show a figure whose provenance is a default.** With any input missing
 *    the baseline is absent and the raw facts stand alone. There is no
 *    partial estimate, and no "approximately" hedging a number assembled
 *    from guesses.
 *  - **Turn a goal into a date.** Progress is a distance and a direction.
 *    `GoalProgress` has no field for a duration and `goals.guard.test.ts`
 *    stops one being added, but the copy has to hold the line too: nothing
 *    here says "on track" or "at this rate", both of which imply an arrival.
 */
const DEFAULT_PAL: PhysicalActivityLevel = 'sedentary'

export function BaselineCard() {
  const { t } = useTranslation('profile')

  const data = useLiveQuery(async () => {
    const [settings, checkins] = await Promise.all([settingsRepo.get(), checkinRepo.getAll()])
    const profile = resolveProfile(settings ?? {}, checkins)
    return { profile, trend: weightTrend(checkins) }
  }, [])

  if (!data) return null
  const { profile, trend } = data
  if (!profile.confirmed) return null

  const ree = restingEnergyExpenditure(profile)
  const leanMassRee = restingEnergyExpenditureFromLeanMass(profile)
  const goal = weightGoalProgress(profile, trend)

  return (
    <section
      aria-label={t('baseline.sectionLabel')}
      className="mt-8 rounded-card border border-border bg-surface p-5"
    >
      <h2 className="eyebrow">{t('baseline.heading')}</h2>

      {ree === null ? (
        <Missing profile={profile} />
      ) : (
        <>
          <p className="mt-2 text-2xl text-ink" data-numeric>
            {t('baseline.restingValue', { kcal: Math.round(ree) })}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
            {t('baseline.restingWhat')}
          </p>

          {/*
            The range is the honest output: the FAO activity bands are ranges,
            so a single maintenance figure would be precision the source does
            not have. Its width is a fair report of how uncertain the activity
            multiplier is — the largest uncertainty in the whole chain.
          */}
          <p className="mt-4 text-ink" data-numeric>
            {t('baseline.maintenanceValue', {
              min: Math.round(maintenanceKcal(ree, DEFAULT_PAL).min),
              max: Math.round(maintenanceKcal(ree, DEFAULT_PAL).max),
            })}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-tertiary">
            {t(`baseline.pal.${DEFAULT_PAL}`)}
          </p>

          {leanMassRee !== null && (
            <p className="mt-3 text-sm leading-relaxed text-ink-tertiary" data-numeric>
              {t('baseline.leanMassValue', { kcal: Math.round(leanMassRee) })}
            </p>
          )}

          {/* Provenance is on screen, not only in a comment — these numbers
              are not equally solid and the UI must not imply they are. */}
          <p className="mt-4 text-xs leading-relaxed text-ink-tertiary">
            {t('baseline.provenance')}
          </p>
        </>
      )}

      {goal && <GoalDistance goal={goal} trend={trend} />}
    </section>
  )
}

/** Names what is missing rather than showing a figure built from defaults. */
function Missing({ profile }: { profile: ReturnType<typeof resolveProfile> }) {
  const { t } = useTranslation('profile')
  const missing = [
    profile.currentWeightKg === null ? t('baseline.missingWeight') : null,
    profile.heightCm === null ? t('baseline.missingHeight') : null,
    profile.age === null ? t('baseline.missingBirthDate') : null,
    profile.sex === null ? t('baseline.missingSex') : null,
  ].filter((item): item is string => item !== null)

  return (
    <>
      <p className="mt-2 leading-relaxed text-ink-secondary">{t('baseline.noFigure')}</p>
      <ul className="mt-2 space-y-1">
        {missing.map((item) => (
          <li key={item} className="text-sm text-ink-tertiary">
            {item}
          </li>
        ))}
      </ul>
      {/* The facts that DO exist still show — missing input means no derived
          figure, not a blank screen. */}
      {profile.currentWeightKg !== null && (
        <p className="mt-3 text-ink" data-numeric>
          {t('baseline.currentWeight', { weightKg: profile.currentWeightKg })}
        </p>
      )}
    </>
  )
}

/**
 * Distance and direction. No duration, no rate, and deliberately no "on
 * track" — that phrase implies an arrival, which is the promise CLAUDE.md
 * forbids, smuggled in as encouragement.
 */
function GoalDistance({ goal, trend }: { goal: GoalProgress; trend: ReturnType<typeof weightTrend> }) {
  const { t } = useTranslation('profile')
  const insufficient = useTranslatedMessage(
    trend.status === 'insufficient-data' ? trend.reason : { key: 'domain:trends.needMoreWeightData' },
  )

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h3 className="eyebrow">{t('goal.heading')}</h3>
      <p className="mt-2 text-ink" data-numeric>
        {t('goal.distance', {
          remaining: Math.abs(goal.remaining).toFixed(1),
          target: goal.target,
        })}
      </p>
      <p className="mt-1 text-sm text-ink-tertiary">
        {goal.direction === null ? insufficient : t(`goal.direction.${goal.direction}`)}
      </p>
    </div>
  )
}
