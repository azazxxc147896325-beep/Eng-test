import { describe, expect, it } from 'vitest'
import { scoreAttempt } from './scoring'

describe('scoreAttempt', () => {
  it('keeps Full Test section and total estimates inside TOEIC-style bounds', () => {
    const answers = [
      ...Array.from({ length: 100 }, (_, index) => ({ part: (index < 6 ? 1 : index < 31 ? 2 : index < 70 ? 3 : 4) as 1 | 2 | 3 | 4, correct: false })),
      ...Array.from({ length: 100 }, (_, index) => ({ part: (index < 30 ? 5 : index < 46 ? 6 : 7) as 5 | 6 | 7, correct: true })),
    ]
    const score = scoreAttempt({ mode: 'full', answers }, 'sq-v1')

    expect(score.section.listening).toBeGreaterThanOrEqual(5)
    expect(score.section.listening).toBeLessThanOrEqual(495)
    expect(score.section.reading).toBe(495)
    expect(score.total).toBeGreaterThanOrEqual(10)
    expect(score.total).toBeLessThanOrEqual(990)
    expect(score.weakParts).toContain(1)
  })

  it('returns a low-confidence range for Quick and accuracy only for Practice', () => {
    const quick = scoreAttempt({ mode: 'quick', answers: [
      { part: 1, correct: true }, { part: 5, correct: false },
    ] }, 'sq-v1')
    const practice = scoreAttempt({ mode: 'practice', answers: [
      { part: 5, correct: true }, { part: 5, correct: false },
    ] }, 'sq-v1')

    expect(quick.range).toEqual(expect.objectContaining({ confidence: 'low' }))
    expect(quick.total).toBeNull()
    expect(practice).toMatchObject({ total: null, accuracy: 50, range: null })
  })
})
