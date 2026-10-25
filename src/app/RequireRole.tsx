import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Database } from '../shared/supabase/database.types'
import { useAuth } from '../auth/AuthProvider'
import { AuthRecovery } from '../auth/AuthRecovery'

type AppRole = Database['public']['Enums']['app_role']

export function RequireRole({ role, children }: { role: AppRole | AppRole[]; children: React.ReactNode }) {
  const { t } = useTranslation()
  const { user, roles, loading, error, retry } = useAuth()
  const location = useLocation()

  if (loading) return <main className="auth-status">{t('auth.loading')}</main>
  if (error) return <AuthRecovery retry={retry} />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  const allowed = Array.isArray(role) ? role.some((item) => roles.includes(item)) : roles.includes(role)
  if (!allowed) return <main className="auth-status">{t('auth.notAuthorized')}</main>

  return children
}
