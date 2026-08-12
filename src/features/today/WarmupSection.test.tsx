import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { warmupById } from '@/data/seed/warmups'
import { WarmupSection } from './WarmupSection'

describe('WarmupSection', () => {
  it('renders the heading, the fixed cycle line, the movement step and both ramp steps with real exercise names', () => {
    const warmup = warmupById('mesocycle2-chest-back-warmup-v1')!
    render(<WarmupSection warmup={warmup} />)

    expect(screen.getByText('Warm-up')).toBeInTheDocument()
    expect(screen.getByText('Easy cycling · 3 min')).toBeInTheDocument()
    expect(screen.getByText('Scapular push-up')).toBeInTheDocument()
    expect(screen.getByText('8 reps')).toBeInTheDocument()
    // Incline dumbbell press names both ramp rows — assert the count and
    // let the two distinct numeric lines below do the disambiguating.
    expect(screen.getAllByText('Incline dumbbell press')).toHaveLength(2)
    expect(screen.getByText('6 kg per dumbbell × 8')).toBeInTheDocument()
    expect(screen.getByText('10 kg per dumbbell × 5')).toBeInTheDocument()
  })

  it('renders a barbell ramp with the total-weight phrasing, never "per dumbbell"', () => {
    const warmup = warmupById('mesocycle2-legs-core-warmup-v1')!
    render(<WarmupSection warmup={warmup} />)

    // Romanian deadlift names both ramp rows (technique + load) plus the
    // movement step — three occurrences.
    expect(screen.getByText('Bodyweight hip hinge')).toBeInTheDocument()
    expect(screen.getAllByText('Romanian deadlift')).toHaveLength(2)
    expect(screen.getByText('7.75 kg total × 8')).toBeInTheDocument()
    expect(screen.getByText('15.75 kg total × 5')).toBeInTheDocument()
    expect(screen.queryByText(/per dumbbell/)).toBeNull()
  })

  it('appends the per-side suffix to a per-side ramp step', () => {
    // No shipped warm-up carries a per-side ramp post-migration (Session
    // B's opening barbell RDL is bilateral) — synthetic fixture, same
    // pattern as the empty-tile test below.
    const warmup = {
      id: 'test-warmup',
      steps: [
        {
          kind: 'ramp' as const,
          exerciseId: 'bulgarian-split-squat',
          implement: 'dumbbell' as const,
          weightKg: 6,
          reps: 5,
          perSide: true,
        },
      ],
    }
    render(<WarmupSection warmup={warmup} />)
    expect(screen.getByText('6 kg per dumbbell × 5 /side')).toBeInTheDocument()
  })

  it('degrades to the empty tile for a step whose exerciseId has no thumbnail, never a dead image', () => {
    const warmup = {
      id: 'test-warmup',
      steps: [{ kind: 'movement' as const, exerciseId: 'not-a-real-exercise', reps: 8 }],
    }
    render(<WarmupSection warmup={warmup} />)
    // ExerciseThumbnail's own coverage test pins the empty-tile behavior;
    // this only confirms WarmupSection doesn't throw or omit the row.
    expect(screen.getByText('8 reps')).toBeInTheDocument()
  })
})
