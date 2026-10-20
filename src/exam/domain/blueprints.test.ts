import { describe, expect, it } from 'vitest'
import { FULL_BLUEPRINT, QUICK_BLUEPRINT } from './blueprints'

describe('exam blueprints', () => {
  it('matches the exact 200-question TOEIC Listening and Reading structure', () => {
    expect(FULL_BLUEPRINT.totalQuestions).toBe(200)
    expect(Object.fromEntries(FULL_BLUEPRINT.slots.map((slot) => [slot.part, slot.questionCount])))
      .toEqual({ 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 })
    expect(FULL_BLUEPRINT.sections).toEqual([
      { section: 'listening', durationMinutes: 45 },
      { section: 'reading', durationMinutes: 75 },
    ])
  })

  it('keeps Quick Test balanced at 50 questions with every Part represented', () => {
    expect(QUICK_BLUEPRINT.totalQuestions).toBe(50)
    expect(Object.fromEntries(QUICK_BLUEPRINT.slots.map((slot) => [slot.part, slot.questionCount])))
      .toEqual({ 1: 1, 2: 6, 3: 9, 4: 9, 5: 8, 6: 4, 7: 13 })
  })
})
