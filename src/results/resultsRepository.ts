import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { ScoreResult } from '../exam/domain/scoring'
import type { ExamChoice, JsonValue, Part } from '../exam/domain/types'
import type { Database } from '../shared/supabase/database.types'

export type ReviewItem = {
  ordinal: number; part: Part; prompt: JsonValue; selectedChoiceId: string | null; correctChoiceId: string
  choices: ExamChoice[]; explanation: { th?: string; en?: string }; promptTranslation: string | null; transcript: string | null
}
export type AttemptReview = { attemptId: string; status: 'submitted'; locale: 'th' | 'en'; items: ReviewItem[] }
export type HistoryEntry = {
  attemptId: string; mode: 'full' | 'quick' | 'practice'; timingUnverified: boolean; submittedAt: string
  total: number | null; listening: number | null; reading: number | null
}

export interface ResultsRepository {
  getResult(attemptId: string): Promise<ScoreResult>
  getReview(attemptId: string): Promise<AttemptReview>
  listHistory(): Promise<HistoryEntry[]>
}

export class ReviewUnavailableError extends Error {
  constructor() { super('Review is available only after submission'); this.name = 'ReviewUnavailableError' }
}

async function mapError(error: unknown): Promise<never> {
  const response = (error as { context?: Response })?.context
  if (response?.status === 409) {
    const body = await response.clone().json().catch(() => ({})) as { code?: string }
    if (body.code === 'review_unavailable') throw new ReviewUnavailableError()
  }
  throw error
}

const envelopeSchema = z.object({ result: z.unknown().optional(), review: z.unknown().optional(), history: z.unknown().optional() })

export class SupabaseResultsRepository implements ResultsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  private async invoke(body: Record<string, unknown>) {
    const { data, error } = await this.client.functions.invoke('submit-attempt', { body })
    if (error) return mapError(error)
    return envelopeSchema.parse(data)
  }

  async getResult(attemptId: string) {
    return (await this.invoke({ action: 'result', attemptId })).result as ScoreResult
  }

  async getReview(attemptId: string) {
    return (await this.invoke({ action: 'review', attemptId })).review as AttemptReview
  }

  async listHistory() {
    return (await this.invoke({ action: 'history' })).history as HistoryEntry[]
  }
}
