import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { AuthProvider } from './auth/AuthProvider'
import { getBrowserClient } from './shared/supabase/browser'
import './i18n'
import './shared/styles/global.css'
import { AppErrorBoundary } from './app/AppErrorBoundary'
import { ConnectivityBanner } from './shell/ConnectivityBanner'

const supabase = getBrowserClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider client={supabase}>
        <ConnectivityBanner />
        <RouterProvider router={router} />
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
