import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../shared/supabase/database.types'
import type { ResponseMutation, ResponseRepository } from './ResponseRepository'

export class SupabaseResponseRepository implements ResponseRepository {
  private userId: string | null = null

  constructor(private readonly client: SupabaseClient<Database>) {}

  async save(response: ResponseMutation) {
    if (!this.userId) {
      const { data, error } = await this.client.auth.getUser()
      if (error || !data.user) throw error ?? new Error('Authentication required')
      this.userId = data.user.id
    }

    const { error } = await this.client.from('responses').upsert({
      attempt_id: response.attemptId,
      attempt_item_id: response.attemptItemId,
      user_id: this.userId,
      choice_id: response.choiceId,
      marked: response.marked,
      answered_at: response.answeredAt,
    }, { onConflict: 'attempt_id,attempt_item_id' })
    if (error) throw error
  }
}
