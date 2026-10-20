import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '../i18n'
import { RequireRole } from './RequireRole'

const authState = vi.hoisted(() => ({
  user: { id: 'user-1' },
  profile: null,
  roles: ['user'],
  loading: false,
}))

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    ...authState,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  }),
}))

describe('RequireRole', () => {
  it('blocks a signed-in user without the requested role', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <RequireRole role="admin">
            <p>Admin tools</p>
          </RequireRole>
        </MemoryRouter>
      </I18nextProvider>,
    )

    expect(screen.getByText(/ไม่มีสิทธิ์|not authorized/i)).toBeVisible()
    expect(screen.queryByText('Admin tools')).not.toBeInTheDocument()
  })
})
