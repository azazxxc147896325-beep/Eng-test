import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { SettingsPage } from './SettingsPage'

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'learner@example.com' }, profile: { display_name: 'Learner', target_score: 750 }, signOut: vi.fn() }),
}))

describe('SettingsPage', () => {
  it('saves a valid target score', async () => {
    await i18n.changeLanguage('th')
    const saveTarget = vi.fn().mockResolvedValue(undefined)
    render(<I18nextProvider i18n={i18n}><MemoryRouter><SettingsPage saveTarget={saveTarget} /></MemoryRouter></I18nextProvider>)

    fireEvent.change(screen.getByLabelText(/คะแนนเป้าหมาย/), { target: { value: '850' } })
    fireEvent.click(screen.getByRole('button', { name: /บันทึก/ }))

    await waitFor(() => expect(saveTarget).toHaveBeenCalledWith(850))
    expect(screen.getByRole('status')).toHaveTextContent(/บันทึกแล้ว/)
  })
})
