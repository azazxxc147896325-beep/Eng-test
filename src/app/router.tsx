import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../shell/AppShell'
import { HomePage } from '../shell/HomePage'
import { ModeSelectPage } from '../shell/ModeSelectPage'
import { AuthCallbackPage } from '../auth/AuthCallbackPage'
import { LoginPage } from '../auth/LoginPage'
import { RequireRole } from './RequireRole'
import { RequireUser } from './RequireUser'
import { ExamPage } from '../exam/ui/ExamPage'

function Placeholder({ title }: { title: string }) {
  return <main className="page"><h1>{title}</h1></main>
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/attempt/:attemptId', element: <RequireUser><ExamPage /></RequireUser> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'play', element: <RequireUser><ModeSelectPage /></RequireUser> },
      { path: 'results', element: <RequireUser><Placeholder title="Results" /></RequireUser> },
      {
        path: 'admin',
        element: <RequireRole role="admin"><Placeholder title="Admin" /></RequireRole>,
      },
    ],
  },
])
