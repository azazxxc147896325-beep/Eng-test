import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '../shared/ui/LanguageSwitch'

export function AppShell() {
  const { t } = useTranslation()
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/home" className="brand"><span className="brand-mark">SCORE</span> QUEST</NavLink>
        <div className="topbar-actions"><span className="streak">🔥 {t('home.streak')}</span><LanguageSwitch /></div>
      </header>
      <Outlet />
      <nav className="bottom-nav" aria-label="Primary">
        <NavLink to="/home">⌂ {t('nav.home')}</NavLink>
        <NavLink to="/play">▦ {t('nav.tests')}</NavLink>
        <a href="#results">▥ {t('nav.results')}</a>
        <a href="#settings">⚙ {t('nav.settings')}</a>
      </nav>
    </div>
  )
}
