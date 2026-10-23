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
  it('retries queued answers on load and when the browser comes back online', async () => {
    const flushResponses = vi.fn().mockResolvedValue({ saved: 0, pending: 0 })
    const { unmount } = render(<I18nextProvider i18n={i18n}><MemoryRouter><ExamPage snapshot={snapshot}
      queue={{ queueResponse: vi.fn(), flushResponses }} /></MemoryRouter></I18nextProvider>)

    await waitFor(() => expect(flushResponses).toHaveBeenCalledTimes(1))
    window.dispatchEvent(new Event('online'))
    await waitFor(() => expect(flushResponses).toHaveBeenCalledTimes(2))
    unmount()
  })

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

  it('moves from the final Listening question to the server-timed Reading section', async () => {
    const fullSnapshot: AttemptSnapshot = {
      ...snapshot,
      mode: 'full',
      currentSection: 'listening',
      items: [
        { ...snapshot.items[0], section: 'listening', part: 1, prompt: { text: 'Last listening question' } },
        { ...snapshot.items[1], section: 'reading', part: 5, prompt: { text: 'First reading question' } },
      ],
    }
    const readingSnapshot: AttemptSnapshot = {
      ...fullSnapshot, currentSection: 'reading', sectionExpiresAt: '2026-10-20T02:00:00Z',
    }
    const transition = vi.fn().mockResolvedValue(readingSnapshot)
    const repository = { transition } as unknown as import('../data/AttemptRepository').AttemptRepository
    const resultsRepository = { submit: vi.fn(), getResult: vi.fn(), getReview: vi.fn(), listHistory: vi.fn() }
    render(<I18nextProvider i18n={i18n}><MemoryRouter><ExamPage snapshot={fullSnapshot} queue={{ queueResponse: vi.fn() }} repository={repository} resultsRepository={resultsRepository} /></MemoryRouter></I18nextProvider>)

    fireEvent.click(screen.getByRole('button', { name: /เริ่ม Reading|Start Reading/i }))
    await waitFor(() => expect(transition).toHaveBeenCalledWith('attempt-1'))
    expect(await screen.findByText('First reading question')).toBeVisible()
  })

  it('automatically transitions an expired Listening section', async () => {
    const expiredListening: AttemptSnapshot = {
      ...snapshot,
      mode: 'full',
      currentSection: 'listening',
      serverNow: '2026-10-20T01:00:00Z',
      sectionExpiresAt: '2026-10-20T00:45:00Z',
      items: [
        { ...snapshot.items[0], section: 'listening', part: 1 },
        { ...snapshot.items[1], section: 'reading', part: 5 },
      ],
    }
    const transition = vi.fn().mockResolvedValue({
      ...expiredListening, currentSection: 'reading', sectionExpiresAt: '2026-10-20T02:15:00Z',
    })
    const repository = { transition } as unknown as import('../data/AttemptRepository').AttemptRepository

    render(<I18nextProvider i18n={i18n}><MemoryRouter><ExamPage snapshot={expiredListening}
      queue={{ queueResponse: vi.fn() }} repository={repository} /></MemoryRouter></I18nextProvider>)

    await waitFor(() => expect(transition).toHaveBeenCalledWith('attempt-1'))
  })

  it('automatically submits an expired Reading section', async () => {
    const submit = vi.fn().mockResolvedValue({})
    const expiredReading: AttemptSnapshot = {
      ...snapshot,
      mode: 'full',
      currentSection: 'reading',
      serverNow: '2026-10-20T02:00:00Z',
      sectionExpiresAt: '2026-10-20T01:59:00Z',
      items: [{ ...snapshot.items[0], section: 'reading', part: 5 }],
    }
    const resultsRepository = { submit, getResult: vi.fn(), getReview: vi.fn(), listHistory: vi.fn() }

    render(<I18nextProvider i18n={i18n}><MemoryRouter><ExamPage snapshot={expiredReading}
      queue={{ queueResponse: vi.fn() }} resultsRepository={resultsRepository} /></MemoryRouter></I18nextProvider>)

    await waitFor(() => expect(submit).toHaveBeenCalledWith('attempt-1'))
  })

  it('retries an expired submission after connectivity returns', async () => {
    const submit = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({})
    const expiredReading: AttemptSnapshot = {
      ...snapshot,
      mode: 'full',
      currentSection: 'reading',
      serverNow: '2026-10-20T02:00:00Z',
      sectionExpiresAt: '2026-10-20T01:59:00Z',
      items: [{ ...snapshot.items[0], section: 'reading', part: 5 }],
    }
    const resultsRepository = { submit, getResult: vi.fn(), getReview: vi.fn(), listHistory: vi.fn() }
    const { unmount } = render(<I18nextProvider i18n={i18n}><MemoryRouter><ExamPage snapshot={expiredReading}
      queue={{ queueResponse: vi.fn() }} resultsRepository={resultsRepository} /></MemoryRouter></I18nextProvider>)

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1))
    window.dispatchEvent(new Event('online'))
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2))
    unmount()
  })
})
