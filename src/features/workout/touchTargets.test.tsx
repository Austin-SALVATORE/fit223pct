import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * The 44px floor across Workout Mode.
 *
 * The design pass found five controls under it — rest `+30s`/`Skip` at 40px,
 * the session-options `⋯` at 40, `HoldTimer` at 36, Technique/Swap at ~20 and
 * Undo at 28 — all inside the two screens being redesigned or their shared
 * shell. jsdom has no layout, so this cannot measure height; the device pass
 * does that. What it catches is the regression, which is how all five arrived.
 *
 * **Asserted as the absence of the undersized patterns, not the presence of a
 * floor somewhere nearby.** The first version searched a window around each
 * control and joined every `className` in it, so a sibling's `min-h-11`
 * satisfied the assertion for a control that had lost its own — it passed
 * with `HoldTimer` reverted to 36px, which is the one thing it exists to
 * catch. The patterns below are exact.
 */

const ROOT = path.resolve(import.meta.dirname, '../../..')

const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8')

/**
 * Class combinations that produce a control under 44px — each the exact shape
 * one of the five had before this pass.
 */
const UNDERSIZED: { pattern: RegExp; was: string }[] = [
  { pattern: /\bh-10 w-10\b/, was: '40px square (session options)' },
  { pattern: /px-5 py-2\.5 text-sm/, was: '40px pill (rest +30s / Skip)' },
  { pattern: /px-4 py-2 text-sm/, was: '36px pill (hold timer)' },
  { pattern: /px-2 py-1 text-sm/, was: '28px (undo)' },
]

const FILES = [
  'src/features/workout/WorkoutPage.tsx',
  'src/features/workout/RestScreen.tsx',
  'src/features/workout/HoldTimer.tsx',
  'src/features/workout/UndoLastSetButton.tsx',
  'src/features/workout/SetScreen.tsx',
]

describe('no control in Workout Mode falls below 44px', () => {
  it.each(FILES)('%s carries none of the undersized patterns', (file) => {
    const source = read(file)
    const found = UNDERSIZED.filter(({ pattern }) => pattern.test(source)).map((u) => u.was)
    expect(found, `${file} still has a control under the 44px floor`).toEqual([])
  })

  it('states a floor on every control that previously lacked one', () => {
    // Positive half: the negative assertions above would also pass if a
    // control were simply deleted, so each is checked to exist with its floor.
    const floors: [string, RegExp][] = [
      ['session options', /-mr-2 flex h-11 w-11 shrink-0/],
      ['rest +30s / Skip', /inline-flex min-h-11 items-center rounded-full border border-border px-5/],
      ['hold timer start', /inline-flex min-h-11 items-center rounded-full border border-border px-4/],
      ['hold timer stop', /inline-flex min-h-11 items-center rounded-full border border-amber/],
      ['undo last set', /inline-flex min-h-11 shrink-0 items-center rounded-full px-2/],
    ]
    const sources = FILES.map(read).join('\n')
    const missing = floors.filter(([, pattern]) => !pattern.test(sources)).map(([label]) => label)
    expect(missing, 'control missing its 44px floor').toEqual([])
  })

  it('gives Technique and Swap a floor each, and room not to collide', () => {
    const source = read('src/features/workout/SetScreen.tsx')
    const floored = [...source.matchAll(/min-h-11 items-center px-3 text-sm text-ink-tertiary/g)]
    expect(floored, 'both Technique and Swap need their own floor').toHaveLength(2)
    // Two 44px targets side by side need *less* gap, not more, or they push
    // each other off a 350px row.
    expect(source).toContain('flex items-center justify-center gap-2')
  })
})
