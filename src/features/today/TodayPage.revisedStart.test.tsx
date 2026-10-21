import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { workoutRepo } from '@/data/repositories'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import type { LadderPrescription, LoggedSet, Workout } from '@/domain/types'
import { TodayPage } from './TodayPage'

/**
 * Phase 4 integration (sheet §4.5, T-Today). Starting the revised Session A
 * after the OLD four-rung sessions must store the new structure with the
 * athlete's logged rungs mapped by `carryFrom`, never the old four-set plan
 * and never a positional smear of the old rungs.
 *
 * **The plank is logged +5 s above its authored values on purpose (C9).** The
 * correct result (old rungs 2 and 3 -> 55/65 here) must differ from the
 * authored fallback (50/60), or a lost `carryFrom` — a map of nulls, or no
 * marker-aware projection at all — gives an identical stored plan and the
 * test cannot see that inheritance was lost.
 *
 * Monday 19 Oct 2026 is inside M2 (10 Aug - 31 Dec), and with three
 * completed sessions behind it the rotation offers A.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 19, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  await db.workouts.clear()
})

const sessionA = mesocycle2Build.sessions[0]

/** The f8b20ccd (pre-revision) prescriptions, as literals — not derived from the seed. */
const OLD_PLANK: LadderPrescription = {
  exerciseId: 'plank',
  sets: 4,
  mode: 'seconds',
  restSeconds: 60,
  perSide: false,
  role: 'accessory',
  setPlan: [40, 50, 60, 70].map((reps) => ({ weightKg: null, reps })),
  maxWeightKg: null,
  weightStepKg: null,
}
const OLD_LATERAL: LadderPrescription = {
  exerciseId: 'dumbbell-lateral-raise',
  sets: 4,
  mode: 'reps',
  restSeconds: 60,
  perSide: false,
  role: 'accessory',
  setPlan: [
    { weightKg: 4, reps: 15 },
    { weightKg: 6, reps: 12 },
    { weightKg: 6, reps: 10 },
    { weightKg: 6, reps: 8 },
  ],
  maxWeightKg: 20,
  weightStepKg: 2,
}

function logged(setIndex: number, weightKg: number | null, reps: number | null, seconds: number | null): LoggedSet {
  return { setIndex, weightKg, reps, seconds, completedAt: '2026-10-12T10:00:00.000Z' }
}

function pastSession(id: string, date: string, items: LadderPrescription[], sets: LoggedSet[][]): Workout {
  const base = createWorkout({
    id,
    programId: mesocycle2Build.id,
    session: { id: sessionA.id, name: 'Full Body A', focus: 'Squat Emphasis', items },
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  return {
    ...base,
    completedAt: `${date}T10:00:00.000Z`,
    readiness: { tier: 'ready', drivers: [] },
    exercises: base.exercises.map((e, i) => ({ ...e, sets: sets[i] })),
  }
}

describe('starting the revised Session A after the old four-rung sessions', () => {
  it('stores the new structure, with the logged rungs mapped by carryFrom', async () => {
    const plankLog = [45, 55, 65, 75].map((s, i) => logged(i, null, null, s)) // authored + 5 s
    const lateralLog = [logged(0, 6, 16, null), logged(1, 8, 13, null), logged(2, 8, 11, null), logged(3, 8, 9, null)]
    await db.workouts.bulkPut([
      pastSession('past-a', '2026-10-12', [OLD_PLANK, OLD_LATERAL], [plankLog, lateralLog]),
      { ...pastSession('past-b', '2026-10-14', [], []), sessionTemplateId: 'mesocycle2-fullbody-hinge' },
      { ...pastSession('past-c', '2026-10-16', [], []), sessionTemplateId: 'mesocycle2-fullbody-hipext-shoulder' },
    ])

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/workout" element={<p>WORKOUT PROBE</p>} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Start session' }))
    await screen.findByText('WORKOUT PROBE')

    const stored = await workoutRepo.getActive()
    const authoredPlank = sessionA.items.find((i) => i.exerciseId === 'plank')!
    const plank = stored?.exercises.find((e) => e.exerciseId === 'plank')?.prescription as LadderPrescription
    // The structure, equal to the count the preview renders (authored).
    expect(plank.sets).toBe(authoredPlank.sets)
    expect(plank.sets).toBe(2)
    // Old rungs 2 and 3 (index 1, 2), not 0 and 1: 55 / 65 s, not 45 / 55 and not the authored 50 / 60.
    expect(plank.setPlan.map((r) => r.reps)).toEqual([55, 65])
    expect(plank.revision?.id).toBe(authoredPlank.revision?.id)

    const lateral = stored?.exercises.find((e) => e.exerciseId === 'dumbbell-lateral-raise')?.prescription as LadderPrescription
    expect(lateral.sets).toBe(3)
    // Technique gate: loads stay on the NEW authored rungs, even though 6/8/8 kg were logged...
    expect(lateral.setPlan.map((r) => r.weightKg)).toEqual([4, 6, 6])
    // ...while reps carry from the same rung positions.
    expect(lateral.setPlan.map((r) => r.reps)).toEqual([16, 13, 11])
  })
})
