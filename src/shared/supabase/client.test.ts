// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from './client'

describe('createBrowserClient', () => {
  it('creates a Supabase client from public settings', () => {
    const client = createBrowserClient({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'public-key',
    })

    expect(client.auth).toBeDefined()
  })
})
