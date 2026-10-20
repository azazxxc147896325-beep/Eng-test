export type Part = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type Difficulty = 'easy' | 'medium' | 'hard'

export type GenerateQuestionRequest = {
  part: Part
  count: number
  difficulty: Difficulty
  skills: string[]
  topic: string
}

export type Translation = { explanation: string; promptTranslation?: string; transcript?: string }
export type GeneratedQuestion = {
  id: string
  prompt: unknown
  choiceShuffleAllowed: boolean
  choices: Array<{ id: string; label: string; content: unknown; correct: boolean }>
  translations: { th: Translation; en: Translation }
}
export type ContentDraft = {
  groupId: string
  part: Part
  groupType: string
  difficulty: Difficulty
  media: Array<{ kind: 'image' | 'audio'; storagePath: string; metadata?: Record<string, unknown> }>
  questions: GeneratedQuestion[]
}

export interface AIQuestionProvider {
  generate(request: GenerateQuestionRequest): Promise<ContentDraft[]>
}
