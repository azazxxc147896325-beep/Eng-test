import { useAuth } from '../auth/AuthProvider'
import { UserManagementPage } from './UserManagementPage'

export function UserManagementRoutePage() {
  const { user } = useAuth()
  return user ? <UserManagementPage currentUserId={user.id} /> : null
}
