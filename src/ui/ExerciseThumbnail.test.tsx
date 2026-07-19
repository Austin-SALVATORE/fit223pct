import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ExerciseThumbnail } from './ExerciseThumbnail'

describe('ExerciseThumbnail', () => {
  it('renders the asset image for a known id, decorative and lazy', () => {
    render(<ExerciseThumbnail exerciseId="goblet-squat" />)
    const img = screen.getByRole('presentation', { hidden: true })
    expect(img).toHaveAttribute('src', '/assets/exercises/goblet-squat/thumbnail.avif')
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
  })

  it('renders the quiet empty tile for an exercise with no manifest entry', () => {
    const { container } = render(<ExerciseThumbnail exerciseId="not-a-real-exercise" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('falls back to the same empty tile when the image fails to load', () => {
    const { container } = render(<ExerciseThumbnail exerciseId="goblet-squat" />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()

    fireEvent.error(img as HTMLImageElement)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
