import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { i18n } from '../i18n'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('shows the primary play action', async () => {
    await i18n.changeLanguage('th')
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </I18nextProvider>,
    )

    expect(screen.getByRole('button', { name: /เล่น/ })).toBeVisible()
  })
})
