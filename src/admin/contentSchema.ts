import { z } from 'zod'

const translationSchema = z.object({
  explanation: z.string().min(1),
  promptTranslation: z.string().min(1).optional(),
  transcript: z.string().min(1).optional(),
})
const choiceSchema = z.object({
  id: z.string().min(1), label: z.string().min(1), content: z.unknown(), correct: z.boolean(),
})
const questionSchema = z.object({
  id: z.string().min(1), prompt: z.unknown(), choiceShuffleAllowed: z.boolean(),
  choices: z.array(choiceSchema),
  translations: z.object({ th: translationSchema, en: translationSchema }),
})
const mediaSchema = z.object({ kind: z.enum(['image', 'audio']), storagePath: z.string().min(1), metadata: z.record(z.string(), z.unknown()).optional() })

export const ContentDraftSchema = z.object({
  groupId: z.string().min(1),
  part: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)]),
  groupType: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  media: z.array(mediaSchema),
  questions: z.array(questionSchema).min(1),
}).superRefine((draft, context) => {
  const exactQuestions: Partial<Record<number, number>> = { 1: 1, 2: 1, 3: 3, 4: 3, 5: 1, 6: 4 }
  const required = exactQuestions[draft.part]
  if (required && draft.questions.length !== required) {
    context.addIssue({ code: 'custom', path: ['questions'], message: `Part ${draft.part} groups require exactly ${required} question(s)` })
  }
  if (draft.part === 7) {
    const valid = draft.groupType === 'single_document'
      ? draft.questions.length >= 2 && draft.questions.length <= 4
      : ['double_document', 'triple_document'].includes(draft.groupType) && draft.questions.length === 5
    if (!valid) context.addIssue({ code: 'custom', path: ['questions'], message: 'Part 7 requires 2–4 questions for a single document or 5 for double/triple documents' })
  }
  const needsAudio = draft.part <= 4
  if (needsAudio && !draft.media.some((media) => media.kind === 'audio')) {
    context.addIssue({ code: 'custom', path: ['media'], message: `Part ${draft.part} requires an audio asset` })
  }
  if (draft.part === 1 && !draft.media.some((media) => media.kind === 'image')) {
    context.addIssue({ code: 'custom', path: ['media'], message: 'Part 1 requires an image asset' })
  }
  draft.questions.forEach((question, index) => {
    const expectedChoices = draft.part === 2 ? 3 : 4
    if (question.choices.length !== expectedChoices) {
      context.addIssue({ code: 'custom', path: ['questions', index, 'choices'], message: `Part ${draft.part} requires exactly ${expectedChoices} choices` })
    }
    if (question.choices.filter((choice) => choice.correct).length !== 1) {
      context.addIssue({ code: 'custom', path: ['questions', index, 'choices'], message: 'Choose exactly one correct answer' })
    }
    if (draft.part <= 4 && (!question.translations.th.transcript || !question.translations.en.transcript)) {
      context.addIssue({ code: 'custom', path: ['questions', index, 'translations'], message: 'Listening questions require Thai and English transcripts' })
    }
  })
})

export type ContentDraft = z.infer<typeof ContentDraftSchema>
