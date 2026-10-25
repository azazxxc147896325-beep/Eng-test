import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { ResultsPage } from './ResultsPage'
import { MemoryRouter } from 'react-router-dom'

afterEach(cleanup)

describe('ResultsPage', () => {
  it('labels a Full Test score as an estimate and shows weak Parts', async () => {
    await i18n.changeLanguage('th')
    render(<I18nextProvider i18n={i18n}><MemoryRouter><ResultsPage attemptId="a1" result={{
      mode: 'full', scoringVersion: 'sq-v1', section: { listening: 350, reading: 300 }, total: 650,
      range: null, accuracy: 66, skills: {}, parts: [{ part: 5, correct: 12, total: 30, accuracy: 40 }], weakParts: [5],
    }} /></MemoryRouter></I18nextProvider>)

    expect(screen.getAllByText(/คะแนนประมาณการ|estimated score/i)[0]).toBeVisible()
    expect(screen.getByText('650')).toBeVisible()
    expect(screen.getAllByText(/Part 5/)[0]).toBeVisible()
    expect(screen.getByRole('button', { name: /ดูเฉลย/ })).toBeVisible()
  })

  it('can retry after result loading fails', async () => {
    const result = { mode: 'full' as const, scoringVersion: 'sq-v1', section: { listening: 350, reading: 300 }, total: 650, range: null, accuracy: 66, skills: {}, parts: [], weakParts: [] }
    const getResult = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(result)
    const repository = { getResult, submit: vi.fn(), getReview: vi.fn(), listHistory: vi.fn() }
    render(<I18nextProvider i18n={i18n}><MemoryRouter><ResultsPage attemptId="a1" repository={repository} /></MemoryRouter></I18nextProvider>)

    expect(await screen.findByRole('alert')).toHaveTextContent(/โหลดผลสอบไม่สำเร็จ|could not load/i)
    fireEvent.click(screen.getByRole('button', { name: /ลองใหม่|retry/i }))
    expect(await screen.findByText('650')).toBeVisible()
    expect(getResult).toHaveBeenCalledTimes(2)
  })
})
