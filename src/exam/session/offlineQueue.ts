import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ResponseMutation, ResponseRepository } from '../data/ResponseRepository'

type QueuedResponse = {
  key: string
  response: ResponseMutation
  deadlineAt: string | null
}

interface ResponseQueueDatabase extends DBSchema {
  responses: { key: string; value: QueuedResponse }
}

export class OfflineResponseQueue {
  private readonly database: Promise<IDBPDatabase<ResponseQueueDatabase>>

  constructor(private readonly repository: ResponseRepository, options: { databaseName?: string } = {}) {
    this.database = openDB<ResponseQueueDatabase>(options.databaseName ?? 'score-quest-responses', 1, {
      upgrade(database) {
        database.createObjectStore('responses', { keyPath: 'key' })
      },
    })
  }

  async queueResponse(response: ResponseMutation, deadlineAt: string | null) {
    if (deadlineAt && Date.parse(response.answeredAt) > Date.parse(deadlineAt)) {
      return { accepted: false as const, reason: 'after_deadline' as const }
    }

    const key = `${response.attemptId}:${response.attemptItemId}`
    const database = await this.database
    const transaction = database.transaction('responses', 'readwrite')
    const existing = await transaction.store.get(key)
    if (!existing || Date.parse(response.answeredAt) >= Date.parse(existing.response.answeredAt)) {
      await transaction.store.put({ key, response, deadlineAt })
    }
    await transaction.done

    try {
      await this.repository.save(response)
      const current = await database.get('responses', key)
      if (current?.response.answeredAt === response.answeredAt) await database.delete('responses', key)
    } catch {
      // Keep the response queued until the browser is online again.
    }
    return { accepted: true as const }
  }

  async flushResponses() {
    const database = await this.database
    const queued = await database.getAll('responses')
    let saved = 0

    for (const item of queued.sort((left, right) => left.response.answeredAt.localeCompare(right.response.answeredAt))) {
      if (item.deadlineAt && Date.parse(item.response.answeredAt) > Date.parse(item.deadlineAt)) {
        await database.delete('responses', item.key)
        continue
      }
      try {
        await this.repository.save(item.response)
        await database.delete('responses', item.key)
        saved += 1
      } catch {
        // Keep failed writes for the next online flush.
      }
    }
    return { saved, pending: (await database.count('responses')) }
  }
}

let activeQueue: OfflineResponseQueue | null = null

export function configureResponseQueue(queue: OfflineResponseQueue) {
  activeQueue = queue
}

export function queueResponse(response: ResponseMutation, deadlineAt: string | null) {
  if (!activeQueue) throw new Error('Response queue is not configured')
  return activeQueue.queueResponse(response, deadlineAt)
}

export function flushResponses() {
  if (!activeQueue) throw new Error('Response queue is not configured')
  return activeQueue.flushResponses()
}
