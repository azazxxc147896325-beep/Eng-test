import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import { ConnectivityBanner } from './ConnectivityBanner'

afterEach(() => {
  cleanup()
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
})

describe('ConnectivityBanner', () => {
  it('warns while offline and lets the user retry', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    const retry = vi.fn()

    render(<I18nextProvider i18n={i18n}><ConnectivityBanner onRetry={retry} /></I18nextProvider>)

    expect(screen.getByRole('alert')).toHaveTextContent(/ออฟไลน์|offline/i)
    fireEvent.click(screen.getByRole('button', { name: /ลองใหม่|retry/i }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('announces when a lost connection returns', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    render(<I18nextProvider i18n={i18n}><ConnectivityBanner /></I18nextProvider>)

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    fireEvent(window, new Event('online'))

    expect(screen.getByRole('status')).toHaveTextContent(/กลับมาออนไลน์|back online/i)
  })
})
