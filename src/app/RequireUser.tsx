import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'

export function RequireUser({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <main className="auth-status">{t('auth.loading')}</main>
  if (!user) {
    return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />
  }

  return children
}
