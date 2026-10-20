import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { AuthProvider } from './auth/AuthProvider'
import { getBrowserClient } from './shared/supabase/browser'
import './i18n'
import './shared/styles/global.css'

const supabase = getBrowserClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider client={supabase}>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
