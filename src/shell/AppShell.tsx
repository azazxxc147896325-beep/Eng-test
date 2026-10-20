import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '../shared/ui/LanguageSwitch'
import { useAuth } from '../auth/AuthProvider'

export function AppShell() {
  const { t } = useTranslation()
  const { user, loading, signOut } = useAuth()
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/home" className="brand"><span className="brand-mark">SCORE</span> QUEST</NavLink>
        <div className="topbar-actions">
          <span className="streak">🔥 {t('home.streak')}</span>
          {!loading && (user
            ? <button className="account-link" onClick={() => void signOut()}>{t('auth.signOut')}</button>
            : <NavLink className="account-link" to="/login">{t('auth.signIn')}</NavLink>)}
          <LanguageSwitch />
        </div>
      </header>
      <Outlet />
      <nav className="bottom-nav" aria-label="Primary">
        <NavLink to="/home">⌂ {t('nav.home')}</NavLink>
        <NavLink to="/play">▦ {t('nav.tests')}</NavLink>
        <NavLink to="/results">▥ {t('nav.results')}</NavLink>
        <a href="#settings">⚙ {t('nav.settings')}</a>
      </nav>
    </div>
  )
}
