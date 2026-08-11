import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'
import enSeed from '@/locales/en/seed.json'
import type { ActivityTemplate } from '@/domain/types'

/**
 * The silent-failure hazard the M2 revision transcription plan names
 * (§3.1): a locale key that still exists wins over the seed's own
 * literal (`seedProgram.ts`'s `i18n.exists(...) ? t(key) : item.label`),
 * in every locale including English. `localeParity.test.ts` cannot see
 * this — it compares key *families* across locales, so a stale key
 * present (and identical) in all three is invisible to it. A stale
 * `weekdayActivities`/`morningActivation` key renders retired copy on
 * the owner's phone with a fully green suite behind it.
 *
 * This guard closes that gap directly: `en/seed.json`'s
 * `program.mesocycle-2-build.activity.<weekday>` and `.morningActivation`
 * must match the seeded `ActivityTemplate` exactly — same title, same
 * item count and order, same label/detail text, no extra keys, none
 * missing. `en` is the only locale this is mechanically checkable in
 * (F10: the seed literal and the en translation are the same string by
 * convention); `fr`/`zh-CN` are then covered transitively by
 * `localeParity` comparing their key families against `en`'s.
 */

interface EnActivityItemJson {
  label: string
  detail?: string
}

interface EnActivityJson {
  title: string
  item: Record<string, EnActivityItemJson>
}

interface EnMesocycle2BuildJson {
  activity: Record<string, EnActivityJson>
  morningActivation?: EnActivityJson
}

const enProgram = (enSeed as { program: Record<string, unknown> }).program[
  'mesocycle-2-build'
] as EnMesocycle2BuildJson

function assertMatchesEn(activity: ActivityTemplate, enActivity: EnActivityJson | undefined, label: string): void {
  expect(enActivity, `${label}: no en/seed.json entry`).toBeDefined()
  if (!enActivity) return
  expect(enActivity.title, `${label}.title`).toBe(activity.title)

  const enIndices = Object.keys(enActivity.item)
    .map(Number)
    .sort((a, b) => a - b)
  const seedIndices = activity.items.map((_, i) => i)
  expect(enIndices, `${label} item index set (extra or missing keys)`).toEqual(seedIndices)

  activity.items.forEach((item, i) => {
    const enItem = enActivity.item[String(i)]
    expect(enItem, `${label}.item.${i}: no en/seed.json entry`).toBeDefined()
    expect(enItem.label, `${label}.item.${i}.label`).toBe(item.label)
    if (item.detail !== undefined) {
      expect(enItem.detail, `${label}.item.${i}.detail`).toBe(item.detail)
    } else {
      expect(enItem.detail, `${label}.item.${i}.detail should not exist (seed item has no detail)`).toBeUndefined()
    }
  })
}

describe('mesocycle2Build — en/seed.json matches the seed exactly (no stale keys, §3/§4 guard)', () => {
  const weekdayEntries = Object.entries(mesocycle2Build.weekdayActivities ?? {})

  it('every weekdayActivities weekday is present in en/seed.json', () => {
    expect(Object.keys(enProgram.activity).map(Number).sort()).toEqual(
      weekdayEntries.map(([weekday]) => Number(weekday)).sort((a, b) => a - b),
    )
  })

  for (const [weekday, activity] of weekdayEntries) {
    it(`weekdayActivities[${weekday}] matches en/seed.json exactly`, () => {
      assertMatchesEn(activity, enProgram.activity[weekday], `weekdayActivities[${weekday}]`)
    })
  }

  it('morningActivation matches en/seed.json exactly', () => {
    expect(mesocycle2Build.morningActivation).toBeDefined()
    if (!mesocycle2Build.morningActivation) return
    assertMatchesEn(mesocycle2Build.morningActivation, enProgram.morningActivation, 'morningActivation')
  })
})
