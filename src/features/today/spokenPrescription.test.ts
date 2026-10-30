import { afterEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n/i18next'
import type { LadderPrescription, RepRangePrescription, SetTarget } from '@/domain/types'
import { spokenPrescription } from './spokenPrescription'

/**
 * Backlog A14 (batch A1): what a screen reader says for a prescription. The
 * visible line is "60→65→70 kg · 12/10/8" and "4 × 8–12 · 60 kg", which readers
 * voice as "right arrow" and bare digits. These are the sentences that stand for
 * them, written out in full per language so the copy can be reviewed as copy.
 *
 * The two properties that matter, beyond the exact strings:
 *   1. **No glyph survives.** None of → × – · / may appear in the spoken text,
 *      in any language, for any shape. That is the whole defect.
 *   2. **Every shape the visible formatter has is covered**, branch for branch:
 *      a weighted ladder, a bodyweight ladder (no weights at all), a ladder with
 *      one weightless rung, a rep range with and without a start weight, a seconds
 *      range, per-side, a single set, and a range whose ends are equal.
 *
 * Negative controls, run 30 Oct (mutation applied to `spokenPrescription.ts` or
 * `en/today.json`, this file run, restored, `cmp` clean):
 *   the ladder branch returns only `reps`                      -> the four weighted-ladder rows
 *   `sequence` joins with " → " (the glyph back in)            -> 9: the no-glyph property and every ladder row
 *   the min==max branch removed                                -> "a range whose ends are equal"
 *   `perSide` ignored                                          -> the two per-side rows
 *   the null-weight rung printed as a bare "–"                 -> "one weightless rung", and the no-glyph property
 *   `startWeightKg` ignored                                    -> the start-weight row
 *   `reps_one` and `setsOf_one` in en and `setsOf_one` in fr
 *   given the plural wording                                   -> "a single set" and "a final count of one"
 */

const base = { exerciseId: 'goblet-squat', restSeconds: 90, maxWeightKg: null, weightStepKg: null } as const

function ladder(rungs: SetTarget[], extra: Partial<LadderPrescription> = {}): LadderPrescription {
  return { ...base, sets: rungs.length, mode: 'reps', perSide: false, setPlan: rungs, ...extra }
}

function range(
  min: number,
  max: number,
  extra: Partial<RepRangePrescription> = {},
): RepRangePrescription {
  return { ...base, sets: 4, mode: 'reps', perSide: false, range: { min, max }, startWeightKg: null, ...extra }
}

const rung = (weightKg: number | null, reps: number): SetTarget => ({ weightKg, reps })

const GLYPHS = /[→×–·/]/

afterEach(async () => {
  await i18n.changeLanguage('en')
})

async function spoken(locale: 'en' | 'fr' | 'zh-CN', item: LadderPrescription | RepRangePrescription) {
  await i18n.changeLanguage(locale)
  return spokenPrescription(i18n.getFixedT(locale, 'today'), locale, item)
}

describe('spokenPrescription — the sentence each glyph line stands for', () => {
  const cases: [string, LadderPrescription | RepRangePrescription, string, string, string][] = [
    [
      'a weighted ladder (60→65→70 kg · 12/10/8)',
      ladder([rung(60, 12), rung(65, 10), rung(70, 8)]),
      '60, 65, then 70 kg, for 12, 10, then 8 reps',
      '60, 65, puis 70 kg, pour 12, 10, puis 8 répétitions',
      '60、65、70 kg，分别对应12、10、8 次',
    ],
    [
      'a two-rung ladder',
      ladder([rung(20, 12), rung(24, 10)]),
      '20, then 24 kg, for 12, then 10 reps',
      '20, puis 24 kg, pour 12, puis 10 répétitions',
      '20、24 kg，分别对应12、10 次',
    ],
    [
      'fractional barbell loads keep the locale decimal',
      ladder([rung(17.75, 12), rung(21.75, 10)]),
      '17.75, then 21.75 kg, for 12, then 10 reps',
      '17,75, puis 21,75 kg, pour 12, puis 10 répétitions',
      '17.75、21.75 kg，分别对应12、10 次',
    ],
    [
      'a bodyweight ladder has no weights to speak (16/20/24)',
      ladder([rung(null, 16), rung(null, 20), rung(null, 24)]),
      '16, 20, then 24 reps',
      '16, 20, puis 24 répétitions',
      '16、20、24 次',
    ],
    [
      'a ladder with one weightless rung (–→10 kg)',
      ladder([rung(null, 12), rung(10, 10)]),
      'no weight, then 10 kg, for 12, then 10 reps',
      'sans charge, puis 10 kg, pour 12, puis 10 répétitions',
      '无负重、10 kg，分别对应12、10 次',
    ],
    [
      'a seconds-mode ladder (holds)',
      ladder([rung(null, 30), rung(null, 40)], { mode: 'seconds' }),
      '30, then 40 seconds',
      '30, puis 40 secondes',
      '30、40 秒',
    ],
    [
      'per side on a ladder (12/10 /side)',
      ladder([rung(null, 12), rung(null, 10)], { perSide: true }),
      '12, then 10 reps per side',
      '12, puis 10 répétitions par côté',
      '每侧12、10 次',
    ],
    [
      'a rep range with a start weight (4 × 8–12 · 60 kg)',
      range(8, 12, { startWeightKg: 60 }),
      '4 sets of 8 to 12 reps, starting at 60 kg',
      '4 séries de 8 à 12 répétitions, à partir de 60 kg',
      '4 组，每组8到12 次，起始 60 kg',
    ],
    [
      'a rep range with no start weight (3 × 10–15)',
      range(10, 15, { sets: 3 }),
      '3 sets of 10 to 15 reps',
      '3 séries de 10 à 15 répétitions',
      '3 组，每组10到15 次',
    ],
    [
      'a seconds range, per side (3 × 30–45 s /side)',
      range(30, 45, { sets: 3, mode: 'seconds', perSide: true }),
      '3 sets of 30 to 45 seconds per side',
      '3 séries de 30 à 45 secondes par côté',
      '3 组，每组每侧30到45 秒',
    ],
    [
      'a range whose ends are equal reads as one number',
      range(12, 12, { sets: 3 }),
      '3 sets of 12 reps',
      '3 séries de 12 répétitions',
      '3 组，每组12 次',
    ],
    [
      'a single set takes the singular (1 × 8–12)',
      range(8, 12, { sets: 1 }),
      '1 set of 8 to 12 reps',
      '1 série de 8 à 12 répétitions',
      '1 组，每组8到12 次',
    ],
    [
      'a final count of one takes the singular (… then 1 rep)',
      ladder([rung(null, 3), rung(null, 1)]),
      '3, then 1 rep',
      '3, puis 1 répétition',
      '3、1 次',
    ],
  ]

  it.each(cases)('%s', async (_name, item, en, fr, zh) => {
    expect(await spoken('en', item)).toBe(en)
    expect(await spoken('fr', item)).toBe(fr)
    expect(await spoken('zh-CN', item)).toBe(zh)
  })

  it('never lets a glyph through, in any language, for any shape', async () => {
    for (const [name, item] of cases) {
      for (const locale of ['en', 'fr', 'zh-CN'] as const) {
        expect(await spoken(locale, item), `${locale}: ${name}`).not.toMatch(GLYPHS)
      }
    }
  })
})
