import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { GenerateQuestionsPanel } from './GenerateQuestionsPanel'

describe('GenerateQuestionsPanel', () => {
  it('previews AI output and saves only after explicit confirmation', async () => {
    const save = vi.fn()
    const generate = vi.fn().mockResolvedValue([{ status: 'draft', content: {
      groupId: 'g1', part: 5, groupType: 'single_question', difficulty: 'medium', media: [],
      questions: [{
        id: 'q1', prompt: { text: 'Question preview' }, choiceShuffleAllowed: true,
        choices: [
          { id: 'a', label: 'A', content: { text: 'at' }, correct: true },
          { id: 'b', label: 'B', content: { text: 'on' }, correct: false },
          { id: 'c', label: 'C', content: { text: 'in' }, correct: false },
          { id: 'd', label: 'D', content: { text: 'for' }, correct: false },
        ],
        translations: {
          th: { explanation: 'ใช้ at กับเวลาที่เฉพาะเจาะจง', promptTranslation: 'คำแปลโจทย์' },
          en: { explanation: 'Use at for a specific time.' },
        },
      }],
    } }])
    render(<I18nextProvider i18n={i18n}><GenerateQuestionsPanel generate={generate} saveDraft={save} /></I18nextProvider>)

    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /สร้างตัวอย่าง|generate preview/i }))
    expect(await screen.findByText(/Question preview/)).toBeVisible()
    expect(screen.getByRole('list', { name: /ตัวเลือก|choices/i }).tagName).toBe('UL')
    expect(screen.getByText('A. at')).toBeVisible()
    expect(screen.getByLabelText(/คำตอบที่ถูก|correct answer/i)).toHaveTextContent('A. at')
    expect(screen.getByText('ใช้ at กับเวลาที่เฉพาะเจาะจง')).toBeVisible()
    expect(screen.getByText('Use at for a specific time.')).toBeVisible()
    expect(save).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /บันทึก Draft|save draft/i }))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
  })
})
