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

const setTargetSchema = z.object({
  weightKg: z.number().nonnegative().nullable(),
  reps: z.number().int().positive(),
})

const setPlanSchema = z
  .array(setTargetSchema)
  .min(1)
  .refine((rungs) => rungs.every((rung, i) => i === 0 || isAscendingRung(rungs[i - 1].weightKg, rung.weightKg)), {
    message: 'setPlan weights must be ascending or equal, rung to rung',
  })

function isAscendingRung(previousWeightKg: number | null, weightKg: number | null): boolean {
  return previousWeightKg === null || weightKg === null || weightKg >= previousWeightKg
}

// Two mutually-exclusive prescription models (docs/PyramidProgression.md),
// chosen by setPlan presence, never a tag field — matches the domain
// type's own shape (src/domain/types.ts). Both branches are `.strict()`:
// load-bearing, not incidental — it's what structurally rejects an object
// carrying both `range` and `setPlan` (a plain non-strict union would
// silently strip whichever key doesn't match and mask the mistake). The
// trade-off is that a strict union's own error message is unhelpful
// ("Invalid input" with no branch-specific detail), so validateProgramImport
// runs a purpose-built pre-check for exactly that ambiguity, and for the
// other case .strict() alone can't phrase well (a seconds-mode ladder),
// before ever handing the input to this schema.
const repRangePrescriptionSchema = z
  .object({
    exerciseId: z.string().min(1),
    sets: z.number().int().positive(),
    mode: z.enum(['reps', 'seconds']),
    range: repRangeSchema,
    restSeconds: z.number().int().positive(),
    perSide: z.boolean(),
    role: z.enum(['main', 'accessory']).optional(),
    startWeightKg: z.number().nonnegative().nullable(),
    maxWeightKg: z.number().nonnegative().nullable(),
    weightStepKg: z.number().positive().nullable(),
    note: z.string().min(1).optional(),
    substitutionIds: z.array(z.string().min(1)).optional(),
  })
  .strict()

const ladderPrescriptionSchema = z
  .object({
    exerciseId: z.string().min(1),
    sets: z.number().int().positive(),
    // Ruled (docs/PyramidProgression.md): a ladder is reps-mode only —
    // there's no equivalent "hold" ladder, and allowing seconds here would
    // be an unenforced assumption rather than a deliberate choice.
    mode: z.literal('reps'),
    restSeconds: z.number().int().positive(),
    perSide: z.boolean(),
    role: z.enum(['main', 'accessory']).optional(),
    setPlan: setPlanSchema,
    maxWeightKg: z.number().nonnegative().nullable(),
    weightStepKg: z.number().positive().nullable(),
    note: z.string().min(1).optional(),
    substitutionIds: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .refine((p) => p.sets === p.setPlan.length, {
    message: 'sets must equal setPlan.length for a ladder prescription',
    path: ['sets'],
  })

const exercisePrescriptionSchema = z.union([repRangePrescriptionSchema, ladderPrescriptionSchema])

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

const weekdaySessionsSchema = z.record(
  z.string().regex(/^[1-7]$/, 'weekday keys must be 1-7 (1 = Monday … 7 = Sunday)'),
  z.string().min(1),
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
    // M8 Phase 4: additive, absent = 'rotation'. weekdaySessions is
    // validated for cross-references (unknown session id, weekday not in
    // trainingWeekdays) alongside rotation's own cross-reference check
    // below, not here — it needs the parsed sessionIds set.
    schedulingMode: z.enum(['rotation', 'weekday-pinned']).optional(),
    weekdaySessions: weekdaySessionsSchema.optional(),
    weekdayActivities: weekdayActivitiesSchema.optional(),
  })
  .refine((p) => p.endDate === null || p.endDate >= p.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  })
  .refine((p) => p.schedulingMode !== 'weekday-pinned' || (p.weekdaySessions && Object.keys(p.weekdaySessions).length > 0), {
    message: 'weekday-pinned scheduling requires at least one weekdaySessions entry',
    path: ['weekdaySessions'],
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
  const sanitized = stripLegacyPrescriptionKeys(input)

  const precheckError = precheckPrescriptions(sanitized)
  if (precheckError) return { ok: false, error: precheckError }

  const parsed = programSchema.safeParse(sanitized)
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

  if (program.weekdaySessions) {
    for (const [key, sessionId] of Object.entries(program.weekdaySessions)) {
      const weekday = Number(key)
      if (!program.trainingWeekdays.includes(weekday)) {
        return {
          ok: false,
          error: {
            key: 'plan:import.weekdaySessionNotTrainingDay',
            params: { weekdayKey: `plan:import.weekdayName.${weekday}` },
          },
        }
      }
      if (!sessionIds.has(sessionId)) {
        return {
          ok: false,
          error: { key: 'plan:import.unknownWeekdaySession', params: { sessionId } },
        }
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

  // Unconditional, not a merge default: an imported file's content must
  // never resolve through the seed's locale keys, even if it reuses the
  // seed program's id (programSchema also has no `origin` field, so an
  // input file can't claim to be seed content either way).
  return { ok: true, program: { ...program, origin: 'imported' } as Program }
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

/**
 * Old exports carrying a pre-purge `targetRir` key (docs/PyramidProgression.md:
 * "old backups must stay importable") must keep importing forever, silently
 * dropped — but the prescription schemas are now `.strict()` (load-bearing,
 * see exercisePrescriptionSchema's comment), so an unrecognized key would
 * otherwise be rejected outright. Stripping this one specific legacy key
 * before validation, rather than loosening `.strict()`, keeps the reject-
 * genuinely-unknown-keys guarantee for everything else (importantly,
 * `range`+`setPlan` both present).
 */
function stripLegacyPrescriptionKeys(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) return input
  const record = input as Record<string, unknown>
  if (!Array.isArray(record.sessions)) return input
  return {
    ...record,
    sessions: record.sessions.map((session) => {
      if (typeof session !== 'object' || session === null || !Array.isArray((session as Record<string, unknown>).items)) {
        return session
      }
      const sessionRecord = session as Record<string, unknown>
      return {
        ...sessionRecord,
        items: (sessionRecord.items as unknown[]).map((item) => {
          if (typeof item !== 'object' || item === null) return item
          const { targetRir: _targetRir, ...rest } = item as Record<string, unknown>
          return rest
        }),
      }
    }),
  }
}

/**
 * Catches the two prescription-shape mistakes a strict z.union reports
 * unhelpfully (a bare "Invalid input" with no branch-specific detail) —
 * both range and setPlan present (the ambiguity .strict() exists to catch
 * structurally), and a seconds-mode ladder (rejected by mode: z.literal('reps')
 * but worth naming plainly rather than leaving to the union's generic
 * message). Everything else still falls through to humanizeZodError.
 */
function precheckPrescriptions(input: unknown): MessageDescriptor | null {
  if (typeof input !== 'object' || input === null) return null
  const sessions = (input as Record<string, unknown>).sessions
  if (!Array.isArray(sessions)) return null

  for (const session of sessions) {
    if (typeof session !== 'object' || session === null) continue
    const sessionId = readString((session as Record<string, unknown>).id)
    const items = (session as Record<string, unknown>).items
    if (!Array.isArray(items)) continue

    for (const item of items) {
      if (typeof item !== 'object' || item === null) continue
      const record = item as Record<string, unknown>
      const exerciseId = readString(record.exerciseId)
      const hasRange = 'range' in record
      const hasSetPlan = 'setPlan' in record

      if (hasRange && hasSetPlan) {
        return { key: 'plan:import.ambiguousPrescriptionModel', params: { sessionId, exerciseId } }
      }
      if (hasSetPlan && record.mode !== 'reps') {
        return { key: 'plan:import.ladderRequiresRepsMode', params: { sessionId, exerciseId } }
      }
    }
  }
  return null
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '?'
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
