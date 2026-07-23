import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import manifest from '@/data/generated/asset-manifest.json'
import { SessionPreview } from './SessionPreview'
import type { Exercise, ExercisePrescription, LadderPrescription, SessionTemplate } from '@/domain/types'

const gobletSquatThumbnailHash = (manifest as Record<string, { thumbnailHash?: string }>)['goblet-squat']
  .thumbnailHash

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
    expect(img).toHaveAttribute('src', `/assets/exercises/goblet-squat/thumbnail.avif?v=${gobletSquatThumbnailHash}`)
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

describe('SessionPreview ladder prescriptions', () => {
  it('renders a setPlan item as a climbing-weight, descending-reps line', async () => {
    const ladder: LadderPrescription = {
      exerciseId: 'goblet-squat',
      sets: 3,
      mode: 'reps',
      restSeconds: 120,
      perSide: false,
      setPlan: [
        { weightKg: 8, reps: 12 },
        { weightKg: 10, reps: 10 },
        { weightKg: 12, reps: 8 },
      ],
      maxWeightKg: 14,
      weightStepKg: 2,
    }
    const ladderSession: SessionTemplate = {
      id: 'A',
      name: 'Session A',
      focus: 'Push',
      items: [ladder],
    }
    render(
      <MemoryRouter>
        <SessionPreview
          session={ladderSession}
          programId="phase-1-home"
          exerciseById={new Map([['goblet-squat', withAsset]])}
          heading="Today"
        />
      </MemoryRouter>,
    )
    expect(await screen.findByText('8→10→12 kg · 12/10/8')).toBeInTheDocument()
  })
})
