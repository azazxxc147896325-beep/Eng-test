import { describe, expect, it } from 'vitest'
import { readPublicEnv } from './env'

describe('readPublicEnv', () => {
  it('returns valid public Supabase settings', () => {
    expect(
      readPublicEnv({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'public-key',
      }),
    ).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'public-key',
    })
  })

  it('rejects missing public settings', () => {
    expect(() => readPublicEnv({})).toThrow('Missing VITE_SUPABASE_URL')
  })
})
