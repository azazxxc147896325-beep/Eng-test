import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function AdminLayout() {
  const { t } = useTranslation()
  return <div className="admin-layout"><aside><h1>Score Quest</h1><NavLink to="/admin">{t('admin.dashboard')}</NavLink><NavLink to="/admin/review">{t('admin.reviewQueue')}</NavLink><NavLink to="/admin/generate">{t('admin.generate')}</NavLink><NavLink to="/admin/import">{t('admin.import')}</NavLink></aside><Outlet /></div>
}
