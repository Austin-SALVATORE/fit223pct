import { afterAll, describe, expect, it } from 'vitest'
import i18n from './i18next'
import { SUPPORTED_LOCALES } from './i18next'
import { validateProgramImport } from '@/domain/programImport'

/**
 * I2, from the user's side. The domain test pins which *key* each malformed
 * file produces; this pins what the user actually reads. It exists because
 * the failure being fixed was invisible to key-level checks — the key was
 * fine, it just interpolated an English `issue.message` into a `{{message}}`
 * passthrough, so every locale rendered English.
 *
 * The path wrapper nests the message key (`$t({{messageKey}})`), which is
 * the one construction that can fail silently and ship `$t(plan:import.…)`
 * to the screen. Rendering it in all three locales is the only way to know.
 */

const libraryIds = new Set(['goblet-squat'])

function malformedProgram(overrides: Record<string, unknown>) {
  return {
    id: 'p',
    name: 'P',
    phase: 1,
    startDate: '2026-08-10',
    endDate: null,
    trainingWeekdays: [1],
    rotation: ['A'],
    sessions: [
      {
        id: 'A',
        name: 'Session A',
        focus: 'Squat',
        items: [
          {
            exerciseId: 'goblet-squat',
            sets: 3,
            mode: 'reps',
            range: { min: 8, max: 12 },
            restSeconds: 120,
            perSide: false,
            startWeightKg: 14,
            maxWeightKg: 20,
            weightStepKg: 2,
          },
        ],
      },
    ],
    ...overrides,
  }
}

function renderError(input: unknown): string {
  const result = validateProgramImport(input, libraryIds)
  if (result.ok) throw new Error('expected this program to be rejected')
  return i18n.t(result.error.key, result.error.params)
}

afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('JSON import errors render as real prose in every locale', () => {
  const cases = [
    { name: 'malformed date', input: malformedProgram({ startDate: '10 Aug 2026' }) },
    {
      name: 'endDate before startDate',
      input: malformedProgram({ startDate: '2026-08-10', endDate: '2026-08-01' }),
    },
    { name: 'wrong field type', input: malformedProgram({ phase: 'two' }) },
    { name: 'empty required string', input: malformedProgram({ name: '' }) },
  ]

  for (const locale of SUPPORTED_LOCALES) {
    for (const { name, input } of cases) {
      it(`${locale}: ${name}`, async () => {
        await i18n.changeLanguage(locale)
        const text = renderError(input)

        // Unresolved nesting or a missing key both surface here.
        expect(text).not.toContain('$t(')
        expect(text).not.toContain('plan:import.')
        expect(text).not.toContain('{{')
        expect(text.trim().length).toBeGreaterThan(0)
      })
    }
  }

  it('renders the path prefix with each locale\'s own punctuation', async () => {
    const input = malformedProgram({ startDate: '10 Aug 2026' })

    await i18n.changeLanguage('en')
    expect(renderError(input)).toMatch(/^startDate: /)

    await i18n.changeLanguage('fr')
    expect(renderError(input)).toMatch(/^startDate : /)

    await i18n.changeLanguage('zh-CN')
    expect(renderError(input)).toMatch(/^startDate：/)
  })

  it('leaves no English in fr or zh-CN — the actual I2 defect', async () => {
    const input = malformedProgram({ startDate: '10 Aug 2026' })

    await i18n.changeLanguage('en')
    expect(renderError(input)).toContain('yyyy-mm-dd')

    await i18n.changeLanguage('fr')
    const fr = renderError(input)
    expect(fr).toContain('aaaa-mm-jj')
    expect(fr).not.toContain('must be a date')

    await i18n.changeLanguage('zh-CN')
    const zh = renderError(input)
    expect(zh).toContain('日期')
    expect(zh).not.toContain('must be a date')
  })
})
