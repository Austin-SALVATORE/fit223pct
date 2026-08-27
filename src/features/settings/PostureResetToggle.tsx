import { useId } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { settingsRepo } from '@/data/repositories'
import { postureResetIsActive } from '@/domain/postureReset'
import { toDateKey } from '@/lib/dates'
import { CARD_SECTION } from '@/ui/cardSection'

/**
 * The Morning Posture Reset activation gate (plan `~/.claude/plans/
 * morning-posture-reset.md` §8 Phase 4, §5). Writes the **one** thing v1
 * ever writes for this module — `UserSettings.morningPostureResetActivatedAt`
 * — a date on, `null` off, same contract as `profileConfirmedAt`
 * (`ProfileCard.tsx`'s own `toDateKey(new Date())` write) and
 * `equipment.confirmedAt`. No Dexie version — `settings: 'id'` only.
 *
 * **Copy is a coach ruling, not a style choice (§5.3).** Product semantics
 * are simply "Enable Morning Posture Reset — OFF / ON"; the app does not
 * adjudicate whether the athlete's symptoms have resolved, so nothing here
 * says why the toggle exists, mentions ribs/thoracic/pain/injury/recovery,
 * or asks a readiness question. The description line is a plain, neutral
 * fact about the *routine* (what it is, roughly how long), never about the
 * athlete's *condition* — the coach's own distinction, restated in his
 * words: "it keeps a temporary rib issue out of the permanent identity of
 * the feature." This docblock is a different surface (developer-facing,
 * not adjudication) and may say what the UI may not.
 *
 * **The name and descriptor are reused from Phase 3's own keys**
 * (`today:morning.name` / `today:morning.descriptor`), not re-authored
 * here — two sources for one name is how they drift.
 */
export function PostureResetToggle() {
  const { t } = useTranslation('settings')
  const { t: tToday } = useTranslation('today')
  const labelId = useId()
  const settings = useLiveQuery(() => settingsRepo.get())
  const active = postureResetIsActive(settings)

  async function toggle() {
    await settingsRepo.update({
      morningPostureResetActivatedAt: active ? null : toDateKey(new Date()),
    })
  }

  return (
    <section className={CARD_SECTION} aria-label={tToday('morning.name')}>
      <h2 className="eyebrow">{tToday('morning.name')}</h2>
      <p className="mt-1 text-sm text-ink-tertiary">{tToday('morning.descriptor')}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{t('postureReset.description')}</p>
      <div className="mt-4 flex items-center justify-between gap-4">
        <span id={labelId} className="text-sm font-medium text-ink">
          {t('postureReset.toggleLabel')}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm text-ink-tertiary" data-numeric>
            {active ? t('postureReset.on') : t('postureReset.off')}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-labelledby={labelId}
            onClick={() => void toggle()}
            className="group relative flex h-11 w-12 shrink-0 items-center justify-center outline-none"
          >
            {/*
              The 48×28 pill is the visual switch; the button itself is
              44px tall so the tap target clears the floor without
              growing the pill (owner-reported defect, 27 Aug — measured
              28px with no guard reaching this file, see
              touchTargets.test.tsx's Settings block).

              The focus ring moved to this pill on purpose, not left on
              the button — `focus-inset` on the (now square, unrounded)
              44×48 button drew a rectangle around the pill with visible
              dark gaps at all four corners, measured and screenshotted
              after the touch-target fix. `group-focus-inset` (index.css)
              draws the same ring on this element instead, gated on the
              *button's* `:focus-visible` via the `group` class above —
              the ring now hugs what the athlete actually sees, not the
              invisible hit box around it.
            */}
            <span
              aria-hidden="true"
              className={`group-focus-inset relative h-7 w-12 rounded-full border transition-colors ${
                active ? 'border-amber bg-amber' : 'border-border bg-raised'
              }`}
            >
              {/*
                `left-0.5` is an explicit anchor, not a default the browser
                is left to resolve — the prior version set no `left`/
                `right`/`inset`, so its horizontal rest position fell back
                to CSS's static-position algorithm, which this codebase
                never authored and which measured ~23px from the left
                (nowhere near centred), sending the ON-state knob 18px
                outside the track (owner-reported: "some bug of display,
                especially when it is on"). `left-0.5` + `translate-x-0`
                (OFF) / `translate-x-[22px]` (ON) keeps the same 3px inset
                on both resting sides — OFF's left inset equals ON's right
                inset, verified against the pill's own box model: track
                48px, 1px border each side, 20px knob, 2px anchor, 22px
                travel → 3px left (OFF) and 3px right (ON), both inside
                the track. Vertical centring uses the `inset-y-0 my-auto`
                auto-margin trick instead of a hand-computed `top` value,
                so it stays centred regardless of the track's border width
                — immune to the same class of error, not just fixed for
                today's numbers.
              */}
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0.5 my-auto h-5 w-5 rounded-full bg-surface shadow transition-transform ${
                  active ? 'translate-x-[22px]' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
