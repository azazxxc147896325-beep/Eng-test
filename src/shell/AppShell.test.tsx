import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { AppShell } from './AppShell'

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { email: 'learner@example.com' },
    profile: { display_name: 'Learner' },
    roles: ['user'], loading: false, signOut: vi.fn(),
  }),
}))

describe('AppShell', () => {
  it('shows learner navigation without exposing admin navigation', async () => {
    await i18n.changeLanguage('th')
    render(<I18nextProvider i18n={i18n}><MemoryRouter initialEntries={['/home']}><Routes><Route path="/" element={<AppShell />}><Route path="home" element={<main>HOME</main>} /></Route></Routes></MemoryRouter></I18nextProvider>)

    expect(screen.getAllByRole('link', { name: /หน้าหลัก/ }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /ข้อสอบ/ }).length).toBeGreaterThan(0)
    expect(screen.getByText('Learner')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })
})
