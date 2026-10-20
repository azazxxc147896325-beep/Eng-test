import type { ExamMode } from '../domain/types'

export type ListeningStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'completed' | 'error'
export type ListeningState = {
  mode: ExamMode
  assetId: string
  unlockAt: 'cue' | 'ended'
  status: ListeningStatus
  playCount: number
  nextUnlocked: boolean
  error: string | null
}

export type ListeningEvent =
  | { type: 'LOAD'; assetId: string }
  | { type: 'READY' | 'PLAY' | 'PAUSE' | 'SEEK' | 'REPLAY' | 'BACK' | 'ENDED' | 'CUE_REACHED' }
  | { type: 'ERROR'; message: string }

export function initialListeningState(
  mode: ExamMode,
  assetId: string,
  unlockAt: 'cue' | 'ended',
  persisted?: 'started' | 'completed' | null,
): ListeningState {
  if (mode !== 'practice' && persisted === 'completed') {
    return { mode, assetId, unlockAt, status: 'completed', playCount: 1, nextUnlocked: true, error: null }
  }
  if (mode !== 'practice' && persisted === 'started') {
    return { mode, assetId, unlockAt, status: 'error', playCount: 1, nextUnlocked: false, error: 'playback_interrupted' }
  }
  return { mode, assetId, unlockAt, status: 'loading', playCount: 0, nextUnlocked: mode === 'practice', error: null }
}

export function transitionListening(state: ListeningState, event: ListeningEvent): ListeningState {
  const restricted = state.mode === 'full' || state.mode === 'quick'
  switch (event.type) {
    case 'LOAD':
      return event.assetId === state.assetId
        ? state
        : initialListeningState(state.mode, event.assetId, state.unlockAt)
    case 'READY':
      return state.status === 'loading' ? { ...state, status: 'ready' } : state
    case 'PLAY':
      if (restricted && (state.status !== 'ready' || state.playCount > 0)) return state
      if (!restricted && !['ready', 'paused', 'completed'].includes(state.status)) return state
      return { ...state, status: 'playing', playCount: state.playCount + 1, error: null }
    case 'PAUSE':
      return !restricted && state.status === 'playing' ? { ...state, status: 'paused' } : state
    case 'REPLAY':
      return restricted ? state : { ...state, status: 'playing', playCount: state.playCount + 1, error: null }
    case 'SEEK':
    case 'BACK':
      return state
    case 'CUE_REACHED':
      return state.unlockAt === 'cue' ? { ...state, nextUnlocked: true } : state
    case 'ENDED':
      return state.status === 'playing'
        ? { ...state, status: 'completed', nextUnlocked: state.unlockAt === 'ended' || state.nextUnlocked }
        : state
    case 'ERROR':
      return { ...state, status: 'error', nextUnlocked: false, error: event.message }
  }
}
