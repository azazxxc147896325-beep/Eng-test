import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../../shared/supabase/database.types'
import { ExistingAttemptError, InsufficientQuestionPoolError, SupabaseAttemptRepository } from './SupabaseAttemptRepository'

const snapshot = {
  id: 'attempt-1', mode: 'quick', status: 'in_progress', locale: 'th', seed: 'server-seed',
  currentSection: 'listening', startedAt: '2026-10-20T00:00:00Z', sectionExpiresAt: '2026-10-20T00:12:00Z',
  items: [{ ordinal: 1, section: 'listening', part: 1, groupId: null, questionVersionId: 'qv-1',
    prompt: { text: 'Question' }, media: [], choices: [{ id: 'c-1', label: 'A', content: { text: 'Choice' } }],
    choiceOrder: ['c-1'], choiceShuffleAllowed: false }],
}

describe('SupabaseAttemptRepository', () => {
  it('creates and resumes the exact server snapshot without solution fields', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: snapshot, error: null })
    const client = { functions: { invoke } } as unknown as SupabaseClient<Database>
    const repository = new SupabaseAttemptRepository(client)

    await expect(repository.create({ mode: 'quick', locale: 'th', idempotencyKey: 'key-1' })).resolves.toEqual(snapshot)
    await expect(repository.resume('attempt-1')).resolves.toEqual(snapshot)
    expect(JSON.stringify(snapshot)).not.toMatch(/solution|explanation|isCorrect/)
    expect(invoke).toHaveBeenLastCalledWith('create-attempt', { body: { action: 'resume', attemptId: 'attempt-1' } })
  })

  it.each([
    ['insufficient_pool', InsufficientQuestionPoolError],
    ['existing_attempt', ExistingAttemptError],
  ])('maps a 409 %s response to a typed error', async (code, ErrorType) => {
    const response = new Response(JSON.stringify({ code }), { status: 409 })
    const client = { functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: { context: response } }) } } as unknown as SupabaseClient<Database>

    await expect(new SupabaseAttemptRepository(client).create({ mode: 'full', locale: 'en', idempotencyKey: 'key' }))
      .rejects.toBeInstanceOf(ErrorType)
  })
})
