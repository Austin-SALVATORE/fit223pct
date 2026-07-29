import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RatingPicker } from './RatingPicker'

/**
 * A6 (docs/review-backlog.md): selected and unselected differed only in
 * amber-vs-ink hue at near-identical luminance plus a faint tint, so in
 * greyscale, with colour-vision deficiency, or in forced-colours mode the
 * check-in's own answer was hard or impossible to see. aria-pressed already
 * covered screen readers — this is the visual channel, so the assertion is
 * on the class contract rather than on anything a screen reader would say.
 */
const OPTIONS = [1, 2, 3].map((value) => ({ value, display: String(value) }))

describe('rating picker selection is not conveyed by hue alone', () => {
  it('gives the selected option a solid fill and heavier weight', () => {
    render(<RatingPicker label="Sleep" options={OPTIONS} value={2} onChange={() => {}} />)

    const selected = screen.getByRole('button', { name: 'Sleep: 2' })
    const unselected = screen.getByRole('button', { name: 'Sleep: 1' })

    // Solid fill inverts figure/ground; a translucent tint would not.
    expect(selected.className).toContain('bg-amber')
    expect(selected.className).not.toContain('bg-amber/15')
    expect(unselected.className).not.toContain('bg-amber')

    // Weight is the second, colour-independent channel.
    expect(selected.className).toContain('font-bold')
    expect(unselected.className).toContain('font-medium')
  })

  it('still exposes selection to assistive tech through aria-pressed', () => {
    render(<RatingPicker label="Sleep" options={OPTIONS} value={2} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Sleep: 2' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Sleep: 1' })).toHaveAttribute('aria-pressed', 'false')
  })
})
