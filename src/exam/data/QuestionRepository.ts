import type { CandidateGroup, Difficulty, Part } from '../domain/types'

export type EligibleQuestionFilters = {
  parts?: readonly Part[]
  difficulty?: Difficulty
  limit?: number
}

export interface QuestionRepository {
  listEligible(filters: EligibleQuestionFilters): Promise<CandidateGroup[]>
}
