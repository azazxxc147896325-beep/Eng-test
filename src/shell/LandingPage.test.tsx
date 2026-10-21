import { fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { i18n } from '../i18n'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('introduces the product before sending the learner to login', async () => {
    await i18n.changeLanguage('th')
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<main>LOGIN DESTINATION</main>} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    )

    expect(screen.getByRole('heading', { name: /ซ้อม TOEIC ให้รู้ว่า/ })).toBeVisible()
    expect(screen.queryByText(/คะแนนล่าสุด/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /เริ่มฝึกฟรี/ }))
    expect(screen.getByText('LOGIN DESTINATION')).toBeVisible()
  })
})
