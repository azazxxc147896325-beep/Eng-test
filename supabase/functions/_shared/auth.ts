import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code)
  }
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export async function requireUser(request: Request): Promise<User> {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'unauthorized')

  const client = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new HttpError(401, 'unauthorized')
  return data.user
}

export function createServiceClient(): SupabaseClient {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
