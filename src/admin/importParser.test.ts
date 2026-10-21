import { describe, expect, it } from 'vitest'
import { parseImportText, spreadsheetRowsToDrafts } from './importParser'

const draft = { groupId: 'g1', part: 5, groupType: 'single', difficulty: 'medium', media: [], questions: [{ id: 'q1', prompt: { text: 'Question' }, choiceShuffleAllowed: true, choices: ['A','B','C','D'].map((label, index) => ({ id: label, label, content: { text: label }, correct: index === 0 })), translations: { th: { explanation: 'คำอธิบาย' }, en: { explanation: 'Explanation' } } }] }

describe('importParser', () => {
  it('parses JSON and JSONL drafts', () => {
    expect(parseImportText(JSON.stringify([draft]), 'json')).toHaveLength(1)
    expect(parseImportText(`${JSON.stringify(draft)}\n${JSON.stringify({ ...draft, groupId: 'g2' })}`, 'jsonl')).toHaveLength(2)
  })

  it('converts the Part 5 spreadsheet template', () => {
    const rows = [['difficulty','prompt','choice_a','choice_b','choice_c','choice_d','correct','explanation_th','explanation_en'], ['medium','The report is due ____ Friday.','by','until','since','during','A','ภายในวันศุกร์','By shows a deadline']]
    expect(spreadsheetRowsToDrafts(rows)[0].questions[0].choices[0].correct).toBe(true)
  })

  it('rejects imports over 200 groups', () => {
    expect(() => parseImportText(Array.from({ length: 201 }, () => JSON.stringify(draft)).join('\n'), 'jsonl')).toThrow(/200/)
  })
})
