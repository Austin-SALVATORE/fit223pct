import { describe, expect, it } from 'vitest'
import type { SetVariant } from './types'
import enCommon from '@/locales/en/common.json'
import frCommon from '@/locales/fr/common.json'
import zhCommon from '@/locales/zh-CN/common.json'

/**
 * The vocabulary is spec-mandated, not an engineering choice (types.ts's
 * own doc comment on `SetVariant` says so). Mesocycle-2-Home-Progressive-
 * Coach-Spec-v2.7.md §4 "Stored variation vocabulary" names exactly these
 * eight labels and states a prescription must select one per level — it
 * must not store an either/or choice. `harder-leverage-or-pause` was that
 * either/or; the coach resolved it, we didn't invent the narrowing.
 *
 * **Why this file exists, specifically.** `harder-leverage-or-pause`
 * shipped in `536b802` — nine tokens, 27 strings, all three locales in
 * perfect agreement with each other and with the wrong list.
 * `localeParity.test.ts` cannot see this class of defect: it checks that
 * fr/zh-CN agree with en, and they agreed *exactly*, on a value that was
 * itself wrong. Nothing was checking the list against the spec, only the
 * locales against each other. A follow-up experiment reproduced the same
 * blind spot on purpose — adding a ninth token (`extra-pause`) to the type
 * and to all three locale files left `typecheck` clean and the full suite
 * at 979/78 green. This file is the guard that would have caught both.
 */
const SPEC_VOCABULARY = [
  'normal',
  'slow',
  'slow-pause',
  'with-pause',
  'longer-reach',
  'reach-pause',
  'harder-leverage',
  'hands-elevated',
] as const

/**
 * Bidirectional exhaustiveness against the *type*, enforced by the
 * compiler rather than by a runtime loop: `Record<SetVariant, true>`
 * requires every member of `SetVariant` as a key (a missing one is a
 * `tsc` error) and rejects an object literal with an extra key (excess-
 * property checking on a direct literal assignment). So `tsc -b` itself
 * fails the moment `SetVariant` gains or loses a token without this
 * object being updated to match — before any test even runs. What the
 * tests below add is the second half: comparing *this* object, not the
 * type, against the spec's own list, and against what each locale file
 * actually declares.
 */
const ALL_SET_VARIANTS: Record<SetVariant, true> = {
  normal: true,
  slow: true,
  'slow-pause': true,
  'with-pause': true,
  'longer-reach': true,
  'reach-pause': true,
  'harder-leverage': true,
  'hands-elevated': true,
}

describe('SetVariant — the vocabulary is exactly the coach spec\'s eight tokens', () => {
  it('the type (via its compile-time-exhaustive mirror) has exactly these eight tokens, no more, no fewer', () => {
    expect(Object.keys(ALL_SET_VARIANTS).sort()).toEqual([...SPEC_VOCABULARY].sort())
  })

  it('every locale\'s common.json declares exactly these eight setVariant keys', () => {
    expect(Object.keys(enCommon.setVariant).sort(), 'en').toEqual([...SPEC_VOCABULARY].sort())
    expect(Object.keys(frCommon.setVariant).sort(), 'fr').toEqual([...SPEC_VOCABULARY].sort())
    expect(Object.keys(zhCommon.setVariant).sort(), 'zh-CN').toEqual([...SPEC_VOCABULARY].sort())
  })

  it('does not contain the resolved either/or token', () => {
    expect(SPEC_VOCABULARY as readonly string[]).not.toContain('harder-leverage-or-pause')
    expect(Object.keys(enCommon.setVariant)).not.toContain('harder-leverage-or-pause')
  })
})
