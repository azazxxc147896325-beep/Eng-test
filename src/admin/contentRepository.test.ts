import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../shared/supabase/database.types'
import { SupabaseContentRepository } from './contentRepository'

describe('SupabaseContentRepository', () => {
  it('saves prompt, choices, and translations through one atomic RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    const client = { rpc } as unknown as SupabaseClient<Database>
    await new SupabaseContentRepository(client).saveDraft({
      id: 'v1', createdBy: 'u1', status: 'draft', part: 7, prompt: 'New text', promptData: { text: 'Old text', documents: [{ title: 'Notice' }] },
      choices: [
        { id: 'c1', label: 'A', text: 'First', correct: true },
        { id: 'c2', label: 'B', text: 'Second', correct: false },
      ],
      translations: { th: { promptTranslation: 'คำแปล', explanation: 'อธิบาย' }, en: { promptTranslation: '', explanation: 'Explanation' } },
    })
    expect(rpc).toHaveBeenCalledWith('update_question_draft', {
      p_question_version_id: 'v1',
      p_payload: {
        prompt: { text: 'New text', documents: [{ title: 'Notice' }] },
        choices: [
          { id: 'c1', label: 'A', text: 'First', correct: true },
          { id: 'c2', label: 'B', text: 'Second', correct: false },
        ],
        translations: { th: { promptTranslation: 'คำแปล', explanation: 'อธิบาย' }, en: { promptTranslation: '', explanation: 'Explanation' } },
      },
    })
  })
})
