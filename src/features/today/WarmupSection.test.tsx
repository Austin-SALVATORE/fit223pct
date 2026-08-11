import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { warmupById } from '@/data/seed/warmups'
import { WarmupSection } from './WarmupSection'

describe('WarmupSection', () => {
  it('renders the heading, the cycle range, the movement step and both ramp steps with real exercise names', () => {
    const warmup = warmupById('mesocycle2-chest-back-warmup-v1')!
    render(<WarmupSection warmup={warmup} />)

    expect(screen.getByText('Warm-up')).toBeInTheDocument()
    expect(screen.getByText('Easy cycling · 2–3 min')).toBeInTheDocument()
    expect(screen.getByText('Scapular push-up')).toBeInTheDocument()
    expect(screen.getByText('8 reps')).toBeInTheDocument()
    // Incline dumbbell press names both ramp rows — assert the count and
    // let the two distinct numeric lines below do the disambiguating.
    expect(screen.getAllByText('Incline dumbbell press')).toHaveLength(2)
    expect(screen.getByText('5.2 kg per dumbbell × 8')).toBeInTheDocument()
    expect(screen.getByText('8.2 kg per dumbbell × 5')).toBeInTheDocument()
  })

  it('appends the per-side suffix to a per-side ramp step', () => {
    const warmup = warmupById('mesocycle2-legs-core-warmup-v1')!
    render(<WarmupSection warmup={warmup} />)

    // Bulgarian split squat appears twice — the bodyweight rehearsal and
    // the ramp — so assert on the full per-side lines rather than the
    // exercise name alone.
    expect(screen.getByText('5 reps /side')).toBeInTheDocument()
    expect(screen.getByText('5.2 kg per dumbbell × 5 /side')).toBeInTheDocument()
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
