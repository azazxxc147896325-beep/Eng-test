import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { ImportPage } from './ImportPage'

const draft = { groupId: 'g1', part: 5, groupType: 'single', difficulty: 'medium', media: [], questions: [{ id: 'q1', prompt: { text: 'Question' }, choiceShuffleAllowed: true, choices: ['A','B','C','D'].map((label, index) => ({ id: label, label, content: { text: label }, correct: index === 0 })), translations: { th: { explanation: 'คำอธิบาย' }, en: { explanation: 'Explanation' } } }] }

describe('ImportPage', () => {
  it('saves every validated draft in one batch call', async () => {
    const saveDrafts = vi.fn().mockResolvedValue(undefined)
    render(<I18nextProvider i18n={i18n}><ImportPage saveDrafts={saveDrafts} /></I18nextProvider>)
    fireEvent.change(screen.getByLabelText('JSONL'), { target: { value: JSON.stringify(draft) } })
    fireEvent.click(screen.getByRole('button', { name: /ตรวจไฟล์|validate/i }))
    fireEvent.click(await screen.findByRole('button', { name: /บันทึก Draft ทั้งหมด|save all/i }))
    await waitFor(() => expect(saveDrafts).toHaveBeenCalledWith([expect.objectContaining({ groupId: 'g1' })]))
  })
})
