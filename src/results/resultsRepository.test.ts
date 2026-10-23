import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../shared/supabase/database.types'
import { ReviewUnavailableError, SupabaseResultsRepository } from './resultsRepository'

describe('SupabaseResultsRepository', () => {
  it('submits an attempt and returns its result', async () => {
    const result = { mode: 'practice', accuracy: 80 }
    const invoke = vi.fn().mockResolvedValue({ data: { result }, error: null })
    const client = { functions: { invoke } } as unknown as SupabaseClient<Database>

    await expect(new SupabaseResultsRepository(client).submit('attempt-1')).resolves.toEqual(result)
    expect(invoke).toHaveBeenCalledWith('submit-attempt', { body: { action: 'submit', attemptId: 'attempt-1' } })
  })

  it('maps a pre-submit review rejection to an explicit error', async () => {
    const response = new Response('{"code":"review_unavailable"}', { status: 409 })
    const client = { functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: { context: response } }) } } as unknown as SupabaseClient<Database>

    await expect(new SupabaseResultsRepository(client).getReview('attempt-1')).rejects.toBeInstanceOf(ReviewUnavailableError)
  })
})
