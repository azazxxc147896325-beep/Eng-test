import type { CandidateGroup, Part } from '../types'

const groupQuestionCounts: Record<Part, number[]> = {
  1: Array(6).fill(1),
  2: Array(25).fill(1),
  3: Array(13).fill(3),
  4: Array(10).fill(3),
  5: Array(30).fill(1),
  6: Array(4).fill(4),
  7: [...Array(8).fill(5), ...Array(4).fill(3), 2],
}

export function buildQuestionFixtures(setCount = 1): CandidateGroup[] {
  return Array.from({ length: setCount }, (_, setIndex) => {
    const setNumber = setIndex + 1
    return Object.entries(groupQuestionCounts).flatMap(
      ([partKey, questionCounts]) => questionCounts.map((questionCount, groupIndex) => {
        const part = Number(partKey) as Part
        const groupId = `p${part}-g${groupIndex + 1}-set-${setNumber}`
        return {
          id: groupId,
          part,
          groupType: questionCount === 1 ? 'single' : 'passage',
          difficulty: 'medium' as const,
          media: [],
          questions: Array.from({ length: questionCount }, (_, questionIndex) => ({
            questionVersionId: `${groupId}-q${questionIndex + 1}`,
            prompt: { text: `Question ${questionIndex + 1}` },
            media: [],
            choiceShuffleAllowed: questionIndex !== 0,
            choices: ['A', 'B', 'C', 'D'].map((label) => ({
              id: `${groupId}-q${questionIndex + 1}-${label}`,
              label,
              content: { text: label },
            })),
          })),
        }
      }),
    )
  }).flat()
}
