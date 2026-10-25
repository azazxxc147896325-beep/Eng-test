import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireRole } from './RequireRole'
import { RequireUser } from './RequireUser'
import { routerBasePath } from './basePath'
import { lazyNamed } from './lazyNamed'

const AppShell = lazyNamed(() => import('../shell/AppShell'), 'AppShell')
const HomePage = lazyNamed(() => import('../shell/HomePage'), 'HomePage')
const ModeSelectPage = lazyNamed(() => import('../shell/ModeSelectPage'), 'ModeSelectPage')
const LandingPage = lazyNamed(() => import('../shell/LandingPage'), 'LandingPage')
const SettingsPage = lazyNamed(() => import('../shell/SettingsPage'), 'SettingsPage')
const LoginPage = lazyNamed(() => import('../auth/LoginPage'), 'LoginPage')
const AuthCallbackPage = lazyNamed(() => import('../auth/AuthCallbackPage'), 'AuthCallbackPage')
const ExamPage = lazyNamed(() => import('../exam/ui/ExamPage'), 'ExamPage')
const ResultsPage = lazyNamed(() => import('../results/ResultsPage'), 'ResultsPage')
const ReviewPage = lazyNamed(() => import('../results/ReviewPage'), 'ReviewPage')
const HistoryPage = lazyNamed(() => import('../results/HistoryPage'), 'HistoryPage')
const AdminLayout = lazyNamed(() => import('../admin/AdminLayout'), 'AdminLayout')
const DashboardPage = lazyNamed(() => import('../admin/DashboardPage'), 'DashboardPage')
const ReviewQueuePage = lazyNamed(() => import('../admin/ReviewQueuePage'), 'ReviewQueuePage')
const ImportPage = lazyNamed(() => import('../admin/ImportPage'), 'ImportPage')
const GenerateQuestionsPanel = lazyNamed(() => import('../admin/GenerateQuestionsPanel'), 'GenerateQuestionsPanel')
const QuestionBankPage = lazyNamed(() => import('../admin/QuestionBankPage'), 'QuestionBankPage')
const QuestionEditorRoutePage = lazyNamed(() => import('../admin/QuestionEditorRoutePage'), 'QuestionEditorRoutePage')
const UserManagementRoutePage = lazyNamed(() => import('../admin/UserManagementRoutePage'), 'UserManagementRoutePage')
const NotFoundPage = lazyNamed(() => import('./NotFoundPage'), 'NotFoundPage')

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/attempt/:attemptId', element: <RequireUser><ExamPage /></RequireUser> },
  {
    path: '/',
    element: <RequireUser><AppShell /></RequireUser>,
    children: [
      { path: 'home', element: <HomePage /> },
      { path: 'play', element: <ModeSelectPage /> },
      { path: 'results', element: <Navigate to="/history" replace /> },
      { path: 'results/:attemptId', element: <RequireUser><ResultsPage /></RequireUser> },
      { path: 'results/:attemptId/review', element: <RequireUser><ReviewPage /></RequireUser> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'settings', element: <SettingsPage /> },
      {
        path: 'admin',
        element: <RequireRole role="admin"><AdminLayout /></RequireRole>,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'questions', element: <QuestionBankPage /> },
          { path: 'questions/:questionVersionId', element: <QuestionEditorRoutePage /> },
          { path: 'review', element: <ReviewQueuePage /> },
          { path: 'generate', element: <GenerateQuestionsPanel /> },
          { path: 'import', element: <RequireRole role="admin"><ImportPage /></RequireRole> },
          { path: 'users', element: <UserManagementRoutePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
], { basename: routerBasePath() })
