import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

/**
 * A ladder prescription's numbers and a long exercise name were competing
 * for the same ~206px of a 375px row (name `min-w-0`, prescription
 * `shrink-0`) — the prescription always won, and the name absorbed 100% of
 * the deficit with nothing to stop it: measured live, "Dumbbell shoulder
 * press" wrapped to 3 lines and visually collided with the numbers.
 *
 * The fix stacks the name and the prescription instead of splitting them
 * across two columns — each gets the row's full width on its own line, so
 * on the seed corpus's actual longest name/prescription pairing
 * ("Dumbbell Romanian deadlift" beside a 3-rung ladder) both render whole.
 * `truncate` on the name is the floor under a name even longer than that,
 * not the primary mechanism — and it never touches the prescription: the
 * numbers are the reason the row exists and must never lose a character.
 */
describe('SessionPreview name/prescription layout', () => {
  // jsdom does not compute real layout (getBoundingClientRect is 0), so this
  // asserts the structural contract that makes the fix work, not pixels —
  // pixels were measured live at 375/390px, en/fr, against the real seed
  // corpus (the actual "Dumbbell Romanian deadlift" / "12→14→15 kg ·
  // 12/10/8" pairing) before this landed.
  function renderLadderRow() {
    const ladder: LadderPrescription = {
      exerciseId: 'goblet-squat',
      sets: 3,
      mode: 'reps',
      restSeconds: 120,
      perSide: false,
      setPlan: [
        { weightKg: 12, reps: 12 },
        { weightKg: 14, reps: 10 },
        { weightKg: 15, reps: 8 },
      ],
      maxWeightKg: 20,
      weightStepKg: 2,
    }
    const ladderSession: SessionTemplate = {
      id: 'A',
      name: 'Session A',
      focus: 'Push',
      items: [ladder],
    }
    return render(
      <MemoryRouter>
        <SessionPreview
          session={ladderSession}
          programId="phase-1-home"
          exerciseById={new Map([['goblet-squat', withAsset]])}
          heading="Today"
        />
      </MemoryRouter>,
    )
  }

  it('stacks the name above the prescription — same parent, not competing flex/grid siblings', async () => {
    renderLadderRow()
    const prescription = await screen.findByText('12→14→15 kg · 12/10/8')
    const row = await screen.findByRole('link')
    const nameEl = within(row).getByText('Goblet squat')
    // Stacked means literally the same parent, not two children of a shared
    // row fighting over width — that fight is what crushed the name before.
    expect(prescription.parentElement).toBe(nameEl.parentElement)
  })

  it('gives the name a `truncate` floor, so a name longer than this corpus has cannot repeat the 3-line wrap', async () => {
    renderLadderRow()
    const row = await screen.findByRole('link')
    const nameEl = within(row).getByText('Goblet squat')
    expect(nameEl.className).toContain('truncate')
    // The full text is still the element's real content — an assistive
    // technology reading this node gets the whole name, not an ellipsis.
    // `truncate` is a CSS-only clip; nothing here ever slices the string.
    expect(nameEl).toHaveTextContent('Goblet squat')
  })

  it('never truncates or shrink-0s the prescription — the numbers are the reason the row exists', async () => {
    renderLadderRow()
    const prescription = await screen.findByText('12→14→15 kg · 12/10/8')
    expect(prescription.className).not.toContain('truncate')
    expect(prescription.className).not.toContain('shrink-0')
    // The full ladder string, uninterrupted — proves it isn't split across
    // sibling elements by a column layout that gave up mid-string.
    expect(prescription.textContent).toBe('12→14→15 kg · 12/10/8')
  })
})
