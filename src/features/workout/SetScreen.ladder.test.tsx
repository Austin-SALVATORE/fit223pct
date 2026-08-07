import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { settingsRepo } from '@/data/repositories'
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
  await settingsRepo.update({ equipment: undefined })
})

/**
 * Equipment-aware progression, Phase 1 (`~/.claude/plans/
 * equipment-aware-progression.md`, AMENDMENT A) — cross-session history
 * only reaches the progression engine once the athlete's dumbbell
 * hardware is verified (coach spec v2.16 §4). The three tests below
 * construct a *prior completed* workout specifically to exercise
 * classification (advance / at-equipment-max / load-not-the-lever)
 * against that history, so they call this first — otherwise the gate
 * (correctly) offers the un-advanced rung 1 instead, same as a fresh
 * ladder with no history at all.
 */
async function confirmEquipment() {
  await settingsRepo.update({ equipment: { confirmedAt: '2026-08-01' } })
}

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

  it('pre-fills the next rung stepped up when every rung was completed last time', async () => {
    await confirmEquipment()
    const priorCompleted = completeWorkout(
      [0, 1, 2].reduce(
        (w, i) =>
          logSet(
            w,
            0,
            {
              weightKg: ladder.setPlan[i].weightKg,
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
    expect(await screen.findByText('Rung 1 of 3 · 10 kg × 12')).toBeInTheDocument()
    expect(screen.getByLabelText('Weight')).toHaveTextContent('10')
  })

  it('shows at-equipment-max messaging and holds the ladder when the top rung cannot take another step', async () => {
    await confirmEquipment()
    // Top rung caps at 12 kg here (vs. 14 kg in the other tests) — stepping
    // by weightStepKg (2) would land at 14, over this ceiling, so a fully
    // completed ladder must hold rather than advance.
    const cappedSession: SessionTemplate = {
      ...ladderSession,
      items: [{ ...ladder, maxWeightKg: 12 }],
    }

    const priorCompleted = completeWorkout(
      [0, 1, 2].reduce(
        (w, i) =>
          logSet(
            w,
            0,
            {
              weightKg: ladder.setPlan[i].weightKg,
              reps: ladder.setPlan[i].reps,
              seconds: null,
              completedAt: '2026-07-20T09:05:00.000Z',
            },
            i,
          ),
        createWorkout({
          id: 'test-ladder-cap-prior',
          programId: seedProgram.id,
          session: cappedSession,
          date: '2026-07-20',
          startedAt: '2026-07-20T09:00:00.000Z',
        }),
      ),
      '2026-07-20T09:40:00.000Z',
    )
    await db.workouts.put(priorCompleted)

    const active = createWorkout({
      id: 'test-ladder-cap-active',
      programId: seedProgram.id,
      session: cappedSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(active)

    renderWorkout()
    expect(await screen.findByText('Rung 1 of 3 · 8 kg × 12')).toBeInTheDocument()
    // The ceiling is now marked by a MAX pill in the caption rather than by a
    // sentence. The *explanation* moves to the rest screen (design §1.2:
    // education only during rest); what stays here is the state itself, which
    // must not read as a failure to progress — that is the whole reason the
    // engine distinguishes at-equipment-max from a repeat.
    expect(screen.getByText('MAX')).toBeInTheDocument()
    expect(
      screen.queryByText('Every rung is maxed for this setup — hold the ladder and own the reps.'),
    ).toBeNull()
  })

  /**
   * docs/design/Mesocycle2Implementation.md §6/§12.4. A null-weight ladder
   * (bodyweight) was never limited by load in the first place, so it must
   * get its own caption rather than the MAX pill above — the MAX pill
   * asserts an equipment ceiling that doesn't exist for a push-up. This is
   * the both-directions half of the previous test: without it, a caption
   * that fired for *both* states would pass while checking nothing.
   */
  it('shows load-not-the-lever messaging, never MAX, for a bodyweight ladder with nothing left to add load to', async () => {
    await confirmEquipment()
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

    const priorCompleted = completeWorkout(
      [0, 1].reduce(
        (w, i) =>
          logSet(
            w,
            0,
            {
              weightKg: null,
              reps: bodyweightLadder.setPlan[i].reps,
              seconds: null,
              completedAt: '2026-07-20T09:05:00.000Z',
            },
            i,
          ),
        createWorkout({
          id: 'test-bodyweight-prior',
          programId: seedProgram.id,
          session: bodyweightSession,
          date: '2026-07-20',
          startedAt: '2026-07-20T09:00:00.000Z',
        }),
      ),
      '2026-07-20T09:40:00.000Z',
    )
    await db.workouts.put(priorCompleted)

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
    expect(screen.getByText('TECHNIQUE')).toBeInTheDocument()
    expect(screen.queryByText('MAX')).toBeNull()
    expect(
      screen.queryByText('Every rung is maxed for this setup — hold the ladder and own the reps.'),
    ).toBeNull()
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
})
