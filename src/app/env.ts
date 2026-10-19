type PublicEnvSource = Record<string, string | undefined>

export type PublicEnv = {
  supabaseUrl: string
  supabasePublishableKey: string
}

export function readPublicEnv(source: PublicEnvSource): PublicEnv {
  const supabaseUrl = source.VITE_SUPABASE_URL
  const supabasePublishableKey = source.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL')
  if (!supabasePublishableKey) {
    throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY')
  }

  new URL(supabaseUrl)

  return { supabaseUrl, supabasePublishableKey }
}
