import { ContentDraftSchema, type ContentDraft } from './contentSchema'

type ImportFormat = 'json' | 'jsonl' | 'csv'

function csvCells(line: string) {
  const cells: string[] = []; let value = ''; let quoted = false
  for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"' && line[index + 1] === '"' && quoted) { value += '"'; index += 1 } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { cells.push(value); value = '' } else value += char }
  cells.push(value); return cells
}

export function spreadsheetRowsToDrafts(rows: unknown[][]): ContentDraft[] {
  if (rows.length < 2) return []
  if (rows.length - 1 > 200) throw new Error('นำเข้าได้สูงสุด 200 ชุดต่อครั้ง')
  const headers = rows[0].map((value) => String(value).trim().toLowerCase())
  return rows.slice(1).filter((row) => row.some((value) => String(value ?? '').trim())).map((row, index) => {
    const item = Object.fromEntries(headers.map((header, cell) => [header, String(row[cell] ?? '').trim()])); const correct = item.correct.toUpperCase(); const labels = ['A', 'B', 'C', 'D']
    const draft = { groupId: `sheet-${index + 1}`, part: 5 as const, groupType: 'single', difficulty: item.difficulty || 'medium', media: [], questions: [{ id: `sheet-q-${index + 1}`, prompt: { text: item.prompt }, choiceShuffleAllowed: true, choices: labels.map((label) => ({ id: label, label, content: { text: item[`choice_${label.toLowerCase()}`] }, correct: correct === label })), translations: { th: { explanation: item.explanation_th, promptTranslation: item.prompt_translation_th || undefined }, en: { explanation: item.explanation_en } } }] }
    const result = ContentDraftSchema.safeParse(draft); if (!result.success) throw new Error(`แถว ${index + 2}: ${result.error.issues[0]?.message}`); return result.data
  })
}

export function parseImportText(text: string, format: ImportFormat): ContentDraft[] {
  let rows: unknown[]
  if (format === 'csv') return spreadsheetRowsToDrafts(text.split(/\r?\n/).filter(Boolean).map(csvCells))
  const parsed = format === 'json' ? JSON.parse(text) : text.split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line))
  rows = Array.isArray(parsed) ? parsed : [parsed]
  if (rows.length > 200) throw new Error('นำเข้าได้สูงสุด 200 ชุดต่อครั้ง')
  return rows.map((row, index) => { const result = ContentDraftSchema.safeParse(row); if (!result.success) throw new Error(`รายการ ${index + 1}: ${result.error.issues[0]?.message}`); return result.data })
}
