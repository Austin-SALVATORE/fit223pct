import type { Program } from './types'

/**
 * `origin` is bookkeeping the app keeps about itself, never a field a
 * portable file should carry — a re-imported program always comes back
 * 'imported' regardless (see programImport.ts), so round-tripping it
 * through export would be misleading at best.
 */
export function stripProgramOrigin(program: Program): Omit<Program, 'origin'> {
  const { origin: _origin, ...rest } = program
  return rest
}

/** Canonical JSON for a program — byte-compatible with what import expects. */
export function toCanonicalProgramJson(program: Program): string {
  return JSON.stringify(stripProgramOrigin(program), null, 2)
}

export function programExportFilename(program: Program): string {
  return `${program.id}.json`
}
