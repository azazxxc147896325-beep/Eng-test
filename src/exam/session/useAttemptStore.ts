import { useSyncExternalStore } from 'react'
import type { AttemptSnapshot } from '../data/AttemptRepository'
import type { ResponseMutation } from '../data/ResponseRepository'
import type { ExamSection } from '../domain/types'
import { createServerClock, type ServerClock } from './clock'

type QueuePort = {
  queueResponse(response: ResponseMutation, deadlineAt: string | null): Promise<{ accepted: boolean } | void>
}

export type AttemptStoreState = {
  snapshot: AttemptSnapshot
  currentItemIndex: number
  currentSection: ExamSection
  sectionExpiresAt: string | null
  responses: Record<string, ResponseMutation>
}

export type AttemptStore = {
  getState(): AttemptStoreState
  subscribe(listener: () => void): () => void
  answer(choiceId: string | null, answeredAt?: string): Promise<void>
  toggleMark(answeredAt?: string): Promise<void>
  next(): void
  previous(): void
  transitionSection(section: ExamSection, sectionExpiresAt?: string | null): void
}

export function createAttemptStore(
  snapshot: AttemptSnapshot,
  queue: QueuePort,
  clock: ServerClock = createServerClock(snapshot.serverNow),
): AttemptStore {
  let state: AttemptStoreState = {
    snapshot,
    currentItemIndex: Math.max(0, snapshot.items.findIndex((item) => item.section === snapshot.currentSection)),
    currentSection: snapshot.currentSection,
    sectionExpiresAt: snapshot.sectionExpiresAt,
    responses: {},
  }
  const listeners = new Set<() => void>()
  const update = (next: AttemptStoreState) => {
    state = next
    listeners.forEach((listener) => listener())
  }
  const currentItem = () => state.snapshot.items[state.currentItemIndex]

  async function persist(choiceId: string | null, marked: boolean, answeredAt = clock.now().toISOString()) {
    const item = currentItem()
    const response: ResponseMutation = {
      attemptId: snapshot.id,
      attemptItemId: item.attemptItemId,
      questionVersionId: item.questionVersionId,
      choiceId,
      marked,
      answeredAt,
    }
    const result = await queue.queueResponse(response, state.sectionExpiresAt)
    if (!result || result.accepted) update({ ...state, responses: { ...state.responses, [item.attemptItemId]: response } })
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    answer(choiceId, answeredAt) {
      const existing = state.responses[currentItem().attemptItemId]
      return persist(choiceId, existing?.marked ?? false, answeredAt)
    },
    toggleMark(answeredAt) {
      const existing = state.responses[currentItem().attemptItemId]
      return persist(existing?.choiceId ?? null, !(existing?.marked ?? false), answeredAt)
    },
    next() {
      const nextIndex = state.currentItemIndex + 1
      if (state.snapshot.items[nextIndex]?.section === state.currentSection) {
        update({ ...state, currentItemIndex: nextIndex })
      }
    },
    previous() {
      const previousIndex = state.currentItemIndex - 1
      if (state.snapshot.items[previousIndex]?.section === state.currentSection) {
        update({ ...state, currentItemIndex: previousIndex })
      }
    },
    transitionSection(section, sectionExpiresAt = null) {
      const index = state.snapshot.items.findIndex((item) => item.section === section)
      if (index >= 0) update({ ...state, currentItemIndex: index, currentSection: section, sectionExpiresAt })
    },
  }
}

export function useAttemptStore<T = AttemptStoreState>(
  store: AttemptStore,
  selector: (state: AttemptStoreState) => T = (state) => state as T,
) {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(store.getState()))
}
