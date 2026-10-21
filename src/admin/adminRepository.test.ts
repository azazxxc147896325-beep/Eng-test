import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../shared/supabase/database.types'
import { AdminRepository } from './adminRepository'

describe('AdminRepository', () => {
  it('loads a question version directly by id', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'v1', prompt: { text: 'Prompt' }, difficulty: 'medium', status: 'draft', created_at: '2026-10-20', created_by: 'u1', questions: { part: 5 } }, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const client = { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) }) } as unknown as SupabaseClient<Database>
    await expect(new AdminRepository(client).getQuestion('v1')).resolves.toMatchObject({ id: 'v1', part: 5, prompt: 'Prompt' })
    expect(eq).toHaveBeenCalledWith('id', 'v1')
  })
})
