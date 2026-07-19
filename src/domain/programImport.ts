import { z } from 'zod'
import type { MessageDescriptor } from './message'
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
  substitutionIds: z.array(z.string().min(1)).optional(),
})

const sessionTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  focus: z.string().min(1),
  items: z.array(exercisePrescriptionSchema).min(1, 'a session needs at least one exercise'),
})

const activityItemSchema = z.object({
  label: z.string().min(1),
  detail: z.string().min(1).optional(),
})

const activityTemplateSchema = z.object({
  kind: z.enum(['recovery', 'mobility', 'cardio', 'optional', 'checkpoint']),
  title: z.string().min(1),
  items: z.array(activityItemSchema).min(1, 'an activity needs at least one item'),
})

const weekdayActivitiesSchema = z.record(
  z.string().regex(/^[1-7]$/, 'weekday keys must be 1-7 (1 = Monday … 7 = Sunday)'),
  activityTemplateSchema,
)

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
    weekdayActivities: weekdayActivitiesSchema.optional(),
  })
  .refine((p) => p.endDate === null || p.endDate >= p.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  })

export type ProgramInput = z.infer<typeof programSchema>

export type ProgramImportResult =
  | { ok: true; program: Program }
  | { ok: false; error: MessageDescriptor }

/**
 * Whole-file-or-nothing: the first problem found — schema, cross-reference,
 * or Library lookup — stops the import and names exactly what's wrong.
 *
 * Every hand-authored check below returns a translated-template descriptor
 * with raw tokens (ids, column names) interpolated verbatim — the same
 * template/token split as domain's other messages. Zod's own schema-level
 * messages (regex/refine strings on programSchema) are a deliberate v1
 * exclusion, documented in docs/I18n-adding-a-locale.md: wiring a
 * translated error map through Zod is a separate, larger piece of work
 * this milestone doesn't take on. humanizeZodError still wraps them in a
 * descriptor so the *path* prefix localizes even though the message itself
 * doesn't yet.
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
      error: { key: 'plan:import.duplicateSessionId', params: { sessionId: duplicateSessionId } },
    }
  }

  const sessionIds = new Set(program.sessions.map((s) => s.id))
  for (const rotationId of program.rotation) {
    if (!sessionIds.has(rotationId)) {
      return {
        ok: false,
        error: { key: 'plan:import.unknownRotationSession', params: { rotationId } },
      }
    }
  }

  for (const session of program.sessions) {
    for (const item of session.items) {
      if (!libraryExerciseIds.has(item.exerciseId)) {
        return {
          ok: false,
          error: {
            key: 'plan:import.exerciseNotInLibrary',
            params: { exerciseId: item.exerciseId, sessionId: session.id },
          },
        }
      }

      const substitutionError = validateSubstitutions(item, session.id, libraryExerciseIds)
      if (substitutionError) return { ok: false, error: substitutionError }
    }
  }

  if (program.weekdayActivities) {
    for (const key of Object.keys(program.weekdayActivities)) {
      const weekday = Number(key)
      if (program.trainingWeekdays.includes(weekday)) {
        return {
          ok: false,
          error: {
            key: 'plan:import.weekdayIsTrainingDay',
            params: { weekdayKey: `plan:import.weekdayName.${weekday}` },
          },
        }
      }
    }
  }

  return { ok: true, program: program as Program }
}

function validateSubstitutions(
  item: { exerciseId: string; substitutionIds?: string[] },
  sessionId: string,
  libraryExerciseIds: ReadonlySet<string>,
): MessageDescriptor | null {
  if (!item.substitutionIds) return null

  if (item.substitutionIds.includes(item.exerciseId)) {
    return {
      key: 'plan:import.substitutionListsSelf',
      params: { exerciseId: item.exerciseId, sessionId },
    }
  }

  const duplicate = findDuplicate(item.substitutionIds)
  if (duplicate) {
    return {
      key: 'plan:import.duplicateSubstitution',
      params: { exerciseId: item.exerciseId, sessionId, substitutionId: duplicate },
    }
  }

  for (const subId of item.substitutionIds) {
    if (!libraryExerciseIds.has(subId)) {
      return {
        key: 'plan:import.substitutionNotInLibrary',
        params: { substitutionId: subId, exerciseId: item.exerciseId, sessionId },
      }
    }
  }

  return null
}

function findDuplicate(values: readonly string[]): string | null {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) return value
    seen.add(value)
  }
  return null
}

function humanizeZodError(error: z.ZodError): MessageDescriptor {
  const issue = error.issues[0]
  const path = issue.path.join('.')
  return path
    ? { key: 'plan:import.schemaErrorWithPath', params: { path, message: issue.message } }
    : { key: 'plan:import.schemaError', params: { message: issue.message } }
}
