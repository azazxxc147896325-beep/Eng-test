import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '../shared/supabase/database.types'

export type ContentStatus = Database['public']['Enums']['content_status']
export type EditorChoice = { id: string; label: string; text: string; correct: boolean }
export type EditorTranslation = { promptTranslation: string; explanation: string; transcript?: string }
export type EditorDraft = {
  id: string
  createdBy: string
  status: ContentStatus
  part: number
  prompt: string
  promptData?: Json
  choices?: EditorChoice[]
  translations?: { th: EditorTranslation; en: EditorTranslation }
}
export interface ContentRepository {
  saveDraft(draft: EditorDraft): Promise<void>
  submitForReview(id: string): Promise<void>
  approve(id: string): Promise<void>
  publish(id: string): Promise<void>
  retire(id: string): Promise<void>
}

export class SupabaseContentRepository implements ContentRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async saveDraft(draft: EditorDraft) {
    const prompt = draft.promptData && typeof draft.promptData === 'object' && !Array.isArray(draft.promptData)
      ? { ...draft.promptData, text: draft.prompt }
      : { text: draft.prompt }
    const translations = draft.translations ? {
      th: { promptTranslation: draft.translations.th.promptTranslation, explanation: draft.translations.th.explanation, ...(draft.translations.th.transcript ? { transcript: draft.translations.th.transcript } : {}) },
      en: { promptTranslation: draft.translations.en.promptTranslation, explanation: draft.translations.en.explanation, ...(draft.translations.en.transcript ? { transcript: draft.translations.en.transcript } : {}) },
    } : null
    const { error } = await this.client.rpc('update_question_draft', { p_question_version_id: draft.id, p_payload: { prompt, choices: draft.choices ?? [], translations } })
    if (error) throw error
  }
  private async transition(id: string, status: ContentStatus) {
    const { error } = await this.client.rpc('transition_question_version', { p_question_version_id: id, p_target_status: status })
    if (error) throw error
  }
  submitForReview(id: string) { return this.transition(id, 'in_review') }
  approve(id: string) { return this.transition(id, 'approved') }
  publish(id: string) { return this.transition(id, 'published') }
  retire(id: string) { return this.transition(id, 'retired') }
}
