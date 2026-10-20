import { describe, expect, it } from 'vitest'
import { ContentDraftSchema } from './contentSchema'

const question = (part: number, choiceCount = part === 2 ? 3 : 4) => ({
  id: 'q1', prompt: { text: 'Question' }, choiceShuffleAllowed: true,
  choices: Array.from({ length: choiceCount }, (_, index) => ({ id: `c${index}`, label: String.fromCharCode(65 + index), content: { text: `Choice ${index}` }, correct: index === 0 })),
  translations: { th: { explanation: 'คำอธิบาย', promptTranslation: 'คำแปล', transcript: part <= 4 ? 'บทพูด' : undefined }, en: { explanation: 'Explanation', transcript: part <= 4 ? 'Transcript' : undefined } },
})

describe('ContentDraftSchema', () => {
  it('accepts a complete Part 3 group with three questions and approved media shape', () => {
    expect(ContentDraftSchema.safeParse({
      groupId: 'g1', part: 3, groupType: 'conversation', difficulty: 'medium',
      media: [{ kind: 'audio', storagePath: 'audio/g1.mp3' }], questions: [question(3), { ...question(3), id: 'q2' }, { ...question(3), id: 'q3' }],
    }).success).toBe(true)
  })

  it.each([
    ['choice count', { groupId: 'g1', part: 2, groupType: 'single', difficulty: 'easy', media: [{ kind: 'audio', storagePath: 'a.mp3' }], questions: [question(2, 4)] }],
    ['one correct answer', { groupId: 'g1', part: 5, groupType: 'single', difficulty: 'easy', media: [], questions: [{ ...question(5), choices: question(5).choices.map((choice) => ({ ...choice, correct: false })) }] }],
    ['complete group', { groupId: 'g1', part: 6, groupType: 'text_completion', difficulty: 'hard', media: [], questions: [question(6)] }],
    ['required media', { groupId: 'g1', part: 1, groupType: 'photograph', difficulty: 'easy', media: [], questions: [question(1)] }],
  ])('rejects invalid %s', (_label, draft) => {
    expect(ContentDraftSchema.safeParse(draft).success).toBe(false)
  })
})
