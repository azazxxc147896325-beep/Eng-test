import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { AuthRecovery } from '../auth/AuthRecovery'

export function RequireUser({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { user, loading, error, retry } = useAuth()
  const location = useLocation()

  if (loading) return <main className="auth-status">{t('auth.loading')}</main>
  if (error) return <AuthRecovery retry={retry} />
  if (!user) {
    return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />
  }

  return children
}
