import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '../shared/ui/LanguageSwitch'
import { useAuth } from '../auth/AuthProvider'
import { BarChart3, BookOpenCheck, Flame, Home, LogOut, Settings, ShieldCheck } from 'lucide-react'

export function AppShell() {
  const { t } = useTranslation()
  const { user, profile, roles, loading, signOut } = useAuth()
  const location = useLocation()
  const adminMode = location.pathname.startsWith('/admin')
  const displayName = profile?.display_name || user?.email?.split('@')[0] || t('nav.learner')
  const initial = displayName.slice(0, 1).toUpperCase()

  if (adminMode) return (
    <div className="app-shell admin-shell-host">
      <header className="topbar admin-topbar"><NavLink to="/home" className="brand"><span className="brand-logo">SQ</span>Score Quest</NavLink><div className="topbar-actions"><LanguageSwitch /><button className="account-link" onClick={() => void signOut()}>{t('auth.signOut')}</button></div></header>
      <Outlet />
    </div>
  )

  const links = [
    { to: '/home', icon: Home, label: t('nav.home') },
    { to: '/play', icon: BookOpenCheck, label: t('nav.tests') },
    { to: '/history', icon: BarChart3, label: t('nav.results') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ]
  return (
    <div className="app-shell learner-shell">
      <aside className="learner-sidebar">
        <NavLink to="/home" className="brand"><span className="brand-logo">SQ</span><span>Score Quest</span></NavLink>
        <nav aria-label={t('nav.primary')}>{links.map((link) => <NavLink key={link.to} to={link.to}><link.icon aria-hidden="true" size={19} />{link.label}</NavLink>)}</nav>
        {roles.includes('admin') && <NavLink className="admin-entry" to="/admin"><ShieldCheck aria-hidden="true" size={18} /> Admin</NavLink>}
        <div className="sidebar-profile"><span className="profile-avatar">{initial}</span><span><b>{displayName}</b><small>{user?.email}</small></span></div>
      </aside>
      <div className="learner-workspace">
        <header className="topbar"><div className="mobile-brand"><span className="brand-logo">SQ</span><b>Score Quest</b></div><div className="topbar-actions"><span className="streak"><Flame aria-hidden="true" size={17} /> {t('home.streak')}</span><LanguageSwitch />{!loading && <button className="account-link" onClick={() => void signOut()}><LogOut aria-hidden="true" size={17} />{t('auth.signOut')}</button>}</div></header>
        <Outlet />
      </div>
      <nav className="bottom-nav" aria-label={t('nav.primary')}>{links.map((link) => <NavLink key={link.to} to={link.to}><link.icon aria-hidden="true" size={19} /><small>{link.label}</small></NavLink>)}</nav>
    </div>
  )
}
