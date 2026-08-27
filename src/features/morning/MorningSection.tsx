import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { dailyRoutineById } from '@/data/seed/dailyRoutines'
import { MORNING_POSTURE_RESET_ID } from '@/domain/dailyRoutine'
import { CARD_SECTION } from '@/ui/cardSection'
import { DailyRoutineStepRow } from './DailyRoutineStepRow'

/**
 * Morning Posture Reset's display list (plan `~/.claude/plans/
 * morning-posture-reset.md` §3.2/§3.6). Rendered once, above `TodayBody`'s
 * four-way branch, gated on `postureResetIsActive` — the **only** placement
 * structurally immune to the 10 Aug `DoneTodayActivities` branch bug
 * (§3.1/§3.2), and what lets the module survive every mesocycle boundary
 * without touching `schedule.ts` (§1.7): it takes no program argument at
 * all, so `upcoming`, `ended`, `NoProgram` and a postpone-vacated day all
 * show it identically.
 *
 * **Display-only. No controls in v1** — no Mark Complete, no skip, no
 * checkbox (§2.3, §5.3's consolidated ruling: "no daily persistence, no
 * streak, no compliance rate"). The only interactive elements are the
 * per-row Library links, the same navigable idiom `WarmupSection` and
 * `SessionPreview` already use.
 *
 * **Visual treatment — owner-ruled, 12:22 27 Aug (§3.4).** Tertiary-weight
 * heading (`ActivationSection`'s own idiom: compact, does not compete with
 * the training Hero) plus a card boundary (`CARD_SECTION` — the same
 * `rounded-card border border-border` treatment `PostponedDay`'s undo
 * button and every Settings section already wear). No "Training" heading
 * was added anywhere else on Today — that alternative was ruled out.
 */
export function MorningSection() {
  const { t } = useTranslation('today')
  const headingId = useId()
  const routine = dailyRoutineById(MORNING_POSTURE_RESET_ID)
  if (!routine) return null

  return (
    <section aria-labelledby={headingId} className={CARD_SECTION}>
      <p id={headingId} className="text-sm font-medium text-ink-tertiary">
        {t('morning.heading')}
      </p>
      <p className="mt-1 font-medium text-ink">{t('morning.name')}</p>
      <p className="mt-0.5 text-sm text-ink-tertiary">{t('morning.descriptor')}</p>
      <ul className="mt-3 space-y-3">
        {routine.steps.map((step, index) => (
          <li key={index}>
            <DailyRoutineStepRow step={step} />
          </li>
        ))}
      </ul>
    </section>
  )
}
