import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../shell/AppShell'
import { HomePage } from '../shell/HomePage'
import { ModeSelectPage } from '../shell/ModeSelectPage'
import { AuthCallbackPage } from '../auth/AuthCallbackPage'
import { LoginPage } from '../auth/LoginPage'
import { RequireRole } from './RequireRole'
import { RequireUser } from './RequireUser'
import { ExamPage } from '../exam/ui/ExamPage'
import { ResultsPage } from '../results/ResultsPage'
import { ReviewPage } from '../results/ReviewPage'
import { HistoryPage } from '../results/HistoryPage'
import { AdminLayout } from '../admin/AdminLayout'
import { DashboardPage } from '../admin/DashboardPage'
import { ReviewQueuePage } from '../admin/ReviewQueuePage'
import { ImportPage } from '../admin/ImportPage'
import { GenerateQuestionsPanel } from '../admin/GenerateQuestionsPanel'

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
      { path: 'results', element: <Navigate to="/history" replace /> },
      { path: 'results/:attemptId', element: <RequireUser><ResultsPage /></RequireUser> },
      { path: 'results/:attemptId/review', element: <RequireUser><ReviewPage /></RequireUser> },
      { path: 'history', element: <RequireUser><HistoryPage /></RequireUser> },
      {
        path: 'admin',
        element: <RequireRole role={['admin', 'reviewer']}><AdminLayout /></RequireRole>,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'review', element: <ReviewQueuePage /> },
          { path: 'generate', element: <GenerateQuestionsPanel /> },
          { path: 'import', element: <RequireRole role="admin"><ImportPage /></RequireRole> },
        ],
      },
    ],
  },
])
