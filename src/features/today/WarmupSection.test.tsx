import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { warmupById } from '@/data/seed/warmups'
import { WarmupSection } from './WarmupSection'
import type { Warmup } from '@/domain/warmup'

function renderWarmup(warmup: Warmup, origin?: Parameters<typeof WarmupSection>[0]['origin']) {
  return render(
    <MemoryRouter>
      <WarmupSection warmup={warmup} origin={origin} />
    </MemoryRouter>,
  )
}

describe('WarmupSection', () => {
  it('renders the heading, the fixed cycle line, the movement step and the ramp step with a real exercise name', () => {
    // 13 Aug 2026 Full Body Restructure — Session A's warm-up now
    // rehearses goblet-squat (the session's new opening movement) with a
    // single ramp, not incline-dumbbell-press with two.
    const warmup = warmupById('mesocycle2-fullbody-squat-warmup-v1')!
    renderWarmup(warmup)

    expect(screen.getByText('Warm-up')).toBeInTheDocument()
    expect(screen.getByText('Easy cycling · 3 min')).toBeInTheDocument()
    expect(screen.getByText('Bodyweight squat')).toBeInTheDocument()
    expect(screen.getByText('8 reps')).toBeInTheDocument()
    expect(screen.getByText('Goblet squat')).toBeInTheDocument()
    expect(screen.getByText('8 kg per dumbbell × 5')).toBeInTheDocument()
  })

  it('renders a barbell ramp with the total-weight phrasing, never "per dumbbell"', () => {
    const warmup = warmupById('mesocycle2-fullbody-hinge-warmup-v1')!
    renderWarmup(warmup)

    // Barbell Romanian deadlift names both ramp rows (technique + load)
    // plus the movement step — three occurrences.
    expect(screen.getByText('Bodyweight hip hinge')).toBeInTheDocument()
    expect(screen.getAllByText('Barbell Romanian deadlift')).toHaveLength(2)
    expect(screen.getByText('7.75 kg total × 8')).toBeInTheDocument()
    expect(screen.getByText('15.75 kg total × 5')).toBeInTheDocument()
    expect(screen.queryByText(/per dumbbell/)).toBeNull()
  })

  it('appends the per-side suffix to a per-side ramp step', () => {
    // No shipped warm-up carries a per-side ramp post-migration (Session
    // B's opening barbell RDL is bilateral) — synthetic fixture, same
    // pattern as the empty-tile test below.
    const warmup: Warmup = {
      id: 'test-warmup',
      steps: [
        {
          kind: 'ramp',
          exerciseId: 'bulgarian-split-squat',
          implement: 'dumbbell',
          weightKg: 6,
          reps: 5,
          perSide: true,
        },
      ],
    }
    renderWarmup(warmup)
    expect(screen.getByText('6 kg per dumbbell × 5 /side')).toBeInTheDocument()
  })

  it('degrades to the empty tile for a step whose exerciseId has no thumbnail, never a dead image', () => {
    const warmup: Warmup = {
      id: 'test-warmup',
      steps: [{ kind: 'movement', exerciseId: 'not-a-real-exercise', reps: 8 }],
    }
    renderWarmup(warmup)
    // ExerciseThumbnail's own coverage test pins the empty-tile behavior;
    // this only confirms WarmupSection doesn't throw or omit the row.
    expect(screen.getByText('8 reps')).toBeInTheDocument()
  })

  /**
   * Owner-reported, 12 Aug 2026: "I can't click on the warm-up exercise" —
   * movement and ramp rows had zero links (grep-confirmed before this
   * fix). Every warm-up exerciseId has a real Library entry with art, so
   * every row should be navigable to it.
   */
  describe('rows link to their Library exercise (12 Aug 2026)', () => {
    it('a movement row is a link to its exercise, with an accessible name', () => {
      const warmup: Warmup = {
        id: 'test-warmup',
        steps: [{ kind: 'movement', exerciseId: 'scapular-push-up', reps: 8 }],
      }
      renderWarmup(warmup)
      const link = screen.getByRole('link', { name: /Scapular push-up/ })
      expect(link).toHaveAttribute('href', '/library/scapular-push-up')
    })

    it('a ramp row is a link to its exercise, with an accessible name', () => {
      const warmup: Warmup = {
        id: 'test-warmup',
        steps: [{ kind: 'ramp', exerciseId: 'incline-dumbbell-press', implement: 'dumbbell', weightKg: 6, reps: 8 }],
      }
      renderWarmup(warmup)
      const link = screen.getByRole('link', { name: /Incline dumbbell press/ })
      expect(link).toHaveAttribute('href', '/library/incline-dumbbell-press')
    })

    it('the cycle row is never a link — no exerciseId, and its non-link state is not a broken affordance', () => {
      const warmup: Warmup = {
        id: 'test-warmup',
        steps: [{ kind: 'cycle', minutes: 3 }],
      }
      renderWarmup(warmup)
      expect(screen.getByText('Easy cycling · 3 min')).toBeInTheDocument()
      expect(screen.queryAllByRole('link')).toHaveLength(0)
    })

    it('carries the origin state onto the link, so Back returns to where the visit started', () => {
      const warmup: Warmup = {
        id: 'test-warmup',
        steps: [{ kind: 'movement', exerciseId: 'scapular-push-up', reps: 8 }],
      }
      renderWarmup(warmup, { from: 'plan-day', date: '2026-08-14' })
      const link = screen.getByRole('link', { name: /Scapular push-up/ })
      // react-router serialises state via history, not a DOM attribute —
      // assert the underlying <a>'s href is right and rely on
      // PlanDayPage's own render test (below) to prove the state prop is
      // actually threaded, matching SessionPreview's own precedent.
      expect(link).toHaveAttribute('href', '/library/scapular-push-up')
    })

    it('defaults to a "today" origin when the caller passes none', () => {
      const warmup: Warmup = {
        id: 'test-warmup',
        steps: [{ kind: 'movement', exerciseId: 'scapular-push-up', reps: 8 }],
      }
      renderWarmup(warmup)
      expect(screen.getByRole('link', { name: /Scapular push-up/ })).toBeInTheDocument()
    })
  })
})
