import { stripProgramOrigin } from './programExport'
import type { CheckIn, Program, UserSettings, Workout } from './types'

/**
 * The backup story for a local-first app — everything except the Library,
 * which is app-owned and reseeded on any fresh install.
 */
export interface FullDataExport {
  exportedAt: string
  programs: Program[]
  workouts: Workout[]
  checkins: CheckIn[]
  settings: UserSettings | null
}

export function buildFullDataExport(input: {
  programs: Program[]
  workouts: Workout[]
  checkins: CheckIn[]
  settings: UserSettings | undefined
  exportedAt: string
}): FullDataExport {
  return {
    exportedAt: input.exportedAt,
    programs: input.programs.map(stripProgramOrigin),
    workouts: input.workouts,
    checkins: input.checkins,
    settings: input.settings ?? null,
  }
}

export function toFullDataExportJson(data: FullDataExport): string {
  return JSON.stringify(data, null, 2)
}

export function fullDataExportFilename(dateKey: string): string {
  return `fit223-export-${dateKey}.json`
}
