import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../shared/ui/Button'
import { LanguageSwitch } from '../shared/ui/LanguageSwitch'
import { rememberReturnTo, useAuth } from './AuthProvider'
import { LogIn } from 'lucide-react'

export function LoginPage() {
  const { t } = useTranslation()
  const { user, loading, signInWithGoogle } = useAuth()
  const location = useLocation()
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const next = (location.state as { from?: string } | null)?.from ?? '/home'

  if (!loading && user) return <Navigate to={next} replace />

  async function login() {
    if (signingIn) return
    setError('')
    setSigningIn(true)
    rememberReturnTo(next)
    try {
      await signInWithGoogle()
    } catch {
      setError(t('auth.loginError'))
      setSigningIn(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand auth-brand" href="./"><span className="brand-logo">SQ</span><span>Score Quest</span></a>
        <div><p className="eyebrow">SCORE QUEST</p><h1>{t('auth.storyTitle')}</h1><p>{t('auth.storyDetail')}</p></div>
        <small>© Score Quest</small>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top"><LanguageSwitch /></div>
        <div className="auth-card">
          <span className="auth-icon" aria-hidden="true"><LogIn /></span>
          <h2>{t('auth.title')}</h2>
          <p className="muted">{t('auth.detail')}</p>
          <Button size="large" onClick={() => void login()} disabled={loading || signingIn}>
            <span className="google-g" aria-hidden="true">G</span>{signingIn ? t('auth.finishing') : t('auth.google')}
          </Button>
          {error && <p className="form-error" role="alert">{error}</p>}
          <small className="auth-note">{t('auth.note')}</small>
        </div>
      </section>
    </main>
  )
}
