import { afterEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n/i18next'
import { spokenSet, type SpokenSetInput } from './spokenSet'

/**
 * Backlog A14's remainder (batch A2): what a screen reader says for one *set*,
 * which every screen prints as a multiplication, "12×14 kg", "14 kg × 12" or
 * "8 kg per dumbbell × 5". Read as printed that is "12 times 14 kilograms": not a
 * product, and not saying which number is the load. The sentence here is the same
 * in every place a set appears, so it is written out in full per language and can
 * be reviewed as copy.
 *
 * Properties, beyond the exact strings:
 *   1. **No glyph survives.** None of → × – · / may appear in the spoken text,
 *      in any language, for any shape. That is the whole defect.
 *   2. **The number is spoken as printed.** French "27,75" stays "27,75"; the
 *      spoken text takes the string the visible text used and only supplies words.
 *   3. **Every branch of `spokenSet` is a row**: weight and effort, reps and
 *      seconds, the singular, a dumbbell, a barbell, effort alone, weight alone,
 *      and neither.
 *
 * Negative controls, run 30 Oct (mutation applied, this file run, restored from a
 * saved copy, `cmp` clean):
 *   `weightedSet` in en reordered to "{{weight}} at {{effort}}"          -> every en weighted row
 *   `weightedSet` in en given "{{effort}}×{{weight}}" (glyph back in)    -> the no-glyph property and every en weighted row
 *   the `dumbbell` branch removed from `spokenSet.ts`                    -> the three dumbbell rows
 *   the `barbell` branch removed from `spokenSet.ts`                     -> the three barbell rows and the French decimal comma
 *   `effortCount` replaced by 2 in the call to `spokenQuantity`          -> the four en and fr singular rows
 *   the effort-only return changed to `''`                               -> "effort alone" in all three languages
 *
 * The plural control is blind in zh-CN, by construction: Chinese has no plural, so
 * `reps_other` is its only form and a wrong count cannot change what it says.
 * The singular rows therefore guard en and fr only, which is all there is to guard.
 */

type Locale = 'en' | 'fr' | 'zh-CN'

const GLYPHS = /[→×–·/]/

afterEach(async () => {
  await i18n.changeLanguage('en')
})

async function say(locale: Locale, set: SpokenSetInput): Promise<string> {
  await i18n.changeLanguage(locale)
  return spokenSet(i18n.getFixedT(locale, 'today'), set)
}

const reps = (weight: string | null, effort: string | null, effortCount: number, weightKind?: 'dumbbell' | 'barbell') =>
  ({ weight, effort, effortCount, mode: 'reps', weightKind }) satisfies SpokenSetInput
const seconds = (weight: string | null, effort: string | null, effortCount: number) =>
  ({ weight, effort, effortCount, mode: 'seconds' }) satisfies SpokenSetInput

const cases: [string, SpokenSetInput, string, string, string][] = [
  ['weight and reps', reps('14', '12', 12), '12 reps at 14 kg', '12 répétitions à 14 kg', '14 kg做12 次'],
  ['weight and seconds', seconds('10', '40', 40), '40 seconds at 10 kg', '40 secondes à 10 kg', '10 kg做40 秒'],
  ['a single rep', reps('14', '1', 1), '1 rep at 14 kg', '1 répétition à 14 kg', '14 kg做1 次'],
  ['a single second', seconds('10', '1', 1), '1 second at 10 kg', '1 seconde à 10 kg', '10 kg做1 秒'],
  [
    'a dumbbell (warm-up ramp)',
    reps('8', '5', 5, 'dumbbell'),
    '5 reps at 8 kg per dumbbell',
    '5 répétitions à 8 kg par haltère',
    '每只哑铃 8 kg做5 次',
  ],
  [
    'a barbell, total load',
    reps('27.75', '5', 5, 'barbell'),
    '5 reps at 27.75 kg total',
    '5 répétitions à 27.75 kg au total',
    '杠铃总重 27.75 kg做5 次',
  ],
  ['effort alone (a bodyweight set)', reps(null, '12', 12), '12 reps', '12 répétitions', '12 次'],
  ['weight alone (a rung with no reps printed)', reps('14', null, 0), '14 kg', '14 kg', '14 kg'],
  ['neither', reps(null, null, 0), '', '', ''],
]

describe('spokenSet — the sentence a multiplication sign stands for', () => {
  it.each(cases)('en: %s', async (_name, set, en) => {
    expect(await say('en', set)).toBe(en)
  })

  it.each(cases)('fr: %s', async (_name, set, _en, fr) => {
    expect(await say('fr', set)).toBe(fr)
  })

  it.each(cases)('zh-CN: %s', async (_name, set, _en, _fr, zh) => {
    expect(await say('zh-CN', set)).toBe(zh)
  })

  it('leaves no glyph in any language, for any shape', async () => {
    for (const locale of ['en', 'fr', 'zh-CN'] as const) {
      for (const [name, set] of cases) {
        expect(await say(locale, set), `${locale}: ${name}`).not.toMatch(GLYPHS)
      }
    }
  })

  it('speaks the number exactly as the visible text printed it (French decimal comma)', async () => {
    expect(await say('fr', reps('27,75', '5', 5, 'barbell'))).toBe('5 répétitions à 27,75 kg au total')
  })

  it('does not say "per dumbbell" for a set that is not a dumbbell set', async () => {
    expect(await say('en', reps('14', '12', 12))).not.toMatch(/dumbbell|total/)
  })
})
