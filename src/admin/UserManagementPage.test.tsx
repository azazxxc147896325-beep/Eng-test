import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '../i18n'
import { UserManagementPage } from './UserManagementPage'

describe('UserManagementPage', () => {
  it('loads users and changes another user role', async () => {
    const setRole = vi.fn().mockResolvedValue(undefined)
    render(<I18nextProvider i18n={i18n}><UserManagementPage currentUserId="admin-1" loadUsers={vi.fn().mockResolvedValue([
      { id: 'admin-1', displayName: 'Admin A', createdAt: '2026-10-20', roles: ['user', 'admin'] },
      { id: 'user-2', displayName: 'Pat K.', createdAt: '2026-10-19', roles: ['user'] },
    ])} setRole={setRole} /></I18nextProvider>)
    expect(await screen.findByText('Pat K.')).toBeVisible()
    fireEvent.change(screen.getByLabelText('Role ของ Pat K.'), { target: { value: 'reviewer' } })
    fireEvent.click(screen.getByRole('button', { name: 'บันทึก Pat K.' }))
    await waitFor(() => expect(setRole).toHaveBeenCalledWith('user-2', 'reviewer'))
  })
})
