import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('edits choices, correct answer, and bilingual explanations in one draft', () => {
    const repository = { saveDraft: vi.fn(), submitForReview: vi.fn(), approve: vi.fn(), publish: vi.fn(), retire: vi.fn() }
    render(<I18nextProvider i18n={i18n}><QuestionEditorPage
      draft={{
        id: 'version-1', createdBy: 'user-1', status: 'draft', part: 5, prompt: 'Old prompt',
        choices: [
          { id: 'a', label: 'A', text: 'at', correct: true },
          { id: 'b', label: 'B', text: 'on', correct: false },
          { id: 'c', label: 'C', text: 'in', correct: false },
          { id: 'd', label: 'D', text: 'by', correct: false },
        ],
        translations: {
          th: { promptTranslation: 'โจทย์แปล', explanation: 'คำอธิบายไทย' },
          en: { promptTranslation: '', explanation: 'English explanation' },
        },
      }}
      currentUserId="user-1" roles={['admin']} repository={repository}
    /></I18nextProvider>)

    expect(screen.getAllByLabelText(/โจทย์|prompt/i).at(-1)).toHaveAttribute('maxlength', '10000')
    expect(screen.getByLabelText(/Choice B|ตัวเลือก B/i)).toHaveAttribute('maxlength', '2000')
    expect(screen.getByLabelText(/Thai explanation|คำอธิบายภาษาไทย/i)).toHaveAttribute('maxlength', '20000')
    fireEvent.change(screen.getByLabelText(/Choice B|ตัวเลือก B/i), { target: { value: 'before' } })
    fireEvent.click(screen.getByLabelText(/Correct answer B|คำตอบที่ถูก B/i))
    fireEvent.change(screen.getByLabelText(/Thai explanation|คำอธิบายภาษาไทย/i), { target: { value: 'คำอธิบายใหม่' } })
    fireEvent.click(screen.getAllByRole('button', { name: /บันทึก Draft|save draft/i }).at(-1)!)

    expect(repository.saveDraft).toHaveBeenCalledWith(expect.objectContaining({
      choices: expect.arrayContaining([
        expect.objectContaining({ id: 'b', text: 'before', correct: true }),
        expect.objectContaining({ id: 'a', correct: false }),
      ]),
      translations: expect.objectContaining({ th: expect.objectContaining({ explanation: 'คำอธิบายใหม่' }) }),
    }))
  })

  it('does not save when a choice is empty', () => {
    const repository = { saveDraft: vi.fn(), submitForReview: vi.fn(), approve: vi.fn(), publish: vi.fn(), retire: vi.fn() }
    render(<I18nextProvider i18n={i18n}><QuestionEditorPage
      draft={{
        id: 'version-2', createdBy: 'user-1', status: 'draft', part: 5, prompt: 'Prompt',
        choices: [
          { id: 'a', label: 'A', text: 'at', correct: true },
          { id: 'b', label: 'B', text: '', correct: false },
          { id: 'c', label: 'C', text: 'in', correct: false },
          { id: 'd', label: 'D', text: 'by', correct: false },
        ],
        translations: { th: { promptTranslation: 'คำแปล', explanation: 'อธิบาย' }, en: { promptTranslation: '', explanation: 'Explanation' } },
      }}
      currentUserId="user-1" roles={['admin']} repository={repository}
    /></I18nextProvider>)

    fireEvent.click(screen.getAllByRole('button', { name: /บันทึก Draft|save draft/i }).at(-1)!)
    expect(repository.saveDraft).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/กรอกข้อมูล|complete all/i)
  })

  it('keeps unsaved edits when the same draft is rendered again', () => {
    const repository = { saveDraft: vi.fn(), submitForReview: vi.fn(), approve: vi.fn(), publish: vi.fn(), retire: vi.fn() }
    const props = { draft: { id: 'version-3', createdBy: 'user-1', status: 'draft' as const, part: 5, prompt: 'Original' }, currentUserId: 'user-1', roles: ['admin'], repository }
    const { rerender } = render(<I18nextProvider i18n={i18n}><QuestionEditorPage {...props} /></I18nextProvider>)
    const prompt = screen.getAllByLabelText(/โจทย์|prompt/i).at(-1)!
    fireEvent.change(prompt, { target: { value: 'Unsaved edit' } })

    rerender(<I18nextProvider i18n={i18n}><QuestionEditorPage {...props} draft={{ ...props.draft }} /></I18nextProvider>)
    expect(screen.getAllByLabelText(/โจทย์|prompt/i).at(-1)).toHaveValue('Unsaved edit')
  })

  it('requires saving changes before submitting for review', async () => {
    const repository = { saveDraft: vi.fn().mockResolvedValue(undefined), submitForReview: vi.fn(), approve: vi.fn(), publish: vi.fn(), retire: vi.fn() }
    render(<I18nextProvider i18n={i18n}><QuestionEditorPage
      draft={{ id: 'version-4', createdBy: 'user-1', status: 'draft', part: 5, prompt: 'Original' }}
      currentUserId="user-1" roles={['admin']} repository={repository}
    /></I18nextProvider>)
    fireEvent.change(screen.getAllByLabelText(/โจทย์|prompt/i).at(-1)!, { target: { value: 'Changed' } })
    const submit = screen.getAllByRole('button', { name: /ส่งตรวจ|submit for review/i }).at(-1)!
    expect(submit).toBeDisabled()

    fireEvent.click(screen.getAllByRole('button', { name: /บันทึก Draft|save draft/i }).at(-1)!)
    await waitFor(() => expect(submit).toBeEnabled())
  })
})
