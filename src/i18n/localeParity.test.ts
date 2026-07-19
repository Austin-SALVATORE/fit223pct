import { describe, expect, it } from 'vitest'
import { NAMESPACES, SUPPORTED_LOCALES, type SupportedLocale } from './i18next'

const PLURAL_SUFFIX_PATTERN = /^(.*)_(zero|one|two|few|many|other)$/

interface Leaf {
  /** Key path with any trailing CLDR plural suffix stripped, e.g. 'highlight.effortReps' */
  family: string
  /** The plural suffix actually present, or null for a non-plural leaf */
  suffix: string | null
}

/**
 * Every locale must declare the same non-plural keys as English, and for
 * plural-suffixed key families, exactly the CLDR categories that locale's
 * own `Intl.PluralRules` defines — e.g. `zh-CN` legitimately has only
 * `_other` where `en`/`fr` have `_one`/`_other`; that's correct, not drift.
 */
function collectLeaves(value: unknown, prefix = ''): Leaf[] {
  if (typeof value !== 'object' || value === null) {
    const match = PLURAL_SUFFIX_PATTERN.exec(prefix)
    return [match ? { family: match[1], suffix: match[2] } : { family: prefix, suffix: null }]
  }
  return Object.entries(value).flatMap(([childKey, childValue]) =>
    collectLeaves(childValue, prefix ? `${prefix}.${childKey}` : childKey),
  )
}

function families(leaves: readonly Leaf[]): string[] {
  return [...new Set(leaves.map((leaf) => leaf.family))].sort()
}

describe('locale key parity', () => {
  const localeModules = import.meta.glob('../locales/*/*.json', { eager: true })

  function contentFor(locale: SupportedLocale, namespace: string): unknown {
    const mod = localeModules[`../locales/${locale}/${namespace}.json`] as
      | { default: unknown }
      | undefined
    return mod?.default
  }

  for (const namespace of NAMESPACES) {
    describe(`${namespace}.json`, () => {
      it('every locale declares this namespace file', () => {
        for (const locale of SUPPORTED_LOCALES) {
          expect(contentFor(locale, namespace), `src/locales/${locale}/${namespace}.json`).toBeDefined()
        }
      })

      const englishLeaves = collectLeaves(contentFor('en', namespace))
      const englishFamilies = families(englishLeaves)

      for (const locale of SUPPORTED_LOCALES.filter((candidate) => candidate !== 'en')) {
        it(`${locale} has the same key families as en`, () => {
          expect(families(collectLeaves(contentFor(locale, namespace)))).toEqual(englishFamilies)
        })

        it(`${locale} only declares valid CLDR categories, always including 'other'`, () => {
          // Not exact-match: a locale may skip a technically-valid category
          // (e.g. French 'many' only fires for numbers in the millions,
          // never a real set/rep/exercise count) without that being drift.
          // What's never valid: an invalid category for this locale (e.g.
          // 'one' in zh-CN, which has no singular form), or a missing
          // 'other' (i18next's universal plural fallback).
          const byFamily = new Map<string, string[]>()
          for (const leaf of collectLeaves(contentFor(locale, namespace))) {
            if (leaf.suffix === null) continue
            byFamily.set(leaf.family, [...(byFamily.get(leaf.family) ?? []), leaf.suffix])
          }
          const validCategories = new Set<string>(
            new Intl.PluralRules(locale).resolvedOptions().pluralCategories,
          )

          for (const [family, suffixes] of byFamily) {
            expect(suffixes, family).toContain('other')
            for (const suffix of suffixes) {
              expect(validCategories.has(suffix), `${family}_${suffix} invalid for ${locale}`).toBe(true)
            }
          }
        })
      }
    })
  }
})
