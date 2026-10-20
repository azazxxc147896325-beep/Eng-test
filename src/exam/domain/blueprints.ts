import type { Difficulty, ExamBlueprint, Part } from './types'

export const FULL_BLUEPRINT: ExamBlueprint = {
  id: 'full-v1',
  mode: 'full',
  totalQuestions: 200,
  sections: [
    { section: 'listening', durationMinutes: 45 },
    { section: 'reading', durationMinutes: 75 },
  ],
  slots: [
    { part: 1, section: 'listening', questionCount: 6 },
    { part: 2, section: 'listening', questionCount: 25 },
    { part: 3, section: 'listening', questionCount: 39 },
    { part: 4, section: 'listening', questionCount: 30 },
    { part: 5, section: 'reading', questionCount: 30 },
    { part: 6, section: 'reading', questionCount: 16 },
    { part: 7, section: 'reading', questionCount: 54 },
  ],
}

export const QUICK_BLUEPRINT: ExamBlueprint = {
  id: 'quick-v1',
  mode: 'quick',
  totalQuestions: 50,
  sections: [
    { section: 'listening', durationMinutes: 12 },
    { section: 'reading', durationMinutes: 18 },
  ],
  slots: [
    { part: 1, section: 'listening', questionCount: 1 },
    { part: 2, section: 'listening', questionCount: 6 },
    { part: 3, section: 'listening', questionCount: 9 },
    { part: 4, section: 'listening', questionCount: 9 },
    { part: 5, section: 'reading', questionCount: 8 },
    { part: 6, section: 'reading', questionCount: 4 },
    { part: 7, section: 'reading', questionCount: 13 },
  ],
}

export function createPracticeBlueprint(part: Part, questionCount: 10 | 20 | 30, difficulty: Difficulty): ExamBlueprint {
  return {
    id: `practice-p${part}-${questionCount}-${difficulty}`,
    mode: 'practice',
    totalQuestions: questionCount,
    sections: [{ section: 'practice' }],
    slots: [{ part, section: 'practice', questionCount, difficulty }],
  }
}
