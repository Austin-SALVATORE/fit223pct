import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FrameStepper } from './FrameStepper'

/**
 * Active-frame tracking is IntersectionObserver-driven and deliberately
 * live-verified, not asserted here (jsdom has no real IO — see
 * src/test/setup.ts's stub). These tests cover what's safe in jsdom:
 * structure, frame count, sizing, and the translated aria-label.
 */
describe('FrameStepper', () => {
  it('renders one slide per frame with a translated group aria-label', () => {
    render(<FrameStepper exerciseId="goblet-squat" />)
    const group = screen.getByRole('region', { name: 'Step-through photos: Goblet squat' })
    expect(group.querySelectorAll('img')).toHaveLength(6)
  })

  it('reserves each slide’s width from its own frame size, not a shared one', () => {
    render(<FrameStepper exerciseId="goblet-squat" />)
    const images = screen
      .getByRole('region', { name: 'Step-through photos: Goblet squat' })
      .querySelectorAll('img')
    const widths = new Set(
      Array.from(images, (img) => (img.closest('div') as HTMLDivElement).style.width),
    )
    // goblet-squat's frames are not uniform width (see the manifest) —
    // more than one distinct reserved width proves per-frame sizing.
    expect(widths.size).toBeGreaterThan(1)
  })

  it('renders nothing for an exercise with no asset', () => {
    const { container } = render(<FrameStepper exerciseId="not-a-real-exercise" />)
    expect(container).toBeEmptyDOMElement()
  })
})
