import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../../shared/supabase/database.types'
import { SupabaseResponseRepository } from './SupabaseResponseRepository'

describe('SupabaseResponseRepository', () => {
  it('saves through the server-authoritative response RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    const client = { rpc } as unknown as SupabaseClient<Database>
    const repository = new SupabaseResponseRepository(client)

    await repository.save({
      attemptId: 'attempt-1', attemptItemId: 'item-1', questionVersionId: 'question-1',
      choiceId: 'choice-1', marked: true, answeredAt: '2026-10-20T00:01:00Z',
    })

    expect(rpc).toHaveBeenCalledWith('save_attempt_response', {
      p_attempt_id: 'attempt-1', p_attempt_item_id: 'item-1', p_choice_id: 'choice-1', p_marked: true,
    })
  })
})
