import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../../shared/supabase/database.types'
import { SupabaseQuestionRepository } from './SupabaseQuestionRepository'

describe('SupabaseQuestionRepository', () => {
  it('validates and maps active fields without requesting answers or explanations', async () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000001',
      prompt: { text: 'Prompt' },
      difficulty: 'medium',
      choice_shuffle_allowed: true,
      group_id: null,
      questions: { part: 5 },
      question_groups: null,
      choices: [{
        id: '00000000-0000-4000-8000-000000000002', label: 'A', content: { text: 'Choice' }, position: 1,
      }],
      media: [],
    }
    const resolved = Promise.resolve({ data: [row], error: null })
    const query: Record<string, unknown> = {}
    for (const method of ['eq', 'order', 'limit', 'in']) query[method] = vi.fn(() => query)
    query.then = resolved.then.bind(resolved)
    const select = vi.fn((_fields: string) => query)
    const client = { from: vi.fn(() => ({ select })) } as unknown as SupabaseClient<Database>

    const groups = await new SupabaseQuestionRepository(client).listEligible({ parts: [5] })
    const selectedFields = select.mock.calls[0][0]

    expect(selectedFields).not.toMatch(/solution|is_correct|explanation/)
    expect(groups[0]).toMatchObject({
      id: `question:${row.id}`,
      part: 5,
      questions: [{ questionVersionId: row.id }],
    })
  })
})
