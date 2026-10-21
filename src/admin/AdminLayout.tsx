import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function AdminLayout() {
  const { t } = useTranslation()
  return <div className="admin-layout"><aside><h1><span className="brand-mark">SQ</span> Score Quest</h1><span className="admin-badge">ADMIN</span><nav><NavLink end to="/admin">▦ {t('admin.dashboard')}</NavLink><NavLink to="/admin/questions">▤ {t('admin.bank')}</NavLink><NavLink to="/admin/review">✓ {t('admin.reviewQueue')}</NavLink><NavLink to="/admin/generate">✦ {t('admin.generate')}</NavLink><NavLink to="/admin/import">⇧ {t('admin.import')}</NavLink><NavLink to="/admin/users">♙ {t('admin.users')}</NavLink><NavLink to="/home">← {t('admin.backToUser')}</NavLink></nav></aside><Outlet /></div>
}
