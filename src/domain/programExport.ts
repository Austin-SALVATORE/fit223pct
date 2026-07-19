import type { Program } from './types'

/** Canonical JSON for a program — byte-compatible with what import expects. */
export function toCanonicalProgramJson(program: Program): string {
  return JSON.stringify(program, null, 2)
}

export function programExportFilename(program: Program): string {
  return `${program.id}.json`
}
