import type { MessageDescriptor } from './message'

export type MarkdownParseResult =
  | { ok: true; data: unknown }
  | { ok: false; error: MessageDescriptor }

const REQUIRED_COLUMNS = [
  'Exercise',
  'Sets',
  'Range',
  'Mode',
  'Rest',
  'Weights',
  'Note',
] as const

const SECTION_HEADING = /^##\s*(Session|Activity):\s*(.+)$/
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
const FRONT_MATTER_LINE = /^([A-Za-z][\w]*):\s*(.*)$/

const WEEKDAY_NAME_TO_ISO: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
}

/**
 * Front matter + one `## Session: <id>` section per session, each holding a
 * `Name:` / `Focus:` line and a header-driven exercise table, plus an
 * optional `## Activity: <Weekday>` section per activity day — parses to
 * the exact object shape validateProgramImport expects (see
 * docs/ProgramMarkdownFormat.md for the full format).
 *
 * Front matter is a deliberately narrow flat key/value block, hand-parsed
 * rather than run through a general YAML engine — the fields are fixed and
 * known, and a full engine both pulls in a much heavier dependency and
 * silently re-types bare dates as Date objects instead of strings.
 */
export function parseProgramMarkdown(source: string): MarkdownParseResult {
  const match = FRONT_MATTER.exec(source)
  if (!match) {
    return { ok: false, error: { key: 'plan:import.missingFrontMatter' } }
  }
  const [, frontMatterBlock, body] = match
  const frontMatter = parseFrontMatter(frontMatterBlock)

  const rawSections = splitSections(body)
  const sessionSections = rawSections.filter((s) => s.type === 'session')
  const activitySections = rawSections.filter((s) => s.type === 'activity')

  if (sessionSections.length === 0) {
    return { ok: false, error: { key: 'plan:import.noSessionsFound' } }
  }

  const sessions: unknown[] = []
  for (const section of sessionSections) {
    const result = parseSession(section)
    if (!result.ok) return result
    sessions.push(result.data)
  }

  let weekdayActivities: Record<string, unknown> | undefined
  for (const section of activitySections) {
    const result = parseActivity(section)
    if (!result.ok) return result
    weekdayActivities = { ...weekdayActivities, [result.weekday]: result.data }
  }

  return {
    ok: true,
    data: {
      id: frontMatter.id,
      name: frontMatter.name,
      phase: Number(frontMatter.phase),
      startDate: frontMatter.startDate ?? '',
      endDate: frontMatter.endDate && frontMatter.endDate.length > 0 ? frontMatter.endDate : null,
      trainingWeekdays: parseFlowArray(frontMatter.trainingWeekdays ?? '').map(Number),
      rotation: parseFlowArray(frontMatter.rotation ?? ''),
      sessions,
      ...(weekdayActivities ? { weekdayActivities } : {}),
    },
  }
}

function parseFrontMatter(block: string): Record<string, string> {
  const data: Record<string, string> = {}
  for (const line of block.split('\n')) {
    const match = FRONT_MATTER_LINE.exec(line)
    if (match) data[match[1]] = match[2].trim()
  }
  return data
}

function parseFlowArray(raw: string): string[] {
  const inner = raw.trim().replace(/^\[/, '').replace(/\]$/, '').trim()
  if (inner === '') return []
  return inner.split(',').map((entry) => entry.trim())
}

interface RawSection {
  type: 'session' | 'activity'
  heading: string
  lines: string[]
}

function splitSections(content: string): RawSection[] {
  const lines = content.split('\n')
  const sections: RawSection[] = []
  let current: RawSection | null = null

  for (const line of lines) {
    const match = SECTION_HEADING.exec(line.trim())
    if (match) {
      current = { type: match[1].toLowerCase() === 'session' ? 'session' : 'activity', heading: match[2].trim(), lines: [] }
      sections.push(current)
      continue
    }
    current?.lines.push(line)
  }

  return sections
}

function parseSession(section: RawSection): { ok: true; data: unknown } | { ok: false; error: MessageDescriptor } {
  const sectionId = section.heading
  const name = findFieldLine(section.lines, 'Name')
  const focus = findFieldLine(section.lines, 'Focus')
  if (!name) return { ok: false, error: { key: 'plan:import.sessionMissingName', params: { sectionId } } }
  if (!focus) return { ok: false, error: { key: 'plan:import.sessionMissingFocus', params: { sectionId } } }

  const tableLines = section.lines.filter((line) => line.trim().startsWith('|'))
  if (tableLines.length < 2) {
    return { ok: false, error: { key: 'plan:import.sessionMissingTable', params: { sectionId } } }
  }

  const header = splitRow(tableLines[0]).map((cell) => cell.trim())
  const dataRows = tableLines.slice(2) // skip header + separator

  const columnIndex = new Map<string, number>()
  for (const column of REQUIRED_COLUMNS) {
    const index = header.findIndex((h) => h.toLowerCase() === column.toLowerCase())
    if (index === -1) {
      return {
        ok: false,
        error: { key: 'plan:import.sessionMissingColumn', params: { sectionId, column } },
      }
    }
    columnIndex.set(column, index)
  }
  const roleIndex = header.findIndex((h) => h.toLowerCase() === 'role')
  const perSideIndex = header.findIndex((h) => h.toLowerCase() === 'per side')
  const substitutionsIndex = header.findIndex((h) => h.toLowerCase() === 'substitutions')

  const items: unknown[] = []
  for (const rowLine of dataRows) {
    if (!rowLine.trim().startsWith('|')) continue
    const cells = splitRow(rowLine)
    const get = (column: (typeof REQUIRED_COLUMNS)[number]) => cells[columnIndex.get(column)!]?.trim() ?? ''

    const exerciseId = get('Exercise')
    const range = parseRange(get('Range'))
    if (!range) {
      return {
        ok: false,
        error: {
          key: 'plan:import.invalidRange',
          params: { sectionId, exerciseId, value: get('Range') },
        },
      }
    }
    const weights = parseWeights(get('Weights'))
    if (!weights) {
      return {
        ok: false,
        error: {
          key: 'plan:import.invalidWeights',
          params: { sectionId, exerciseId, value: get('Weights') },
        },
      }
    }
    const sets = Number(get('Sets'))
    const restSeconds = Number(get('Rest'))
    if (!Number.isFinite(sets) || !Number.isFinite(restSeconds)) {
      return {
        ok: false,
        error: { key: 'plan:import.nonNumericField', params: { sectionId, exerciseId } },
      }
    }

    const note = get('Note')
    const role = roleIndex >= 0 ? cells[roleIndex]?.trim() : undefined
    const perSideCell = perSideIndex >= 0 ? cells[perSideIndex]?.trim().toLowerCase() : undefined
    const substitutionIds =
      substitutionsIndex >= 0 ? parseSubstitutions(cells[substitutionsIndex]) : undefined

    items.push({
      exerciseId,
      sets,
      mode: get('Mode'),
      range,
      restSeconds,
      perSide: perSideCell === 'yes',
      ...(role ? { role } : {}),
      startWeightKg: weights.start,
      maxWeightKg: weights.max,
      weightStepKg: weights.step,
      ...(note && note !== '-' ? { note } : {}),
      ...(substitutionIds ? { substitutionIds } : {}),
    })
  }

  return {
    ok: true,
    data: { id: sectionId, name, focus, items },
  }
}

type ActivityParseResult =
  | { ok: true; weekday: string; data: unknown }
  | { ok: false; error: MessageDescriptor }

function parseActivity(section: RawSection): ActivityParseResult {
  const weekdayName = section.heading
  const weekday = WEEKDAY_NAME_TO_ISO[weekdayName.toLowerCase()]
  if (weekday === undefined) {
    return {
      ok: false,
      error: { key: 'plan:import.unrecognizedWeekdayHeading', params: { weekdayName } },
    }
  }

  const kind = findFieldLine(section.lines, 'Kind')
  const title = findFieldLine(section.lines, 'Title')
  if (!kind) return { ok: false, error: { key: 'plan:import.activityMissingKind', params: { weekdayName } } }
  if (!title) return { ok: false, error: { key: 'plan:import.activityMissingTitle', params: { weekdayName } } }

  const itemLines = section.lines.filter((line) => line.trim().startsWith('-'))
  if (itemLines.length === 0) {
    return {
      ok: false,
      error: { key: 'plan:import.activityMissingItems', params: { weekdayName } },
    }
  }
  const items = itemLines.map(parseActivityItem)

  return { ok: true, weekday: String(weekday), data: { kind, title, items } }
}

function parseActivityItem(line: string): { label: string; detail?: string } {
  const text = line.trim().replace(/^-\s*/, '')
  const splitIndex = text.indexOf(' — ')
  if (splitIndex === -1) return { label: text }
  return { label: text.slice(0, splitIndex).trim(), detail: text.slice(splitIndex + 3).trim() }
}

function findFieldLine(lines: string[], field: string): string | null {
  const pattern = new RegExp(`^${field}:\\s*(.+)$`, 'i')
  for (const line of lines) {
    const match = pattern.exec(line.trim())
    if (match) return match[1].trim()
  }
  return null
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|')
}

function parseRange(cell: string): { min: number; max: number } | null {
  const match = /^(\d+)\s*-\s*(\d+)$/.exec(cell.trim())
  if (!match) return null
  return { min: Number(match[1]), max: Number(match[2]) }
}

function parseSubstitutions(cell: string | undefined): string[] | undefined {
  const trimmed = cell?.trim() ?? ''
  if (trimmed === '' || trimmed === '-') return undefined
  const ids = trimmed.split(',').map((id) => id.trim()).filter((id) => id.length > 0)
  return ids.length > 0 ? ids : undefined
}

function parseWeights(cell: string): { start: number | null; max: number | null; step: number | null } | null {
  const parts = cell.trim().split('/')
  if (parts.length !== 3) return null
  const values = parts.map((part) => (part.trim() === '-' ? null : Number(part.trim())))
  if (values.some((value) => value !== null && !Number.isFinite(value))) return null
  return { start: values[0], max: values[1], step: values[2] }
}
