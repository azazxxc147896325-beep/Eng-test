import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'admin-1' }, roles: ['admin'], loading: false, signOut: vi.fn() }) }))

describe('AppShell', () => {
  it('shows the admin entry to administrators', () => {
    render(<MemoryRouter><AppShell /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute('href', '/admin')
  })
})
