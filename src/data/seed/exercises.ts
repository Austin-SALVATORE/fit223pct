import type { Exercise } from '@/domain/types'

/**
 * Exercise library for Austin's home setup: barbell 0–30 kg, dumbbells
 * (1×20 kg or 2×10 kg), adjustable bench, resistance bands.
 *
 * Display content (name, cues, teachingConcept) lives in each locale's
 * seed.json under src/locales, keyed by id — these records are the
 * structural, locale-free shape only. See src/i18n/seedExercise.ts.
 */
export const seedExercises: Exercise[] = [
  {
    id: 'goblet-squat',
    muscles: ['quads', 'glutes', 'core'],
    equipment: ['dumbbell'],
    substitutionIds: ['split-squat', 'tempo-bodyweight-squat'],
    isUnilateral: false,
  },
  {
    id: 'split-squat',
    muscles: ['quads', 'glutes'],
    equipment: ['dumbbell', 'bodyweight'],
    substitutionIds: ['goblet-squat', 'bulgarian-split-squat'],
    isUnilateral: true,
  },
  {
    id: 'tempo-bodyweight-squat',
    muscles: ['quads', 'glutes'],
    equipment: ['bodyweight'],
    substitutionIds: ['goblet-squat'],
    isUnilateral: false,
  },
  {
    id: 'bench-press',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    substitutionIds: ['deficit-push-up', 'db-floor-press', 'dumbbell-bench-press'],
    isUnilateral: false,
  },
  {
    id: 'deficit-push-up',
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    equipment: ['bodyweight'],
    substitutionIds: ['bench-press'],
    isUnilateral: false,
  },
  {
    id: 'db-floor-press',
    muscles: ['chest', 'triceps'],
    equipment: ['dumbbell'],
    substitutionIds: ['bench-press', 'deficit-push-up', 'dumbbell-bench-press'],
    isUnilateral: false,
  },
  {
    id: 'dumbbell-bench-press',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['dumbbell', 'bench'],
    substitutionIds: ['bench-press', 'db-floor-press'],
    isUnilateral: false,
  },
  {
    id: 'single-arm-db-row',
    muscles: ['back', 'biceps'],
    equipment: ['dumbbell', 'bench'],
    substitutionIds: ['bent-over-row', 'band-row'],
    isUnilateral: true,
  },
  {
    id: 'bent-over-row',
    muscles: ['back', 'biceps'],
    equipment: ['barbell'],
    substitutionIds: ['single-arm-db-row', 'band-row'],
    isUnilateral: false,
  },
  {
    id: 'band-row',
    muscles: ['back', 'biceps'],
    equipment: ['band'],
    substitutionIds: ['single-arm-db-row'],
    isUnilateral: false,
  },
  {
    id: 'romanian-deadlift',
    muscles: ['hamstrings', 'glutes', 'back'],
    equipment: ['barbell'],
    substitutionIds: ['single-leg-rdl', 'dumbbell-rdl'],
    isUnilateral: false,
  },
  {
    id: 'single-leg-rdl',
    muscles: ['hamstrings', 'glutes', 'core'],
    equipment: ['dumbbell'],
    substitutionIds: ['romanian-deadlift', 'dumbbell-rdl'],
    isUnilateral: true,
  },
  {
    id: 'dumbbell-rdl',
    muscles: ['hamstrings', 'glutes', 'back'],
    equipment: ['dumbbell'],
    substitutionIds: ['romanian-deadlift', 'single-leg-rdl'],
    isUnilateral: false,
  },
  {
    id: 'bulgarian-split-squat',
    muscles: ['quads', 'glutes'],
    equipment: ['dumbbell', 'bench'],
    substitutionIds: ['split-squat', 'goblet-squat'],
    isUnilateral: true,
  },
  {
    id: 'overhead-press',
    muscles: ['shoulders', 'triceps', 'core'],
    equipment: ['barbell'],
    substitutionIds: ['single-arm-db-press', 'dumbbell-shoulder-press'],
    isUnilateral: false,
  },
  {
    id: 'single-arm-db-press',
    muscles: ['shoulders', 'triceps', 'core'],
    equipment: ['dumbbell'],
    substitutionIds: ['overhead-press', 'dumbbell-shoulder-press'],
    isUnilateral: true,
  },
  {
    id: 'dumbbell-shoulder-press',
    muscles: ['shoulders', 'triceps', 'core'],
    equipment: ['dumbbell'],
    substitutionIds: ['overhead-press', 'single-arm-db-press'],
    isUnilateral: false,
  },
  {
    id: 'hip-thrust',
    muscles: ['glutes', 'hamstrings'],
    equipment: ['dumbbell', 'bench'],
    substitutionIds: ['single-leg-hip-thrust'],
    isUnilateral: false,
  },
  {
    id: 'single-leg-hip-thrust',
    muscles: ['glutes', 'hamstrings'],
    equipment: ['bench', 'bodyweight'],
    substitutionIds: ['hip-thrust'],
    isUnilateral: true,
  },
  {
    id: 'band-pull-apart',
    muscles: ['shoulders', 'back'],
    equipment: ['band'],
    substitutionIds: ['rear-delt-fly'],
    isUnilateral: false,
  },
  {
    id: 'rear-delt-fly',
    muscles: ['shoulders', 'back'],
    equipment: ['dumbbell'],
    substitutionIds: ['band-pull-apart'],
    isUnilateral: false,
  },
  {
    id: 'band-lateral-raise',
    muscles: ['shoulders'],
    equipment: ['band'],
    substitutionIds: [],
    isUnilateral: false,
  },
  {
    id: 'band-curl',
    muscles: ['biceps'],
    equipment: ['band'],
    substitutionIds: [],
    isUnilateral: false,
  },
  {
    id: 'dead-bug',
    muscles: ['core'],
    equipment: ['bodyweight'],
    substitutionIds: ['side-plank'],
    isUnilateral: true,
  },
  {
    id: 'side-plank',
    muscles: ['core'],
    equipment: ['bodyweight'],
    substitutionIds: ['dead-bug'],
    isUnilateral: true,
  },
  // Phase 2 (Fitness Park) additions — the gym unlocks movements home
  // equipment couldn't: a rack for real barbell squats, a hip thrust
  // station, and cable machines for vertical pulling. Each keeps its
  // home-equipment counterpart as a substitution for a busy machine.
  {
    id: 'barbell-squat',
    muscles: ['quads', 'glutes', 'core'],
    equipment: ['barbell', 'machine'],
    substitutionIds: ['goblet-squat'],
    isUnilateral: false,
  },
  {
    id: 'cable-row',
    muscles: ['back', 'biceps'],
    equipment: ['machine'],
    substitutionIds: ['single-arm-db-row'],
    isUnilateral: false,
  },
  {
    id: 'lat-pulldown',
    muscles: ['back', 'biceps'],
    equipment: ['machine'],
    substitutionIds: ['band-row'],
    isUnilateral: false,
  },
  {
    id: 'barbell-hip-thrust',
    muscles: ['glutes', 'hamstrings'],
    equipment: ['barbell', 'bench'],
    substitutionIds: ['hip-thrust'],
    isUnilateral: false,
  },
  {
    id: 'dumbbell-lateral-raise',
    muscles: ['shoulders'],
    equipment: ['dumbbell'],
    substitutionIds: ['band-lateral-raise'],
    isUnilateral: false,
  },
  {
    id: 'dumbbell-curl',
    muscles: ['biceps'],
    equipment: ['dumbbell'],
    substitutionIds: ['band-curl'],
    isUnilateral: false,
  },
]
