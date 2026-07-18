import type { ExercisePrescription, Program } from '@/domain/types'

const defaults = {
  mode: 'reps' as const,
  targetRir: 2,
  perSide: false,
  role: 'main' as const,
}

function reps(
  exerciseId: string,
  sets: number,
  min: number,
  max: number,
  weights: { start: number | null; max: number | null; step: number | null },
  overrides: Partial<ExercisePrescription> = {},
): ExercisePrescription {
  return {
    ...defaults,
    exerciseId,
    sets,
    range: { min, max },
    restSeconds: 120,
    startWeightKg: weights.start,
    maxWeightKg: weights.max,
    weightStepKg: weights.step,
    ...overrides,
  }
}

const band = { start: null, max: null, step: null }
const bodyweight = band

/**
 * Phase 1 — home gym, 21 Jul to 9 Aug 2026 (see docs/Training.md).
 * Mon/Wed/Fri full body, A/B alternating. Weights respect the equipment:
 * barbell caps at 30 kg, single dumbbell at 20 kg.
 */
export const seedProgram: Program = {
  id: 'phase-1-home',
  name: 'Phase 1 — Home',
  phase: 1,
  startDate: '2026-07-21',
  endDate: '2026-08-09',
  trainingWeekdays: [1, 3, 5],
  rotation: ['A', 'B'],
  sessions: [
    {
      id: 'A',
      name: 'Session A',
      focus: 'Squat & pull',
      items: [
        reps('goblet-squat', 3, 8, 12, { start: 14, max: 20, step: 2 }, {
          note: '3-second lowering',
        }),
        reps('bench-press', 3, 8, 15, { start: 25, max: 30, step: 2.5 }),
        reps('single-arm-db-row', 3, 8, 12, { start: 14, max: 20, step: 2 }, {
          perSide: true,
          restSeconds: 90,
        }),
        reps('romanian-deadlift', 3, 10, 15, { start: 25, max: 30, step: 2.5 }, {
          note: 'Slow eccentric — the bar takes 3 seconds down',
        }),
        reps('band-pull-apart', 2, 15, 20, band, { restSeconds: 60, role: 'accessory' }),
        reps('dead-bug', 2, 8, 10, bodyweight, {
          perSide: true,
          restSeconds: 60,
          role: 'accessory',
        }),
      ],
    },
    {
      id: 'B',
      name: 'Session B',
      focus: 'Hinge & press',
      items: [
        reps('bulgarian-split-squat', 3, 8, 12, { start: 8, max: 20, step: 2 }, {
          perSide: true,
        }),
        reps('overhead-press', 3, 6, 10, { start: 20, max: 30, step: 2.5 }),
        reps('bent-over-row', 3, 10, 15, { start: 25, max: 30, step: 2.5 }, {
          note: 'Pause at the top of each rep',
        }),
        reps('hip-thrust', 3, 10, 15, { start: 20, max: 20, step: 2 }, {
          note: 'Move to single-leg once 15 reps feel controlled',
        }),
        reps('band-lateral-raise', 2, 12, 20, band, { restSeconds: 60, role: 'accessory' }),
        reps('band-curl', 2, 12, 20, band, { restSeconds: 60, role: 'accessory' }),
        reps('side-plank', 2, 20, 40, bodyweight, {
          mode: 'seconds',
          perSide: true,
          restSeconds: 60,
          role: 'accessory',
        }),
      ],
    },
  ],
}
