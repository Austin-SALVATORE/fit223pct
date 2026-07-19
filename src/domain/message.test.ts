import { describe, expect, it } from 'vitest'
import en from '@/locales/en/domain.json'

/**
 * Every literal `'domain:...'` key referenced anywhere in domain/ must
 * resolve in en/domain.json — domain must stay locale-blind (it never
 * imports i18next), so this is the only guardrail against a key/JSON typo
 * going unnoticed until someone actually triggers that branch at runtime.
 */
const sourceFiles = import.meta.glob('./*.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function resolvePath(node: unknown, path: readonly string[]): unknown {
  return path.reduce<unknown>(
    (current, segment) =>
      typeof current === 'object' && current !== null
        ? (current as Record<string, unknown>)[segment]
        : undefined,
    node,
  )
}

function collectDomainKeys(): Set<string> {
  const keys = new Set<string>()
  for (const [file, content] of Object.entries(sourceFiles)) {
    if (file.endsWith('.test.ts') || file.endsWith('message.ts')) continue
    for (const match of content.matchAll(/'domain:([a-zA-Z0-9.]+)'/g)) {
      keys.add(match[1])
    }
  }
  return keys
}

describe('domain message keys resolve in en/domain.json', () => {
  const keys = collectDomainKeys()

  it('found domain keys to check (guards against the scan itself silently finding nothing)', () => {
    expect(keys.size).toBeGreaterThan(0)
  })

  for (const key of keys) {
    it(`domain:${key} exists (directly, or as a _other plural variant)`, () => {
      const path = key.split('.')
      const direct = resolvePath(en, path)
      const asPluralOther =
        direct === undefined
          ? resolvePath(en, [...path.slice(0, -1), `${path.at(-1)}_other`])
          : direct
      expect(asPluralOther, `domain:${key}`).toBeDefined()
    })
  }
})
