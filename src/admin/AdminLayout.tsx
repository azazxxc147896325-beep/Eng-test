import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Bot, ClipboardCheck, LayoutDashboard, LibraryBig, UploadCloud, UsersRound } from 'lucide-react'

export function AdminLayout() {
  const { t } = useTranslation()
  const links = [{ to: '/admin', end: true, icon: LayoutDashboard, label: t('admin.dashboard') }, { to: '/admin/questions', icon: LibraryBig, label: t('admin.bank') }, { to: '/admin/review', icon: ClipboardCheck, label: t('admin.reviewQueue') }, { to: '/admin/generate', icon: Bot, label: t('admin.generate') }, { to: '/admin/import', icon: UploadCloud, label: t('admin.import') }, { to: '/admin/users', icon: UsersRound, label: t('admin.users') }, { to: '/home', icon: ArrowLeft, label: t('admin.backToUser') }]
  return <div className="admin-layout"><aside><h1><span className="brand-mark">SQ</span> Score Quest</h1><span className="admin-badge">ADMIN</span><nav>{links.map(({ icon: Icon, ...link }) => <NavLink key={link.to} end={link.end} to={link.to}><Icon aria-hidden="true" size={18} />{link.label}</NavLink>)}</nav></aside><Outlet /></div>
}
