import { describe, expect, it } from 'vitest'
import { heard } from './heard'

/**
 * The helper the spoken-text tests stand on (batch A2), so it gets its own check:
 * it must skip `aria-hidden` subtrees, keep everything else (a visually hidden
 * `sr-only` sibling is *read*), and collapse whitespace.
 *
 * Negative control, run 30 Oct (mutation applied to `heard.ts`, this file run,
 * restored, `cmp` clean): the `aria-hidden` early return removed -> "skips an
 * aria-hidden subtree, however deep" and "reads the sr-only sibling and not the
 * glyphs" (both red).
 */

function html(markup: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = markup
  return root
}

describe('heard', () => {
  it('skips an aria-hidden subtree, however deep', () => {
    expect(heard(html('a <span aria-hidden="true">b <b>c</b></span> d'))).toBe('a d')
  })

  it('reads the sr-only sibling and not the glyphs', () => {
    const el = html('<p><span aria-hidden="true">12×14 kg</span><span class="sr-only">12 reps at 14 kg</span></p>')
    expect(heard(el)).toBe('12 reps at 14 kg')
  })

  it('collapses whitespace and trims', () => {
    expect(heard(html('  a \n  b  <i> c </i> '))).toBe('a b c')
  })

  it('does not treat aria-hidden="false" as hidden', () => {
    expect(heard(html('<span aria-hidden="false">kept</span>'))).toBe('kept')
  })
})
