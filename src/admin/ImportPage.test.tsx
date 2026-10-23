import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { ImportPage } from './ImportPage'
import { parseImportText } from './importParser'

const draft = { groupId: 'g1', part: 5, groupType: 'single', difficulty: 'medium', media: [], questions: [{ id: 'q1', prompt: { text: 'Question' }, choiceShuffleAllowed: true, choices: ['A','B','C','D'].map((label, index) => ({ id: label, label, content: { text: label }, correct: index === 0 })), translations: { th: { explanation: 'คำอธิบาย' }, en: { explanation: 'Explanation' } } }] }

afterEach(cleanup)

describe('ImportPage', () => {
  it.each([1, 2, 3, 4, 5, 6, 7])('provides a valid JSON template for Part %i', (part) => {
    render(<I18nextProvider i18n={i18n}><ImportPage /></I18nextProvider>)
    fireEvent.change(screen.getByLabelText('Template Part'), { target: { value: String(part) } })
    fireEvent.click(screen.getByRole('button', { name: /ใช้ตัวอย่าง|use example/i }))

    const template = (screen.getByLabelText('JSONL') as HTMLTextAreaElement).value
    expect(parseImportText(template, 'json')[0].part).toBe(part)
  })

  it('offers downloadable JSON and Part 5 CSV templates', () => {
    render(<I18nextProvider i18n={i18n}><ImportPage /></I18nextProvider>)

    expect(screen.getByRole('link', { name: /ดาวน์โหลด JSON|download JSON/i })).toHaveAttribute('download', 'score-quest-part-5-template.json')
    expect(screen.getByRole('link', { name: /ดาวน์โหลด CSV|download CSV/i })).toHaveAttribute('download', 'score-quest-part-5-template.csv')
  })

  it('saves every validated draft in one batch call', async () => {
    const saveDrafts = vi.fn().mockResolvedValue(undefined)
    render(<I18nextProvider i18n={i18n}><ImportPage saveDrafts={saveDrafts} /></I18nextProvider>)
    fireEvent.change(screen.getByLabelText('JSONL'), { target: { value: JSON.stringify(draft) } })
    fireEvent.click(screen.getByRole('button', { name: /ตรวจไฟล์|validate/i }))
    fireEvent.click(await screen.findByRole('button', { name: /บันทึก Draft ทั้งหมด|save all/i }))
    await waitFor(() => expect(saveDrafts).toHaveBeenCalledWith([expect.objectContaining({ groupId: 'g1' })]))
  })
})
