import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SessionPreview } from './SessionPreview'
import type { Exercise, ExercisePrescription, SessionTemplate } from '@/domain/types'

const withAsset: Exercise = {
  id: 'goblet-squat',
  muscles: ['quads', 'glutes', 'core'],
  equipment: ['dumbbell'],
  substitutionIds: [],
  isUnilateral: false,
}

const withoutAsset: Exercise = {
  id: 'not-a-real-exercise',
  muscles: ['quads'],
  equipment: ['bodyweight'],
  substitutionIds: [],
  isUnilateral: false,
}

function prescription(exerciseId: string): ExercisePrescription {
  return {
    exerciseId,
    sets: 3,
    mode: 'reps',
    range: { min: 8, max: 12 },
    targetRir: 2,
    restSeconds: 90,
    perSide: false,
    startWeightKg: 10,
    maxWeightKg: 20,
    weightStepKg: 2,
  }
}

const session: SessionTemplate = {
  id: 'A',
  name: 'Session A',
  focus: 'Squat & pull',
  items: [prescription('goblet-squat'), prescription('not-a-real-exercise')],
}

function renderPreview() {
  return render(
    <MemoryRouter>
      <SessionPreview
        session={session}
        programId="phase-1-home"
        exerciseById={new Map([
          ['goblet-squat', withAsset],
          ['not-a-real-exercise', withoutAsset],
        ])}
        heading="Today"
      />
    </MemoryRouter>,
  )
}

describe('SessionPreview thumbnails', () => {
  it('renders a thumbnail image for an exercise with an asset', async () => {
    renderPreview()
    const row = await screen.findByRole('link', { name: /Goblet squat/ })
    const img = row.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', '/assets/exercises/goblet-squat/thumbnail.avif')
    expect(img).toHaveAttribute('alt', '')
  })

  it('renders the empty-tile placeholder, not a broken image, for an exercise with no asset', async () => {
    renderPreview()
    const rows = await screen.findAllByRole('link')
    const withoutAssetRow = rows.find((r) => r.getAttribute('href') === '/library/not-a-real-exercise')
    expect(withoutAssetRow).toBeDefined()
    expect(withoutAssetRow?.querySelector('img')).toBeNull()
    expect(withoutAssetRow?.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
