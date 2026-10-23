import { ContentDraftSchema, type ContentDraft } from './contentSchema'

type Part = 1 | 2 | 3 | 4 | 5 | 6 | 7

const questionCounts: Record<Part, number> = { 1: 1, 2: 1, 3: 3, 4: 3, 5: 1, 6: 4, 7: 2 }

function question(part: Part, index: number) {
  const labels = part === 2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']
  const transcript = part <= 4 ? 'Replace this with the complete English audio transcript.' : undefined
  return {
    id: `part-${part}-question-${index}`,
    prompt: { text: `Replace with the question for Part ${part}.` },
    choiceShuffleAllowed: true,
    choices: labels.map((label, choiceIndex) => ({
      id: label,
      label,
      content: { text: `Choice ${label}` },
      correct: choiceIndex === 0,
    })),
    translations: {
      th: {
        explanation: 'อธิบายเหตุผลของคำตอบที่ถูกเป็นภาษาไทย',
        promptTranslation: 'คำแปลโจทย์ภาษาไทย',
        ...(transcript ? { transcript: 'แทนที่ด้วยคำถอดเสียงภาษาไทยฉบับเต็ม' } : {}),
      },
      en: {
        explanation: 'Explain why the correct answer is correct.',
        ...(transcript ? { transcript } : {}),
      },
    },
  }
}

export function createQuestionTemplate(part: Part): ContentDraft {
  const media = [] as ContentDraft['media']
  if (part <= 4) media.push({ kind: 'audio', storagePath: `audio/part-${part}/replace-me.mp3` })
  if (part === 1) media.push({ kind: 'image', storagePath: 'images/part-1/replace-me.jpg' })

  return ContentDraftSchema.parse({
    groupId: `part-${part}-example`,
    part,
    groupType: part === 7 ? 'single_document' : 'single',
    difficulty: 'medium',
    media,
    questions: Array.from({ length: questionCounts[part] }, (_, index) => question(part, index + 1)),
  })
}

export const part5CsvTemplate = [
  'difficulty,prompt,choice_a,choice_b,choice_c,choice_d,correct,explanation_th,prompt_translation_th,explanation_en',
  'medium,Replace with the question,Choice A,Choice B,Choice C,Choice D,A,อธิบายคำตอบภาษาไทย,คำแปลโจทย์ภาษาไทย,Explain the answer in English',
].join('\n')

export function textDownloadUrl(text: string, mimeType: string): string {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(text)}`
}
