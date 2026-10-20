import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListeningPlayer } from './ListeningPlayer'

describe('ListeningPlayer', () => {
  beforeEach(() => {
    cleanup()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('autoplays Full mode once, hides controls, and does not replay after rerender', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const { rerender } = render(<ListeningPlayer mode="full" attemptId="attempt-1" asset={{ id: 'a1', url: '/a.mp3' }} />)
    const audio = screen.getByLabelText('Listening audio')

    fireEvent.loadedData(audio)
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
    expect(audio).not.toHaveAttribute('controls')
    rerender(<ListeningPlayer mode="full" attemptId="attempt-1" asset={{ id: 'a1', url: '/a.mp3' }} />)
    fireEvent.loadedData(audio)
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('shows controls in Practice and reports an audio failure without unlocking content', () => {
    const onSupportEvent = vi.fn()
    render(<ListeningPlayer mode="practice" attemptId="attempt-1" asset={{ id: 'a1', url: '/missing.mp3' }} onSupportEvent={onSupportEvent} />)
    const audio = screen.getByLabelText('Listening audio')

    expect(audio).toHaveAttribute('controls')
    fireEvent.error(audio)
    expect(onSupportEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'audio_error', assetId: 'a1' }))
    expect(screen.getByRole('alert')).toBeVisible()
  })
})
