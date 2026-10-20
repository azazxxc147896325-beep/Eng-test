import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getReturnTo, useAuth } from './AuthProvider'

export function AuthCallbackPage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()

  if (loading) return <main className="auth-status">{t('auth.finishing')}</main>
  if (user) return <Navigate to={getReturnTo()} replace />

  return (
    <main className="auth-status">
      <p role="alert">{t('auth.callbackError')}</p>
      <Link to="/login">{t('auth.tryAgain')}</Link>
    </main>
  )
}
