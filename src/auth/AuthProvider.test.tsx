import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

function RecoveryHarness() {
  const { error, loading, retry, signOut } = useAuth()
  return <main>{loading ? 'loading' : error ? <p role="alert">session failed</p> : 'ready'}<button onClick={() => void retry()}>retry session</button><button onClick={() => void signOut()}>sign out</button></main>
}

afterEach(cleanup)

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

  it('leaves the loading state and can retry after session recovery fails', async () => {
    const getSession = vi.fn()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ data: { session: null }, error: null })
    const client = {
      auth: {
        getSession,
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
      },
    } as unknown as SupabaseClient<Database>

    render(<AuthProvider client={client}><RecoveryHarness /></AuthProvider>)

    expect(await screen.findByRole('alert')).toHaveTextContent('session failed')
    fireEvent.click(screen.getByRole('button', { name: 'retry session' }))
    await waitFor(() => expect(screen.getByText('ready')).toBeVisible())
  })

  it('shows a recoverable state when signing out fails', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn().mockRejectedValue(new Error('network unavailable')),
      },
    } as unknown as SupabaseClient<Database>

    render(<AuthProvider client={client}><RecoveryHarness /></AuthProvider>)

    await waitFor(() => expect(screen.getByText('ready')).toBeVisible())
    fireEvent.click(screen.getByRole('button', { name: 'sign out' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('session failed')
  })
})
