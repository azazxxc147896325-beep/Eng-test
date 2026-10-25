import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { ReviewPage } from './ReviewPage'

afterEach(cleanup)

describe('ReviewPage', () => {
  it('keeps the English prompt and shows Thai explanation and Listening transcript after submit', async () => {
    await i18n.changeLanguage('th')
    render(<I18nextProvider i18n={i18n}><MemoryRouter><ReviewPage review={{
      attemptId: 'a1', status: 'submitted', locale: 'th', items: [{
        ordinal: 1, part: 2, prompt: { text: 'When will the package arrive?' }, selectedChoiceId: 'c1', correctChoiceId: 'c2',
        choices: [{ id: 'c1', label: 'A', content: { text: 'Yesterday.' } }, { id: 'c2', label: 'B', content: { text: 'By Friday.' } }],
        explanation: { th: 'คำตอบกล่าวถึงกำหนดเวลาในอนาคต', en: 'The answer gives a future deadline.' },
        promptTranslation: 'พัสดุจะมาถึงเมื่อไร', transcript: 'When will the package arrive? By Friday.',
      }],
    }} /></MemoryRouter></I18nextProvider>)

    expect(screen.getByText('When will the package arrive?')).toBeVisible()
    expect(screen.getByText('คำตอบกล่าวถึงกำหนดเวลาในอนาคต')).toBeVisible()
    fireEvent.click(screen.getByText('บทถอดเสียง'))
    expect(screen.getAllByText(/By Friday/).at(-1)).toBeVisible()
  })

  it('can retry after review loading fails', async () => {
    const review = { attemptId: 'a1', status: 'submitted', locale: 'th', items: [] }
    const getReview = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(review)
    const repository = { getReview, submit: vi.fn(), getResult: vi.fn(), listHistory: vi.fn() }
    render(<I18nextProvider i18n={i18n}><MemoryRouter><ReviewPage repository={repository} /></MemoryRouter></I18nextProvider>)

    expect(await screen.findByRole('alert')).toHaveTextContent(/โหลดผลสอบไม่สำเร็จ|could not load/i)
    fireEvent.click(screen.getByRole('button', { name: /ลองใหม่|retry/i }))
    expect(await screen.findByRole('heading', { name: /ตรวจคำตอบ|review/i })).toBeVisible()
    expect(getReview).toHaveBeenCalledTimes(2)
  })
})
