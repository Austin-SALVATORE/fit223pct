import type { Program, RepRangePrescription } from '@/domain/types'

const defaults = {
  mode: 'reps' as const,
  perSide: false,
  role: 'main' as const,
}

function reps(
  exerciseId: string,
  sets: number,
  min: number,
  max: number,
  weights: { start: number | null; max: number | null; step: number | null },
  overrides: Partial<RepRangePrescription> = {},
): RepRangePrescription {
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
  origin: 'seed',
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
        reps('goblet-squat', 3, 8, 12, { start: 16, max: 20, step: 2 }, {
          note: '3-second lowering',
        }),
        reps('bench-press', 3, 8, 15, { start: 25, max: 30, step: 2.5 }),
        reps('single-arm-db-row', 3, 8, 12, { start: 16, max: 20, step: 2 }, {
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
        reps('single-leg-hip-thrust', 3, 10, 15, bodyweight, {
          perSide: true,
          note: 'Keep the hips level — the free leg stays extended',
          substitutionIds: ['hip-thrust'],
        }),
        reps('band-lateral-raise', 2, 12, 20, band, { restSeconds: 60, role: 'accessory' }),
        reps('dumbbell-curl', 2, 12, 20, { start: 8, max: null, step: 2 }, {
          restSeconds: 60,
          role: 'accessory',
          substitutionIds: ['band-curl'],
        }),
        reps('side-plank', 2, 20, 40, bodyweight, {
          mode: 'seconds',
          perSide: true,
          restSeconds: 60,
          role: 'accessory',
        }),
      ],
    },
  ],
  weekdayActivities: {
    2: {
      kind: 'recovery',
      title: 'Recovery walk & stretch',
      items: [
        { label: '30-minute easy walk', detail: 'Conversational pace' },
        {
          label: '10-minute stretch',
          detail: 'Hips, hamstrings, chest, shoulders',
        },
      ],
    },
    4: {
      kind: 'recovery',
      title: 'Mobility & easy cardio',
      items: [
        {
          label: '10-minute mobility routine',
          detail: 'Ankles, hips, thoracic spine, shoulders',
        },
        {
          label: '20–30 minutes of Zone 2',
          detail: 'Brisk walk, easy cycle, or relaxed swim',
        },
      ],
    },
    6: {
      kind: 'optional',
      title: 'Optional sport',
      items: [
        {
          label: 'One enjoyable activity',
          detail: 'Tennis, swimming, cycling, or a long walk — keep it recreational',
        },
        { label: 'Complete rest is a fine choice too' },
      ],
    },
    7: {
      kind: 'checkpoint',
      title: 'Weekly checkpoint',
      items: [
        { label: 'Weigh in', detail: 'Same conditions each week — morning, before eating' },
        { label: 'Measure your waist', detail: 'Same spot, same conditions as last week' },
        { label: 'Prepare the coming week', detail: 'Confirm training times and any sport plans' },
      ],
    },
  },
}
