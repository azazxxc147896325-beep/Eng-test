import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { readPublicEnv } from './app/env'
import { AuthProvider } from './auth/AuthProvider'
import { createBrowserClient } from './shared/supabase/client'
import './i18n'
import './shared/styles/global.css'

const supabase = createBrowserClient(readPublicEnv(import.meta.env))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider client={supabase}>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
