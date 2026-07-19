import { z } from 'zod'
import type { Program } from './types'

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in yyyy-mm-dd format')

const repRangeSchema = z
  .object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  })
  .refine((r) => r.max >= r.min, { message: 'range.max must be >= range.min' })

const exercisePrescriptionSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().positive(),
  mode: z.enum(['reps', 'seconds']),
  range: repRangeSchema,
  targetRir: z.number().int().min(0).max(10),
  restSeconds: z.number().int().positive(),
  perSide: z.boolean(),
  role: z.enum(['main', 'accessory']).optional(),
  startWeightKg: z.number().nonnegative().nullable(),
  maxWeightKg: z.number().nonnegative().nullable(),
  weightStepKg: z.number().positive().nullable(),
  note: z.string().min(1).optional(),
})

const sessionTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  focus: z.string().min(1),
  items: z.array(exercisePrescriptionSchema).min(1, 'a session needs at least one exercise'),
})

export const programSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    phase: z.number().int().positive(),
    startDate: dateKeySchema,
    endDate: dateKeySchema.nullable(),
    trainingWeekdays: z.array(z.number().int().min(1).max(7)).min(1),
    rotation: z.array(z.string().min(1)).min(1),
    sessions: z.array(sessionTemplateSchema).min(1),
  })
  .refine((p) => p.endDate === null || p.endDate >= p.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  })

export type ProgramInput = z.infer<typeof programSchema>

export type ProgramImportResult =
  | { ok: true; program: Program }
  | { ok: false; error: string }

/**
 * Whole-file-or-nothing: the first problem found — schema, cross-reference,
 * or Library lookup — stops the import and names exactly what's wrong.
 */
export function validateProgramImport(
  input: unknown,
  libraryExerciseIds: ReadonlySet<string>,
): ProgramImportResult {
  const parsed = programSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: humanizeZodError(parsed.error) }
  }
  const program = parsed.data

  const duplicateSessionId = findDuplicate(program.sessions.map((s) => s.id))
  if (duplicateSessionId) {
    return {
      ok: false,
      error: `Two sessions share the id "${duplicateSessionId}" — session ids must be unique.`,
    }
  }

  const sessionIds = new Set(program.sessions.map((s) => s.id))
  for (const rotationId of program.rotation) {
    if (!sessionIds.has(rotationId)) {
      return {
        ok: false,
        error: `Rotation references session id "${rotationId}", which no session in this file defines.`,
      }
    }
  }

  for (const session of program.sessions) {
    for (const item of session.items) {
      if (!libraryExerciseIds.has(item.exerciseId)) {
        return {
          ok: false,
          error: `Exercise id "${item.exerciseId}" in session "${session.id}" doesn't exist in the Library.`,
        }
      }
    }
  }

  return { ok: true, program }
}

function findDuplicate(values: readonly string[]): string | null {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) return value
    seen.add(value)
  }
  return null
}

function humanizeZodError(error: z.ZodError): string {
  const issue = error.issues[0]
  const path = issue.path.join('.')
  return path ? `${path}: ${issue.message}` : issue.message
}
