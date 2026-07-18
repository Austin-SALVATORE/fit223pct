export type MuscleGroup =
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'

export type Equipment = 'barbell' | 'dumbbell' | 'bench' | 'band' | 'bodyweight'

export interface TeachingConcept {
  title: string
  body: string
}

export interface Exercise {
  id: string
  name: string
  muscles: MuscleGroup[]
  equipment: Equipment[]
  cues: string[]
  substitutionIds: string[]
  isUnilateral: boolean
  teachingConcept?: TeachingConcept
}

export type EffortMode = 'reps' | 'seconds'

export interface RepRange {
  min: number
  max: number
}

export interface ExercisePrescription {
  exerciseId: string
  sets: number
  mode: EffortMode
  range: RepRange
  targetRir: number
  restSeconds: number
  perSide: boolean
  /** Volume adjustments only ever trim accessories; absent means 'main' (older snapshots) */
  role?: 'main' | 'accessory'
  startWeightKg: number | null
  /** Hard equipment ceiling at home; null = load is not the lever (bands, bodyweight) */
  maxWeightKg: number | null
  weightStepKg: number | null
  note?: string
}

export interface SessionTemplate {
  id: string
  name: string
  focus: string
  items: ExercisePrescription[]
}

export interface Program {
  id: string
  name: string
  phase: number
  /** ISO date (yyyy-mm-dd), first day the program is active */
  startDate: string
  endDate: string | null
  /** ISO weekday numbers of scheduled training days (1 = Monday … 7 = Sunday) */
  trainingWeekdays: number[]
  /** Session ids cycled across training days, driven by completed count — missed days never skip a session */
  rotation: string[]
  sessions: SessionTemplate[]
}

export interface LoggedSet {
  setIndex: number
  weightKg: number | null
  reps: number | null
  seconds: number | null
  rir: number | null
  completedAt: string
}

export interface WorkoutExercise {
  exerciseId: string
  /** Snapshot of the prescription at workout time, so history survives program edits */
  prescription: ExercisePrescription
  sets: LoggedSet[]
  substitutedForId?: string
}

export interface Workout {
  id: string
  programId: string
  sessionTemplateId: string
  /** ISO date the session belongs to */
  date: string
  startedAt: string
  completedAt: string | null
  exercises: WorkoutExercise[]
  /** Readiness applied at start, kept for future intelligence (additive, optional) */
  readiness?: {
    tier: 'ready' | 'steady' | 'easier'
    drivers: string[]
  }
  notes?: string
}

export type Rating = 1 | 2 | 3 | 4 | 5

export interface CheckIn {
  id: string
  date: string
  sleep: Rating | null
  energy: Rating | null
  soreness: Rating | null
  stress: Rating | null
  motivation: Rating | null
  weightKg: number | null
  waistCm: number | null
}

export interface UserSettings {
  id: 'user'
  name: string
  heightCm: number
  weeklyGoal: number
}
