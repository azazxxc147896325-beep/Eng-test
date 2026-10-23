import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '../../i18n'
import type { AttemptSnapshot } from '../data/AttemptRepository'
import { ExamPage } from './ExamPage'

const snapshot: AttemptSnapshot = {
  id: 'attempt-1', mode: 'practice', status: 'in_progress', locale: 'th', seed: 'seed',
  currentSection: 'practice', serverNow: '2026-10-20T00:00:00Z', startedAt: '2026-10-20T00:00:00Z', sectionExpiresAt: null,
  items: [1, 2].map((ordinal) => ({
    attemptItemId: `item-${ordinal}`, ordinal, section: 'practice' as const, part: 5 as const,
    groupId: null, questionVersionId: `q-${ordinal}`, prompt: { text: `Question ${ordinal}` }, media: [],
    choices: ['A', 'B'].map((label) => ({ id: `${ordinal}-${label}`, label, content: { text: `Choice ${label}` } })),
    choiceOrder: [`${ordinal}-A`, `${ordinal}-B`], choiceShuffleAllowed: true,
  })),
}

describe('ExamPage', () => {
  it('autosaves a choice and supports next/previous navigation', async () => {
    const queueResponse = vi.fn().mockResolvedValue({ accepted: true })
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <ExamPage snapshot={snapshot} queue={{ queueResponse }} />
        </MemoryRouter>
      </I18nextProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: /Choice A/ }))
    await waitFor(() => expect(queueResponse).toHaveBeenCalledWith(
      expect.objectContaining({ attemptItemId: 'item-1', choiceId: '1-A' }), null,
    ))
    fireEvent.click(screen.getByRole('button', { name: /ถัดไป|next/i }))
    expect(screen.getByText('Question 2')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /ย้อนกลับ|previous/i }))
    expect(screen.getByText('Question 1')).toBeVisible()
  })

  it('submits from the final question and opens the result', async () => {
    const submit = vi.fn().mockResolvedValue({})
    const resultsRepository = { submit, getResult: vi.fn(), getReview: vi.fn(), listHistory: vi.fn() }
    render(<I18nextProvider i18n={i18n}><MemoryRouter><ExamPage snapshot={{ ...snapshot, items: [snapshot.items[0]] }} queue={{ queueResponse: vi.fn() }} resultsRepository={resultsRepository} /></MemoryRouter></I18nextProvider>)

    fireEvent.click(screen.getByRole('button', { name: /ส่งคำตอบ|submit/i }))
    await waitFor(() => expect(submit).toHaveBeenCalledWith('attempt-1'))
  })
})
