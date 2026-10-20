import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'
import type { ResponseRepository } from '../data/ResponseRepository'
import { OfflineResponseQueue } from './offlineQueue'

describe('OfflineResponseQueue', () => {
  it('keeps the last pre-deadline response and discards later mutations', async () => {
    const repository = { save: vi.fn().mockResolvedValue(undefined) } as ResponseRepository
    const queue = new OfflineResponseQueue(repository, { databaseName: `responses-${crypto.randomUUID()}` })
    const base = { attemptId: 'attempt-1', attemptItemId: 'item-1', questionVersionId: 'q1', marked: false }

    await queue.queueResponse({ ...base, choiceId: 'a', answeredAt: '2026-10-20T00:00:01Z' }, '2026-10-20T00:00:03Z')
    await queue.queueResponse({ ...base, choiceId: 'b', answeredAt: '2026-10-20T00:00:02Z' }, '2026-10-20T00:00:03Z')
    const rejected = await queue.queueResponse(
      { ...base, choiceId: 'c', answeredAt: '2026-10-20T00:00:04Z' },
      '2026-10-20T00:00:03Z',
    )
    await queue.flushResponses()

    expect(rejected).toEqual({ accepted: false, reason: 'after_deadline' })
    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ choiceId: 'b' }))
    expect(repository.save).not.toHaveBeenCalledWith(expect.objectContaining({ answeredAt: '2026-10-20T00:00:04Z' }))
  })
})
