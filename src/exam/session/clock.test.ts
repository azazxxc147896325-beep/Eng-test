import { describe, expect, it, vi } from 'vitest'
import { createServerClock, remainingMs } from './clock'

describe('server clock', () => {
  it('clamps a passed deadline at zero', () => {
    expect(remainingMs('2026-10-20T00:01:00Z', '2026-10-20T00:00:00Z')).toBe(0)
  })

  it('keeps using the server offset when the browser clock advances', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T07:00:00Z'))
    const clock = createServerClock('2026-10-20T00:00:00Z')
    vi.advanceTimersByTime(5_000)

    expect(clock.now().toISOString()).toBe('2026-10-20T00:00:05.000Z')
    vi.useRealTimers()
  })
})
