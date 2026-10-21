import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../shared/supabase/database.types'
import { AdminRepository } from './adminRepository'

describe('AdminRepository', () => {
  it('loads a question version directly by id', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: {
      id: 'v1', prompt: { text: 'Prompt' }, difficulty: 'medium', status: 'draft', created_at: '2026-10-20', created_by: 'u1', questions: { part: 5 },
      choices: [
        { id: 'c2', label: 'B', content: { text: 'on' }, is_correct: false, position: 2 },
        { id: 'c1', label: 'A', content: { text: 'at' }, is_correct: true, position: 1 },
      ],
      translations: [
        { locale: 'en', prompt_translation: null, explanation: 'English', transcript: null },
        { locale: 'th', prompt_translation: 'คำแปล', explanation: 'อธิบาย', transcript: null },
      ],
    }, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const client = { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) }) } as unknown as SupabaseClient<Database>
    await expect(new AdminRepository(client).getQuestion('v1')).resolves.toMatchObject({
      id: 'v1', part: 5, prompt: 'Prompt',
      choices: [
        { id: 'c1', label: 'A', text: 'at', correct: true },
        { id: 'c2', label: 'B', text: 'on', correct: false },
      ],
      translations: { th: { promptTranslation: 'คำแปล', explanation: 'อธิบาย' }, en: { promptTranslation: '', explanation: 'English' } },
    })
    expect(eq).toHaveBeenCalledWith('id', 'v1')
  })
})
