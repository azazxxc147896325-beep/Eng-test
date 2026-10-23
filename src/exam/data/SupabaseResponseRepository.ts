import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../shared/supabase/database.types'
import type { ResponseMutation, ResponseRepository } from './ResponseRepository'

export class SupabaseResponseRepository implements ResponseRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async save(response: ResponseMutation) {
    const { error } = await this.client.rpc('save_attempt_response', {
      p_attempt_id: response.attemptId,
      p_attempt_item_id: response.attemptItemId,
      p_choice_id: response.choiceId,
      p_marked: response.marked,
    })
    if (error) throw error
  }
}
