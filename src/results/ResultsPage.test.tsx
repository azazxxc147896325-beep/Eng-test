import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { i18n } from '../i18n'
import { ResultsPage } from './ResultsPage'
import { MemoryRouter } from 'react-router-dom'

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
})
