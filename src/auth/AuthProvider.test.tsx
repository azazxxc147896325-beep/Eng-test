import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../shared/supabase/database.types'
import { AuthProvider, useAuth } from './AuthProvider'

function Harness() {
  const { loading, signInWithGoogle } = useAuth()
  return (
    <button disabled={loading} onClick={() => void signInWithGoogle()}>
      Google
    </button>
  )
}

describe('AuthProvider', () => {
  it('starts a mobile-safe Google OAuth redirect', async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null })
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
        signInWithOAuth,
        signOut: vi.fn(),
      },
    } as unknown as SupabaseClient<Database>

    render(
      <AuthProvider client={client}>
        <Harness />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByRole('button')).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Google' }))

    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({ redirectTo: expect.stringContaining('/auth/callback') }),
      }),
    )
  })
})
