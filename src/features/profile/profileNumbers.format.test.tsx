import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { db } from '@/data/db'
import { checkinRepo, settingsRepo } from '@/data/repositories'
import { seedDatabase } from '@/data/seed'
import i18n from '@/i18n/i18next'
import { BaselineCard } from './BaselineCard'
import { ProfileCard } from './ProfileCard'

/**
 * Three weights on the Settings page write themselves the way the language does (T3,
 * 30 Oct). Each was interpolated as the stored number, so French printed a point:
 *   - the profile card's target, "Cible 78.5 kg";
 *   - the baseline card's current weight when an input is missing,
 *     "84.2 kg au dernier relevé";
 *   - the baseline card's distance to the goal, "5.7 kg de 78.5 kg". There the distance
 *     was also `toFixed(1)`, which forces the point as well as the digit.
 *
 * English and Chinese are pinned and did not change. The distance keeps its one forced
 * decimal in all three ("2.0", "2,0"), as it always did: only the separator moved. Its
 * rounding is still `toFixed(1)`'s ("6.26" is "6.3").
 *
 * Negative controls, run 30 Oct (mutation applied to the component, the whole suite
 * run, restored and `cmp`ed). The rows are split by language, so each control names
 * French alone and English and Chinese stay green:
 *   the target given the raw number                 -> 1 red: fr 78.5 (the whole 78 reads the same)
 *   the current weight given the raw number         -> 1 red: fr 84.2
 *   the distance back to `.toFixed(1)`'s string     -> 4 red: all four French rows
 *   the goal's target given the raw number          -> 2 red: the two French rows whose target
 *                                                       has a decimal (78.5)
 *
 * What it cannot see: the `toFixed(1)` pre-rounding inside the distance helper. Intl alone
 * rounds the same on every value these rows (and the app, to two decimals) produce; it
 * would only differ on a difference that lands exactly on a binary half, which no row here
 * reaches. It is kept so the English text cannot change at all. The height in the profile
 * summary is a whole number of centimetres and is not touched.
 */

const CONFIRMED = {
  heightCm: 178,
  birthDate: '1990-01-01',
  sex: 'male' as const,
  profileConfirmedAt: '2026-07-30',
}

async function logWeight(date: string, weightKg: number) {
  await checkinRepo.put({
    id: `c-${date}`,
    date,
    sleep: null,
    energy: null,
    soreness: null,
    stress: null,
    motivation: null,
    weightKg,
    waistCm: null,
    bodyFatPercent: null,
  })
}

beforeEach(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.settings.clear()
  await db.checkins.clear()
  await i18n.changeLanguage('en')
})

describe('the profile card writes the target weight in the language', () => {
  it.each([
    ['en', 78.5, 'Target 78.5 kg'],
    ['fr', 78.5, 'Cible 78,5 kg'],
    ['zh-CN', 78.5, '目标 78.5 公斤'],
    ['en', 78, 'Target 78 kg'],
    ['fr', 78, 'Cible 78 kg'],
    ['zh-CN', 78, '目标 78 公斤'],
  ])('%s, %s kg', async (locale, target, expected) => {
    await i18n.changeLanguage(locale)
    await settingsRepo.update({ ...CONFIRMED, targetWeightKg: target })
    render(<ProfileCard />)
    expect(await screen.findByText(expected)).toBeInTheDocument()
  })
})

describe('the baseline card writes the current weight in the language when an input is missing', () => {
  it.each([
    ['en', 84.2, '84.2 kg most recently'],
    ['fr', 84.2, '84,2 kg au dernier relevé'],
    ['zh-CN', 84.2, '最近一次 84.2 公斤'],
    ['en', 84, '84 kg most recently'],
    ['fr', 84, '84 kg au dernier relevé'],
    ['zh-CN', 84, '最近一次 84 公斤'],
  ])('%s, %s kg', async (locale, weight, expected) => {
    await i18n.changeLanguage(locale)
    // No sex: the baseline cannot be computed, so the facts that do exist stand alone.
    await settingsRepo.update({ heightCm: 178, birthDate: '1990-01-01', profileConfirmedAt: '2026-07-30' })
    await logWeight('2026-07-01', weight)
    render(<BaselineCard />)
    expect(await screen.findByText(expected)).toBeInTheDocument()
  })
})

// [name, weight, target, [en, fr, zh-CN]]
const DISTANCES: [string, number, number, [string, string, string]][] = [
  ['a decimal target and weight', 84.2, 78.5, ['5.7 kg from 78.5 kg', '5,7 kg de 78,5 kg', '距离 78.5 公斤还有 5.7 公斤']],
  ['a whole distance keeps its one decimal', 80, 78, ['2.0 kg from 78 kg', '2,0 kg de 78 kg', '距离 78 公斤还有 2.0 公斤']],
  ['the rounding is toFixed(1)\u2019s', 84.26, 78, ['6.3 kg from 78 kg', '6,3 kg de 78 kg', '距离 78 公斤还有 6.3 公斤']],
  ['below the target it is still a distance', 77, 78.5, ['1.5 kg from 78.5 kg', '1,5 kg de 78,5 kg', '距离 78.5 公斤还有 1.5 公斤']],
]

describe.each([
  ['en', 0],
  ['fr', 1],
  ['zh-CN', 2],
] as const)('the baseline card writes the distance to the goal in the language — %s', (locale, column) => {
  it.each(DISTANCES)('%s', async (_name, weight, target, lines) => {
    await i18n.changeLanguage(locale)
    await settingsRepo.update({ ...CONFIRMED, targetWeightKg: target })
    await logWeight('2026-07-01', weight)
    render(<BaselineCard />)
    expect(await screen.findByText(lines[column])).toBeInTheDocument()
  })
})
