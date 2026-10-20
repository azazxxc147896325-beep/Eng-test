import { describe, expect, it } from 'vitest'
import { initialListeningState, transitionListening } from './listeningMachine'

describe('listening state machine', () => {
  it.each(['full', 'quick'] as const)('%s autoplays once and ignores restricted controls', (mode) => {
    let state = initialListeningState(mode, 'audio-1', 'ended')
    state = transitionListening(state, { type: 'READY' })
    state = transitionListening(state, { type: 'PLAY' })
    const playing = state

    for (const event of [{ type: 'PAUSE' }, { type: 'SEEK' }, { type: 'REPLAY' }, { type: 'BACK' }] as const) {
      expect(transitionListening(playing, event)).toEqual(playing)
    }
    state = transitionListening(state, { type: 'ENDED' })
    expect(state).toMatchObject({ status: 'completed', playCount: 1, nextUnlocked: true })
    expect(transitionListening(state, { type: 'PLAY' })).toEqual(state)
    expect(transitionListening(state, { type: 'LOAD', assetId: 'audio-1' })).toEqual(state)
  })

  it('unlocks grouped questions only when their cue is reached', () => {
    let state = initialListeningState('full', 'conversation-1', 'cue')
    state = transitionListening(transitionListening(state, { type: 'READY' }), { type: 'PLAY' })
    expect(state.nextUnlocked).toBe(false)
    expect(transitionListening(state, { type: 'CUE_REACHED' }).nextUnlocked).toBe(true)
  })

  it('allows Practice playback controls and records media errors', () => {
    let state = initialListeningState('practice', 'audio-1', 'ended')
    state = transitionListening(transitionListening(state, { type: 'READY' }), { type: 'PLAY' })
    state = transitionListening(state, { type: 'PAUSE' })
    expect(state.status).toBe('paused')
    state = transitionListening(state, { type: 'REPLAY' })
    expect(state).toMatchObject({ status: 'playing', playCount: 2 })
    expect(transitionListening(state, { type: 'ERROR', message: 'missing' })).toMatchObject({ status: 'error', error: 'missing' })
  })
})
