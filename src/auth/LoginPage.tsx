import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../shared/ui/Button'
import { rememberReturnTo, useAuth } from './AuthProvider'

export function LoginPage() {
  const { t } = useTranslation()
  const { user, loading, signInWithGoogle } = useAuth()
  const location = useLocation()
  const [error, setError] = useState('')
  const next = (location.state as { from?: string } | null)?.from ?? '/home'

  if (!loading && user) return <Navigate to={next} replace />

  async function login() {
    setError('')
    rememberReturnTo(next)
    try {
      await signInWithGoogle()
    } catch {
      setError(t('auth.loginError'))
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">SCORE QUEST</p>
        <h1>{t('auth.title')}</h1>
        <p className="muted">{t('auth.detail')}</p>
        <Button size="large" onClick={() => void login()} disabled={loading}>
          {t('auth.google')}
        </Button>
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  )
}
