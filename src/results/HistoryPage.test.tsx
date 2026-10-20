import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { i18n } from '../i18n'
import { HistoryPage } from './HistoryPage'

describe('HistoryPage', () => {
  it('charts only verified Full Tests and provides a readable table and comparison', () => {
    render(<I18nextProvider i18n={i18n}><MemoryRouter><HistoryPage history={[
      { attemptId: 'a1', mode: 'full', timingUnverified: false, submittedAt: '2026-10-01T00:00:00Z', total: 600, listening: 300, reading: 300 },
      { attemptId: 'a2', mode: 'practice', timingUnverified: false, submittedAt: '2026-10-05T00:00:00Z', total: null, listening: null, reading: null },
      { attemptId: 'a3', mode: 'full', timingUnverified: true, submittedAt: '2026-10-08T00:00:00Z', total: 900, listening: 450, reading: 450 },
      { attemptId: 'a4', mode: 'full', timingUnverified: false, submittedAt: '2026-10-10T00:00:00Z', total: 650, listening: 330, reading: 320 },
    ]} /></MemoryRouter></I18nextProvider>)

    expect(screen.getByText(/\+50/)).toBeVisible()
    expect(screen.getByRole('img', { name: /progress|พัฒนาการ/i })).toBeVisible()
    expect(screen.getByRole('table')).toBeVisible()
    expect(screen.queryByText('900')).not.toBeInTheDocument()
  })
})
