import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { RequireUser } from './RequireUser'

const retry = vi.hoisted(() => vi.fn())

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: null, loading: false, error: true, retry }),
}))

afterEach(() => { cleanup(); retry.mockClear() })

describe('RequireUser', () => {
  it('shows a retry action instead of redirecting when session loading fails', () => {
    render(<I18nextProvider i18n={i18n}><MemoryRouter><RequireUser><p>Private page</p></RequireUser></MemoryRouter></I18nextProvider>)

    expect(screen.getByRole('alert')).toHaveTextContent(/เชื่อมต่อ|connect/i)
    fireEvent.click(screen.getByRole('button', { name: /ลองใหม่|retry/i }))
    expect(retry).toHaveBeenCalledOnce()
    expect(screen.queryByText('Private page')).not.toBeInTheDocument()
  })
})
