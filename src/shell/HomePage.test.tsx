import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { i18n } from '../i18n'
import { HomePage } from './HomePage'
import type { HistoryEntry } from '../results/resultsRepository'

describe('HomePage', () => {
  it('shows the primary play action', async () => {
    await i18n.changeLanguage('th')
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <HomePage history={[]} />
        </MemoryRouter>
      </I18nextProvider>,
    )

    expect(screen.getByRole('button', { name: /เล่น/ })).toBeVisible()
  })

  it('shows the learner latest verified score instead of a placeholder score', async () => {
    const history: HistoryEntry[] = [
      { attemptId: 'a1', mode: 'full', timingUnverified: false, submittedAt: '2026-10-01T00:00:00Z', total: 680, listening: 350, reading: 330 },
      { attemptId: 'a2', mode: 'full', timingUnverified: false, submittedAt: '2026-10-08T00:00:00Z', total: 710, listening: 370, reading: 340 },
    ]
    render(<I18nextProvider i18n={i18n}><MemoryRouter><HomePage history={history} /></MemoryRouter></I18nextProvider>)

    expect(screen.getAllByText('710')[0]).toBeVisible()
    expect(screen.getByText(/\+30/)).toBeVisible()
  })
})
