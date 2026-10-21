import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '../shared/supabase/database.types'

export type ContentStatus = Database['public']['Enums']['content_status']
export type EditorDraft = { id: string; createdBy: string; status: ContentStatus; part: number; prompt: string; promptData?: Json }
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
    const { error } = await this.client.from('question_versions').update({ prompt }).eq('id', draft.id).eq('status', 'draft')
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
