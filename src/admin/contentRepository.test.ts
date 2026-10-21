import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../shared/supabase/database.types'
import { SupabaseContentRepository } from './contentRepository'

describe('SupabaseContentRepository', () => {
  it('updates prompt text without deleting structured prompt fields', async () => {
    const finalEq = vi.fn().mockResolvedValue({ error: null })
    const firstEq = vi.fn().mockReturnValue({ eq: finalEq })
    const update = vi.fn().mockReturnValue({ eq: firstEq })
    const client = { from: vi.fn().mockReturnValue({ update }) } as unknown as SupabaseClient<Database>
    await new SupabaseContentRepository(client).saveDraft({ id: 'v1', createdBy: 'u1', status: 'draft', part: 7, prompt: 'New text', promptData: { text: 'Old text', documents: [{ title: 'Notice' }] } })
    expect(update).toHaveBeenCalledWith({ prompt: { text: 'New text', documents: [{ title: 'Notice' }] } })
  })
})
