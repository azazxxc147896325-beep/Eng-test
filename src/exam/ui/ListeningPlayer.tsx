import { useEffect, useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ExamMode } from '../domain/types'
import { initialListeningState, transitionListening, type ListeningState } from '../session/listeningMachine'

export type ListeningAsset = { id: string; url: string }
export type ListeningPlayerEvent = 'ready' | 'ended' | 'error'

export function ListeningPlayer({
  mode,
  attemptId,
  asset,
  unlockAt = 'ended',
  cueSeconds,
  onEvent,
  onStateChange,
  onSupportEvent,
}: {
  mode: ExamMode
  attemptId: string
  asset: ListeningAsset
  unlockAt?: 'cue' | 'ended'
  cueSeconds?: number
  onEvent?: (event: ListeningPlayerEvent) => void
  onStateChange?: (state: ListeningState) => void
  onSupportEvent?: (event: { type: 'audio_error'; assetId: string; message: string }) => void
}) {
  const { t } = useTranslation()
  const storageKey = `score-quest:audio:${attemptId}:${asset.id}`
  const persisted = mode === 'practice' ? null : sessionStorage.getItem(storageKey) as 'started' | 'completed' | null
  const [state, dispatch] = useReducer(
    transitionListening,
    initialListeningState(mode, asset.id, unlockAt, persisted),
  )
  const audio = useRef<HTMLAudioElement>(null)
  const started = useRef(state.playCount > 0)
  const reportedError = useRef(false)
  const lastTime = useRef(0)
  const restricted = mode === 'full' || mode === 'quick'

  useEffect(() => onStateChange?.(state), [onStateChange, state])

  useEffect(() => {
    if (state.status !== 'error' || reportedError.current) return
    reportedError.current = true
    const message = state.error ?? 'media_unavailable'
    onSupportEvent?.({ type: 'audio_error', assetId: asset.id, message })
    onEvent?.('error')
  }, [asset.id, onEvent, onSupportEvent, state.error, state.status])

  useEffect(() => {
    if (!restricted || state.status !== 'ready' || started.current) return
    started.current = true
    sessionStorage.setItem(storageKey, 'started')
    dispatch({ type: 'PLAY' })
    void audio.current?.play().catch(() => {
      dispatch({ type: 'ERROR', message: 'playback_failed' })
    })
  }, [asset.id, onEvent, onSupportEvent, restricted, state.status, storageKey])

  function reportError(message: string) {
    dispatch({ type: 'ERROR', message })
  }

  return (
    <div className="listening-player">
      <audio
        ref={audio}
        src={asset.url}
        controls={!restricted}
        preload="auto"
        aria-label="Listening audio"
        onLoadedData={() => { dispatch({ type: 'READY' }); onEvent?.('ready') }}
        onPlay={() => { if (!restricted) dispatch({ type: 'PLAY' }) }}
        onPause={() => {
          dispatch({ type: 'PAUSE' })
          if (restricted && state.status === 'playing' && !audio.current?.ended) void audio.current?.play()
        }}
        onSeeking={() => {
          dispatch({ type: 'SEEK' })
          if (restricted && audio.current) audio.current.currentTime = lastTime.current
        }}
        onTimeUpdate={() => {
          if (!audio.current) return
          lastTime.current = audio.current.currentTime
          if (unlockAt === 'cue' && cueSeconds !== undefined && audio.current.currentTime >= cueSeconds) {
            dispatch({ type: 'CUE_REACHED' })
          }
        }}
        onEnded={() => {
          dispatch({ type: 'ENDED' })
          if (restricted) sessionStorage.setItem(storageKey, 'completed')
          onEvent?.('ended')
        }}
        onError={() => reportError('media_unavailable')}
      />
      {restricted && state.status === 'playing' && <p className="audio-status" aria-live="polite">{t('exam.audioPlaying')}</p>}
      {state.status === 'completed' && <p className="audio-status">{t('exam.audioComplete')}</p>}
      {state.status === 'error' && <p className="audio-error" role="alert">{t('exam.audioError')}</p>}
    </div>
  )
}
