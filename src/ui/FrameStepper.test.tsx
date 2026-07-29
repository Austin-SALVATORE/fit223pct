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

  it('drops the slide background — background-removed art sits directly on the page', () => {
    render(<FrameStepper exerciseId="goblet-squat" />)
    const images = screen
      .getByRole('region', { name: 'Step-through photos: Goblet squat' })
      .querySelectorAll('img')
    for (const img of images) {
      expect(img.parentElement).not.toHaveClass('bg-raised')
    }
  })
})

/**
 * A7 (docs/review-backlog.md): the strip was an `overflow-x-auto` div with
 * no tabIndex and no controls. Safari and Firefox do not focus a bare
 * scroller, so on an iOS-first PWA it was unreachable by keyboard — and the
 * named section exposed nothing to a screen reader either, since the frames
 * are alt="" and the dots aria-hidden.
 */
describe('the photo strip is reachable by keyboard', () => {
  it('makes the scrolling track a focus stop with a name of its own', () => {
    render(<FrameStepper exerciseId="goblet-squat" />)

    const track = screen.getByRole('group', { name: /Photo strip/ })
    expect(track).toHaveAttribute('tabindex', '0')
    expect(track.className).toContain('overflow-x-auto')
  })

  it('keeps the outer region named separately from the track', () => {
    // A12 warns against a region whose name merely duplicates its contents;
    // these two names describe different things — the section says what the
    // strip is, the track says how to move through it.
    render(<FrameStepper exerciseId="goblet-squat" />)

    expect(screen.getByRole('region', { name: 'Step-through photos: Goblet squat' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Photo strip/ })).toBeInTheDocument()
  })
})
