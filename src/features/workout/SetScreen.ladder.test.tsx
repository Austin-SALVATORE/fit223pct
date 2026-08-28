import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, completeWorkout, logSet } from '@/domain/workout'
import { WorkoutPage } from './WorkoutPage'
import type { LadderPrescription, SessionTemplate } from '@/domain/types'

/**
 * M8 Phase 7 — ladder-aware SetScreen. Neither the seed nor any imported
 * data ships setPlan content yet (Phase 10), so these sessions are
 * hand-built the same way SessionPreview's ladder test is.
 */

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
  id: 'ladder-test',
  name: 'Ladder session',
  focus: 'Squat',
  items: [ladder],
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

function renderWorkout() {
  return render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SetScreen ladder rendering', () => {
  it('shows the ladder position in the header and pre-fills weight/reps from the prescribed rung', async () => {
    const workout = createWorkout({
      id: 'test-ladder-fresh',
      programId: seedProgram.id,
      session: ladderSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(workout)

    renderWorkout()
    // The rung moved from the eyebrow to the target caption (design §1.2):
    // it answers "what was I told to do", which belongs beside the numbers
    // rather than in the set-position line.
    expect(await screen.findByText('Rung 1 of 3 · 8 kg × 12')).toBeInTheDocument()
    expect(screen.getByLabelText('Weight')).toHaveTextContent('8')
    expect(screen.getByLabelText('Reps')).toHaveTextContent('12')
  })

  it('shows the second rung once the first is logged', async () => {
    const workout = createWorkout({
      id: 'test-ladder-fresh',
      programId: seedProgram.id,
      session: ladderSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(
      logSet(workout, 0, { weightKg: 8, reps: 12, seconds: null, completedAt: '2026-07-23T09:05:00.000Z' }, 0),
    )

    renderWorkout()
    expect(await screen.findByText('Rung 2 of 3 · 10 kg × 10')).toBeInTheDocument()
  })

  /**
   * Progression replacement, Phase 3 (28 Aug 2026, `~/.claude/plans/
   * progression-carry-forward.md`) — replaces "pre-fills the next rung
   * stepped up when every rung was completed last time". The old engine
   * added `weightStepKg` on top of a fully-completed ladder; carry-forward
   * does no such arithmetic — it echoes exactly what was logged. Rung 0 is
   * logged 2 kg *heavier* than authored here specifically so the assertion
   * can't pass by coincidence (an exact-match log would look the same
   * whether or not carrying actually happened).
   */
  it('pre-fills the next rung with exactly what was logged last time, not a stepped-up value', async () => {
    // Every prescribed level must be logged (or skipped) for carry-forward
    // to treat this as a *complete* exposure at all — see
    // `carryForward.ts`'s `isCompleteExposure`. Only rung 0 deviates from
    // authored (8 -> 10 kg); rungs 1-2 are logged exactly as authored so
    // the exposure is complete without changing what those two prove.
    const priorCompleted = completeWorkout(
      [0, 1, 2].reduce(
        (w, i) =>
          logSet(
            w,
            0,
            {
              weightKg: i === 0 ? 10 : ladder.setPlan[i].weightKg, // authored rung 0 is 8 kg
              reps: ladder.setPlan[i].reps,
              seconds: null,
              completedAt: '2026-07-20T09:05:00.000Z',
            },
            i,
          ),
        createWorkout({
          id: 'test-ladder-prior',
          programId: seedProgram.id,
          session: ladderSession,
          date: '2026-07-20',
          startedAt: '2026-07-20T09:00:00.000Z',
        }),
      ),
      '2026-07-20T09:40:00.000Z',
    )
    await db.workouts.put(priorCompleted)

    const active = createWorkout({
      id: 'test-ladder-active',
      programId: seedProgram.id,
      session: ladderSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(active)

    renderWorkout()
    // Echoes the logged 10 kg, not the authored 8 and not an engine-stepped
    // 10 (which would coincide here — the point is this number comes from
    // the log, not arithmetic; the seconds-mode and technique-gate tests
    // elsewhere prove the "not arithmetic" half where the two would diverge).
    expect(await screen.findByText('Rung 1 of 3 · 10 kg × 12')).toBeInTheDocument()
    expect(screen.getByLabelText('Weight')).toHaveTextContent('10')
  })

  /**
   * QA-found (12 Aug 2026): `TargetCaption` used to build "– kg × N" for a
   * null-weight ladder — a false weight claim, same defect class as the
   * already-fixed `SessionPreview` formatter. Re-grounded for Phase 3: no
   * longer needs prior history or a MAX/TECHNIQUE pill to exercise (both
   * retired with `progression.ts`) — the caption-format defect was always
   * about a fresh render, not about which classification fired.
   */
  it('renders a null-weight (bodyweight) ladder rung without a false "kg" claim or a dash', async () => {
    // 'push-up' isn't in the Library yet (Mesocycle 2's Build program,
    // not this batch) — goblet-squat's own id is reused here purely as a
    // resolvable Library entry; the prescription's null weights are what
    // simulates bodyweight work, not the exercise identity itself.
    const bodyweightLadder: LadderPrescription = {
      exerciseId: 'goblet-squat',
      sets: 2,
      mode: 'reps',
      restSeconds: 90,
      perSide: false,
      setPlan: [
        { weightKg: null, reps: 12 },
        { weightKg: null, reps: 10 },
      ],
      maxWeightKg: null,
      weightStepKg: null,
    }
    const bodyweightSession: SessionTemplate = {
      id: 'bodyweight-test',
      name: 'Bodyweight session',
      focus: 'Push',
      items: [bodyweightLadder],
    }

    const active = createWorkout({
      id: 'test-bodyweight-active',
      programId: seedProgram.id,
      session: bodyweightSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(active)

    renderWorkout()
    await screen.findByLabelText('Reps')
    expect(screen.getByText('Rung 1 of 2 · 12 reps')).toBeInTheDocument()
    expect(screen.queryByText(/kg/)).toBeNull()
    expect(screen.queryByText(/–/)).toBeNull()
  })

  /**
   * docs/design/Mesocycle2Implementation.md §6.1 — a rung that varies by
   * form rather than load shows its variant as a chip beside the target
   * caption, translated through common:setVariant rather than stored as
   * prose (architecture.md: storage stays locale-free). Both-directions
   * across two rungs, mirroring the existing "second rung once the first
   * is logged" pattern above — proves the chip tracks the *offered* rung
   * rather than always showing the first token.
   */
  const variantLadder: LadderPrescription = {
    exerciseId: 'goblet-squat',
    sets: 2,
    mode: 'reps',
    restSeconds: 90,
    perSide: false,
    setPlan: [
      { weightKg: null, reps: 12, variantKey: 'normal' },
      { weightKg: null, reps: 10, variantKey: 'slow' },
    ],
    maxWeightKg: null,
    weightStepKg: null,
  }
  const variantSession: SessionTemplate = {
    id: 'variant-test',
    name: 'Variant session',
    focus: 'Push',
    items: [variantLadder],
  }

  it("shows the first rung's variant as a translated chip", async () => {
    const workout = createWorkout({
      id: 'test-variant-fresh',
      programId: seedProgram.id,
      session: variantSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(workout)

    renderWorkout()
    expect(await screen.findByText('Normal')).toBeInTheDocument()
    expect(screen.queryByText('Slow')).toBeNull()
  })

  it("shows the second rung's variant once the first is logged", async () => {
    const workout = createWorkout({
      id: 'test-variant-second',
      programId: seedProgram.id,
      session: variantSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(
      logSet(workout, 0, { weightKg: null, reps: 12, seconds: null, completedAt: '2026-07-23T09:05:00.000Z' }, 0),
    )

    renderWorkout()
    expect(await screen.findByText('Slow')).toBeInTheDocument()
    expect(screen.queryByText('Normal')).toBeNull()
  })

  /**
   * QA-found (12 Aug 2026): the same TargetCaption bug, worse in this
   * shape — a seconds-mode null-weight ladder (plank) captioned
   * "– kg × –", dashing out the duration entirely rather than just the
   * weight, because `nextSetTarget.ts` puts a seconds-mode rung's value
   * in `prescribed.seconds`, never `prescribed.reps`, and the caption
   * only ever read `reps`.
   */
  it('shows the duration with a seconds unit, never "kg", for a seconds-mode null-weight ladder', async () => {
    const timedLadder: LadderPrescription = {
      exerciseId: 'goblet-squat',
      sets: 3,
      mode: 'seconds',
      restSeconds: 60,
      perSide: false,
      setPlan: [
        { weightKg: null, reps: 40 },
        { weightKg: null, reps: 50 },
        { weightKg: null, reps: 60 },
      ],
      maxWeightKg: null,
      weightStepKg: null,
    }
    const timedSession: SessionTemplate = {
      id: 'timed-test',
      name: 'Timed session',
      focus: 'Core',
      items: [timedLadder],
    }
    const workout = createWorkout({
      id: 'test-timed-fresh',
      programId: seedProgram.id,
      session: timedSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(workout)

    renderWorkout()
    expect(await screen.findByText('Rung 1 of 3 · 40 s')).toBeInTheDocument()
    expect(screen.queryByText(/kg/)).toBeNull()
    expect(screen.queryByText(/–/)).toBeNull()
  })
})
