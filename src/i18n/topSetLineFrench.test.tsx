import { afterEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n/i18next'

/**
 * I5 (docs/review-backlog.md §5, "Owner decisions — RULED 27 Jul"):
 * `fr:workout.json`'s `sessionSummary.topSetLine` kept the English word
 * "top" byte-identical across every locale, while zh-CN correctly
 * localized the same concept to `最佳`. The owner ruled the French
 * wording directly — **`meilleure série`** — parallel to zh-CN's `最佳`
 * and consistent with the rest of the French register.
 *
 * Renders end to end as `3 séries · meilleure série 60 kg × 8`
 * (`SessionSummary.tsx`'s `useTopSetLabel`, unaffected here — this is a
 * pure locale-string fix, no code path changes).
 */

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('sessionSummary.topSetLine — French wording (I5, owner-ruled 27 Jul 2026)', () => {
  it('reads "meilleure série", not the English "top"', async () => {
    await i18n.changeLanguage('fr')
    const rendered = i18n.t('workout:sessionSummary.topSetLine', {
      countPhrase: '3 séries',
      detail: '60 kg × 8',
    })
    expect(rendered).toBe('3 séries · meilleure série 60 kg × 8')
    expect(rendered).not.toMatch(/\btop\b/)
  })
})
