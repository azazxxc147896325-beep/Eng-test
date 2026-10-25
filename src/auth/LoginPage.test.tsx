import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { Database } from '../shared/supabase/database.types'
import { AuthProvider } from './AuthProvider'
import { LoginPage } from './LoginPage'
import '../i18n'

afterEach(cleanup)

describe('LoginPage', () => {
  it('prevents duplicate Google login requests while redirecting', async () => {
    const signInWithOAuth = vi.fn(() => new Promise(() => undefined))
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signInWithOAuth,
        signOut: vi.fn(),
      },
    } as unknown as SupabaseClient<Database>

    render(<MemoryRouter><AuthProvider client={client}><LoginPage /></AuthProvider></MemoryRouter>)
    const button = await screen.findByRole('button', { name: /Google/i })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)

    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(signInWithOAuth).toHaveBeenCalledOnce()
  })
})
