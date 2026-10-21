import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { QuestionBankPage } from './QuestionBankPage'

describe('QuestionBankPage', () => {
  it('loads questions and filters by prompt', async () => {
    const load = vi.fn().mockResolvedValue([
      { id: 'v1', part: 5, prompt: 'Submit the report by Friday', difficulty: 'medium', status: 'published', createdAt: '2026-10-20', createdBy: 'u1' },
      { id: 'v2', part: 7, prompt: 'Office notice', difficulty: 'hard', status: 'draft', createdAt: '2026-10-20', createdBy: 'u1' },
    ])
    render(<MemoryRouter><I18nextProvider i18n={i18n}><QuestionBankPage loadQuestions={load} /></I18nextProvider></MemoryRouter>)

    expect(await screen.findByText('Submit the report by Friday')).toBeVisible()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'notice' } })
    await waitFor(() => expect(screen.queryByText('Submit the report by Friday')).not.toBeInTheDocument())
    expect(screen.getByText('Office notice')).toBeVisible()
  })
})
