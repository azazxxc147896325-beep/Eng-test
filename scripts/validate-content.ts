import { pathToFileURL } from 'node:url'
import { readFile } from 'node:fs/promises'
import { ContentDraftSchema, type ContentDraft } from '../src/admin/contentSchema'

export type ContentValidationError = { row: number; groupId: string; path: string; message: string }

function csvCells(line: string) {
  const cells: string[] = []; let value = ''; let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"' && line[index + 1] === '"' && quoted) { value += '"'; index += 1 }
    else if (character === '"') quoted = !quoted
    else if (character === ',' && !quoted) { cells.push(value); value = '' }
    else value += character
  }
  cells.push(value)
  return cells
}

function parseRows(text: string, format: 'jsonl' | 'csv'): unknown[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (format === 'jsonl') return lines.map((line) => JSON.parse(line))
  if (!lines.length) return []
  const headers = csvCells(lines[0])
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => {
    const value = csvCells(line)[index] ?? ''
    if (['part'].includes(header)) return [header, Number(value)]
    if (['media', 'questions'].includes(header)) return [header, JSON.parse(value)]
    return [header, value]
  })))
}

export function validateContentText(text: string, format: 'jsonl' | 'csv') {
  const errors: ContentValidationError[] = []; const drafts: ContentDraft[] = []
  let rows: unknown[]
  try { rows = parseRows(text, format) } catch (error) {
    return { valid: false, drafts, errors: [{ row: 1, groupId: 'unknown', path: '$', message: `Invalid ${format.toUpperCase()}: ${(error as Error).message}` }] }
  }
  rows.forEach((row, index) => {
    const result = ContentDraftSchema.safeParse(row)
    if (result.success) drafts.push(result.data)
    else result.error.issues.forEach((issue) => errors.push({
      row: index + 1,
      groupId: typeof row === 'object' && row && 'groupId' in row ? String(row.groupId) : 'unknown',
      path: issue.path.join('.') || '$',
      message: `${issue.message}; fix ${issue.path.join('.') || 'this row'}`,
    }))
  })
  return { valid: errors.length === 0, drafts, errors }
}

async function main() {
  const file = process.argv[2]
  if (!file) throw new Error('Usage: npm run content:validate -- file.jsonl')
  const format = file.toLowerCase().endsWith('.csv') ? 'csv' : 'jsonl'
  const result = validateContentText(await readFile(file, 'utf8'), format)
  if (!result.valid) {
    result.errors.forEach((error) => console.error(`row ${error.row} [${error.groupId}] ${error.path}: ${error.message}`))
    process.exitCode = 1
  } else console.log(`Valid: ${result.drafts.length} content group(s)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main()
