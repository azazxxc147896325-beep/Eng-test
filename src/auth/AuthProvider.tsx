import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Database } from '../shared/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type AppRole = Database['public']['Enums']['app_role']

type AuthValue = {
  user: User | null
  profile: Profile | null
  roles: AppRole[]
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)
const RETURN_TO_KEY = 'score-quest:return-to'

export function AuthProvider({
  client,
  children,
}: {
  client: SupabaseClient<Database>
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<AppRole[]>([])
  const [loading, setLoading] = useState(true)

  const resolveSession = useCallback(async (session: Session | null) => {
    const nextUser = session?.user ?? null
    setUser(nextUser)

    if (!nextUser) {
      setProfile(null)
      setRoles([])
      setLoading(false)
      return
    }

    setLoading(true)
    const [profileResult, rolesResult] = await Promise.all([
      client.from('profiles').select('*').eq('id', nextUser.id).maybeSingle(),
      client.from('user_roles').select('role').eq('user_id', nextUser.id),
    ])

    setProfile(profileResult.data ?? null)
    setRoles((rolesResult.data ?? []).map(({ role }) => role))
    setLoading(false)
  }, [client])

  useEffect(() => {
    let active = true

    void client.auth.getSession().then(({ data }) => {
      if (active) void resolveSession(data.session)
    })

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (active) void resolveSession(session)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client, resolveSession])

  const signInWithGoogle = useCallback(async () => {
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (!window.sessionStorage.getItem(RETURN_TO_KEY)) {
      window.sessionStorage.setItem(
        RETURN_TO_KEY,
        currentPath === '/login' || currentPath.startsWith('/auth/') ? '/home' : currentPath,
      )
    }

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }, [client])

  const signOut = useCallback(async () => {
    const { error } = await client.auth.signOut()
    if (error) throw error
  }, [client])

  const value = useMemo(
    () => ({ user, profile, roles, loading, signInWithGoogle, signOut }),
    [user, profile, roles, loading, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

export function rememberReturnTo(path: string) {
  window.sessionStorage.setItem(RETURN_TO_KEY, path)
}

export function getReturnTo() {
  const path = window.sessionStorage.getItem(RETURN_TO_KEY) ?? '/home'
  return path.startsWith('/') && !path.startsWith('//') ? path : '/home'
}
