import { createClient } from '@supabase/supabase-js'
import type { PublicEnv } from '../../app/env'
import type { Database } from './database.types'

export function createBrowserClient(env: PublicEnv) {
  return createClient<Database>(env.supabaseUrl, env.supabasePublishableKey)
}
