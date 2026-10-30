import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from '@/data/seed/program'
import { seedExercises } from '@/data/seed/exercises'
import type { LoggedSet, Workout } from '@/domain/types'
import { carrySessionForward, isCompleteExposure } from './carryForward'
import { workoutHighlights } from './highlights'
import { lastEligibleExposureFor } from './historyEligibility'
import { prepareSessionForStart } from './sessionStart'
import { detectStagnation } from './stagnation'
import { suggestedWeightsFor } from './substituteLoad'
import { strengthTrend } from './trends'
import { buildWeeklyReview } from './weeklyReview'
import {
  addCustomSlot,
  completeWorkout,
  createWorkout,
  logSet,
  plannedSetIndices,
  previousExposureFor,
  previousSetsFor,
  summarizeWorkout,
  undoLastSet,
  workoutPosition,
} from './workout'

/**
 * `LoggedSet.custom` is display only (QA F1, 30 Oct).
 *
 * `logSet` now writes the marker for every set in a slot `Add Set` opened. That is only a
 * display fix if nothing that decides the NEXT workout reads it, and the coach rules on
 * anything that does. The trace found two readers (History's "(Custom)" and the summary's
 * count) and every progression consumer reading the index instead
 * (`setIndex >= prescription.sets`). This pins the trace: the same four stored sessions,
 * with and without the marker on their custom sets, give the same answer from every
 * consumer below. If one starts differing, a progression decision has begun to depend on a
 * display flag and that is a coach question, not a refactor.
 *
 * Without the marker is every set stored before 30 Oct, so this is also the proof that old
 * data needs no migration: it is read exactly as new data is.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed):
 *   carry-forward's custom-rung filter also drops a marked set (`buildSetPlan`)
 *       -> 10 red: four here (the three carry rows and "real answers"), four in
 *          `carryForward.test.ts`, one in `WorkoutPage.carriedCustomSet.test.tsx`, one in
 *          `TodayPage.carriedStart.test.tsx`
 *   swap suggestions also skip a marked set (`suggestedWeightsFor`)
 *       -> 6 red: one here, five in `substituteLoad.test.ts`
 *   `logSet` not writing the marker -> two red here, the fixture and the sentinel, because
 *       the "marked" side of the comparison would then be the unmarked one.
 * The sentinel ("a consumer that reads the marker would be caught") is the check on this
 * file's own method: it fails if the two sides ever stop differing in the marker.
 *
 * What it cannot see: a consumer added after this was written (add it to the list), and
 * one that reads the marker only on a path the fixtures do not take (a rep-range
 * prescription, a hold). The consumers named here were found by a symbol-level reference
 * search for `LoggedSet.custom`, which returned two readers, both display.
 */

const session = mesocycle2Build.sessions[0]
const gi = session.items.findIndex((item) => item.exerciseId === 'goblet-squat')
const goblet = seedExercises.find((e) => e.id === 'goblet-squat')!

/** One completed session: the prescribed sets, then both custom slots, as the app logs them. */
function session_(id: string, date: string, weights: number[]): Workout {
  let w = createWorkout({ id, programId: mesocycle2Build.id, session, date, startedAt: `${date}T09:00:00.000Z` })
  w = addCustomSlot(addCustomSlot(w, gi), gi)
  for (let n = 0; ; n += 1) {
    const position = workoutPosition(w)
    if (position === 'complete' || position.exerciseIndex !== gi) break
    w = logSet(
      w,
      gi,
      { weightKg: weights[n] ?? 15, reps: 10, seconds: null, completedAt: `${date}T09:${10 + n}:00.000Z` },
      position.setIndex,
    )
  }
  return completeWorkout(w, `${date}T10:00:00.000Z`)
}

const WEIGHTS: [string, string, number[]][] = [
  ['w1', '2026-10-12', [12, 12, 12, 12, 14, 14]],
  ['w2', '2026-10-19', [14, 14, 14, 14, 15, 15]],
  ['w3', '2026-10-26', [14, 16, 16, 16, 15, 15]],
  ['w4', '2026-11-02', [16, 16, 18, 18, 15, 15]],
]
/** As `logSet` writes them now. */
const MARKED: Workout[] = WEIGHTS.map(([id, date, w]) => session_(id, date, w))
const stripSet = ({ custom: _custom, ...rest }: LoggedSet): LoggedSet => rest
/** As every set stored before the marker was written looks. */
const UNMARKED: Workout[] = MARKED.map((w) => ({
  ...w,
  exercises: w.exercises.map((e) => ({ ...e, sets: e.sets.map(stripSet) })),
}))

const prescribed = MARKED[1].exercises[gi].prescription.sets

describe('the fixture is what it claims', () => {
  it('differs by the marker and by nothing else', () => {
    for (const [i, marked] of MARKED.entries()) {
      const sets = marked.exercises[gi].sets
      expect(sets.length).toBe(prescribed + 2)
      expect(sets.filter((s) => s.custom).map((s) => s.setIndex)).toEqual([prescribed, prescribed + 1])
      expect(UNMARKED[i].exercises[gi].sets.some((s) => 'custom' in s)).toBe(false)
      expect(UNMARKED[i].exercises[gi].sets.map((s) => s.setIndex)).toEqual(sets.map((s) => s.setIndex))
    }
  })
})

const consumers: [string, (h: Workout[]) => unknown][] = [
  ['isCompleteExposure', (h) => isCompleteExposure(h[1].exercises[gi])],
  ['workoutPosition', (h) => workoutPosition(h[1])],
  ['plannedSetIndices', (h) => plannedSetIndices(h[1].exercises[gi])],
  ['carry-forward (carrySessionForward)', (h) => carrySessionForward(session.items, h, mesocycle2Build.id)],
  [
    'carry-forward on a steady day (prepareSessionForStart)',
    (h) => prepareSessionForStart(session, h, mesocycle2Build.id, { tier: 'steady', drivers: [], consecutiveLowDays: 0 }),
  ],
  [
    'carry-forward on an easier day (prepareSessionForStart)',
    (h) => prepareSessionForStart(session, h, mesocycle2Build.id, { tier: 'easier', drivers: [], consecutiveLowDays: 0 }),
  ],
  ['swap suggestions (suggestedWeightsFor)', (h) => suggestedWeightsFor(h, mesocycle2Build.id, 'goblet-squat')],
  ['history eligibility', (h) => lastEligibleExposureFor(h, mesocycle2Build.id, 'goblet-squat')?.workout.id],
  ['"Last time" sets, marker aside', (h) => previousSetsFor(h, 'goblet-squat').map(stripSet)],
  ['previous exposure, marker aside', (h) => previousExposureFor(h, mesocycle2Build.id, 'goblet-squat')?.sets.map(stripSet)],
  ['strength trend', (h) => strengthTrend('goblet-squat', h)],
  ['stagnation', (h) => detectStagnation(goblet, h)],
  ['highlights', (h) => workoutHighlights(h[3], h)],
  ['summarizeWorkout', (h) => summarizeWorkout(h[3])],
  ['weekly review', (h) => buildWeeklyReview(mesocycle2Build, h, new Date(2026, 9, 28))],
  ['position after an undo', (h) => workoutPosition(undoLastSet(h[1]).workout)],
]

describe('every consumer answers the same with and without the marker', () => {
  it.each(consumers)('%s', (_name, run) => {
    const marked = JSON.parse(JSON.stringify(run(MARKED) ?? null))
    const unmarked = JSON.parse(JSON.stringify(run(UNMARKED) ?? null))
    expect(marked).toEqual(unmarked)
  })
})

describe('and the comparison is not vacuous', () => {
  it('a consumer that reads the marker would be caught', () => {
    const readsMarker = (h: Workout[]) => h[1].exercises[gi].sets.filter((s) => !s.custom).length
    expect(readsMarker(MARKED)).toBe(prescribed)
    expect(readsMarker(UNMARKED)).toBe(prescribed + 2)
  })

  it('the consumers returned real answers, with the custom sets in them', () => {
    const carried = carrySessionForward(session.items, MARKED, mesocycle2Build.id)[gi]
    // The two custom sets carry as working sets (coach ruling, 28 Aug), and they did before the marker existed.
    expect(carried.sets).toBe(prescribed + 2)
    expect(suggestedWeightsFor(MARKED, mesocycle2Build.id, 'goblet-squat').startWeightsKg).toHaveLength(prescribed + 2)
    expect((strengthTrend('goblet-squat', MARKED) as { status: string }).status).toBe('increasing')
    expect(isCompleteExposure(MARKED[1].exercises[gi])).toBe(true)
    expect(workoutHighlights(MARKED[3], MARKED)).not.toHaveLength(0)
    expect(summarizeWorkout(MARKED[3]).totalSets).toBe(prescribed + 2)
  })
})
