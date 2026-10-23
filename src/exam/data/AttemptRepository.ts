import type { ExamChoice, ExamMedia, ExamMode, ExamSection, JsonValue, Part } from '../domain/types'
import type { ResponseMutation } from './ResponseRepository'

export type CreateAttemptInput = {
  mode: ExamMode
  locale: 'th' | 'en'
  idempotencyKey: string
  part?: Part
  difficulty?: 'easy' | 'medium' | 'hard'
  questionCount?: 10 | 20 | 30
}

export type AttemptItemSnapshot = {
  attemptItemId: string
  ordinal: number
  section: ExamSection
  part: Part
  groupId: string | null
  questionVersionId: string
  prompt: JsonValue
  media: ExamMedia[]
  choices: ExamChoice[]
  choiceOrder: string[]
  choiceShuffleAllowed: boolean
}

export type AttemptSnapshot = {
  id: string
  mode: ExamMode
  status: 'in_progress' | 'section_complete' | 'submitted' | 'expired' | 'abandoned'
  locale: 'th' | 'en'
  seed: string
  currentSection: ExamSection
  serverNow: string
  startedAt: string
  sectionExpiresAt: string | null
  responses?: ResponseMutation[]
  items: AttemptItemSnapshot[]
}

export interface AttemptRepository {
  create(input: CreateAttemptInput): Promise<AttemptSnapshot>
  resume(attemptId: string): Promise<AttemptSnapshot>
}
