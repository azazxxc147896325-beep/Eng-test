import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../shell/AppShell'
import { HomePage } from '../shell/HomePage'
import { ModeSelectPage } from '../shell/ModeSelectPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'play', element: <ModeSelectPage /> },
    ],
  },
])
