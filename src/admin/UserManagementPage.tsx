import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdminUser, AppRole } from './adminRepository'
import { getAdminRepository } from './adminRepository'

function mainRole(roles: AppRole[]): AppRole { return roles.includes('admin') ? 'admin' : roles.includes('reviewer') ? 'reviewer' : 'user' }
const loadUsersFromCloud = () => getAdminRepository().listUsers()
const setRoleInCloud = (id: string, role: AppRole) => getAdminRepository().setUserRole(id, role)

export function UserManagementPage({ currentUserId, loadUsers = loadUsersFromCloud, setRole = setRoleInCloud }: {
  currentUserId: string; loadUsers?: () => Promise<AdminUser[]>; setRole?: (id: string, role: AppRole) => Promise<void>
}) {
  const { t } = useTranslation()
  const [users, setUsers] = useState<AdminUser[]>([]); const [draftRoles, setDraftRoles] = useState<Record<string, AppRole>>({}); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); void loadUsers().then((rows) => { setUsers(rows); setDraftRoles(Object.fromEntries(rows.map((user) => [user.id, mainRole(user.roles)]))) }).catch(() => setMessage(t('admin.loadError'))).finally(() => setLoading(false)) }, [loadUsers, t])
  async function save(user: AdminUser) { setMessage(''); try { await setRole(user.id, draftRoles[user.id]); setMessage(t('admin.roleSaved')) } catch { setMessage(t('admin.roleSaveError')) } }
  return <main className="admin-page"><header className="admin-heading"><div><h1>{t('admin.users')}</h1><p>{t('admin.usersHint')}</p></div></header>
    {message && <p role="status">{message}</p>}<section className="admin-card">{loading ? <p className="admin-empty" role="status">{t('admin.loading')}</p> : <div className="user-list">{users.map((user) => <article className="user-row" key={user.id}><div className="user-avatar">{user.displayName.slice(0, 2).toUpperCase()}</div><div><strong>{user.displayName}</strong><small>{new Date(user.createdAt).toLocaleDateString()}</small></div><select aria-label={t('admin.roleFor', { name: user.displayName })} disabled={user.id === currentUserId} value={draftRoles[user.id] ?? 'user'} onChange={(e) => setDraftRoles((value) => ({ ...value, [user.id]: e.target.value as AppRole }))}><option value="user">User</option><option value="reviewer">Reviewer</option><option value="admin">Admin</option></select><button disabled={user.id === currentUserId} onClick={() => void save(user)}>{t('admin.saveUser', { name: user.displayName })}</button></article>)}</div>}<p className="admin-note">{t('admin.roleNote')}</p></section>
  </main>
}
