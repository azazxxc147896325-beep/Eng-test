import { fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { QuestionEditorPage } from './QuestionEditorPage'

describe('QuestionEditorPage', () => {
  it('never offers approval to the content creator', () => {
    render(<I18nextProvider i18n={i18n}><QuestionEditorPage
      draft={{ id: 'version-1', createdBy: 'user-1', status: 'in_review', part: 5, prompt: 'Question preview' }}
      currentUserId="user-1"
      roles={['reviewer']}
      repository={{ saveDraft: vi.fn(), submitForReview: vi.fn(), approve: vi.fn(), publish: vi.fn(), retire: vi.fn() }}
    /></I18nextProvider>)

    expect(screen.queryByRole('button', { name: /อนุมัติ|approve/i })).not.toBeInTheDocument()
    expect(screen.getByText('Question preview')).toBeVisible()
  })

  it('saves the edited prompt for an owned draft', () => {
    const repository = { saveDraft: vi.fn(), submitForReview: vi.fn(), approve: vi.fn(), publish: vi.fn(), retire: vi.fn() }
    render(<I18nextProvider i18n={i18n}><QuestionEditorPage
      draft={{ id: 'version-1', createdBy: 'user-1', status: 'draft', part: 5, prompt: 'Old prompt' }}
      currentUserId="user-1" roles={['admin']} repository={repository}
    /></I18nextProvider>)
    fireEvent.change(screen.getAllByLabelText(/โจทย์|prompt/i).at(-1)!, { target: { value: 'New prompt' } })
    fireEvent.click(screen.getAllByRole('button', { name: /บันทึก Draft|save draft/i }).at(-1)!)
    expect(repository.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'New prompt' }))
  })
})
