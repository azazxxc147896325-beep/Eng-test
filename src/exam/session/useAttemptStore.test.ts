import { describe, expect, it, vi } from 'vitest'
import type { AttemptSnapshot } from '../data/AttemptRepository'
import { createAttemptStore } from './useAttemptStore'

const snapshot: AttemptSnapshot = {
  id: 'attempt-1', mode: 'full', status: 'in_progress', locale: 'th', seed: 'server-seed',
  currentSection: 'listening', serverNow: '2026-10-20T00:00:00Z', startedAt: '2026-10-20T00:00:00Z', sectionExpiresAt: '2026-10-20T00:45:00Z',
  items: [
    { attemptItemId: 'i1', ordinal: 1, section: 'listening', part: 1, groupId: null, questionVersionId: 'q1', prompt: {}, media: [], choices: [], choiceOrder: [], choiceShuffleAllowed: false },
    { attemptItemId: 'i2', ordinal: 2, section: 'listening', part: 2, groupId: null, questionVersionId: 'q2', prompt: {}, media: [], choices: [], choiceOrder: [], choiceShuffleAllowed: false },
    { attemptItemId: 'i3', ordinal: 3, section: 'reading', part: 5, groupId: null, questionVersionId: 'q3', prompt: {}, media: [], choices: [], choiceOrder: [], choiceShuffleAllowed: true },
  ],
}

describe('attempt store', () => {
  it('resumes the server snapshot and keeps its seed', () => {
    const original = createAttemptStore(snapshot, { queueResponse: vi.fn() })
    const resumed = createAttemptStore(snapshot, { queueResponse: vi.fn() })

    expect(resumed.getState().snapshot.seed).toBe(original.getState().snapshot.seed)
  })

  it('restores saved answers and marks from the server snapshot', () => {
    const resumed = createAttemptStore({
      ...snapshot,
      responses: [{
        attemptId: 'attempt-1', attemptItemId: 'i1', questionVersionId: 'q1',
        choiceId: 'choice-a', marked: true, answeredAt: '2026-10-20T00:01:00Z',
      }],
    }, { queueResponse: vi.fn() })

    expect(resumed.getState().responses.i1).toEqual(expect.objectContaining({ choiceId: 'choice-a', marked: true }))
  })

  it('autosaves answers and never crosses a Section through normal navigation', async () => {
    const queueResponse = vi.fn().mockResolvedValue({ accepted: true })
    const store = createAttemptStore(snapshot, { queueResponse })

    await store.answer('choice-a', '2026-10-20T00:01:00Z')
    store.next()
    store.next()
    expect(store.getState().currentItemIndex).toBe(1)

    store.transitionSection('reading')
    store.previous()
    expect(store.getState().currentItemIndex).toBe(2)
    expect(queueResponse).toHaveBeenCalledWith(expect.objectContaining({
      attemptId: 'attempt-1', questionVersionId: 'q1', choiceId: 'choice-a',
    }), snapshot.sectionExpiresAt)
  })
})
