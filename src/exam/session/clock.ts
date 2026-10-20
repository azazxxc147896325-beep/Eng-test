export type TimeValue = string | number | Date

function milliseconds(value: TimeValue) {
  return value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value)
}

export function remainingMs(serverNow: TimeValue, expiresAt: TimeValue) {
  return Math.max(0, milliseconds(expiresAt) - milliseconds(serverNow))
}

export function createServerClock(serverNow: TimeValue, observedClientNow = Date.now()) {
  const offsetMs = milliseconds(serverNow) - observedClientNow
  return {
    offsetMs,
    now: () => new Date(Date.now() + offsetMs),
    remainingMs: (expiresAt: TimeValue) => remainingMs(Date.now() + offsetMs, expiresAt),
  }
}

export type ServerClock = ReturnType<typeof createServerClock>
