import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'

function BrokenPage(): never {
  throw new Error('render failed')
}

describe('AppErrorBoundary', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined))
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('replaces a crashed page with a recoverable error screen', () => {
    const retry = vi.fn()

    render(<AppErrorBoundary onRetry={retry}><BrokenPage /></AppErrorBoundary>)

    expect(screen.getByRole('heading', { name: /เกิดข้อผิดพลาด|something went wrong/i })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /ลองใหม่|try again/i }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
