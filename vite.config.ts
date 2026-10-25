import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const basePath = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base: basePath,
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'supabase', test: /node_modules[\\/]@supabase/, priority: 30 },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|@remix-run)/, priority: 20 },
            { name: 'i18n', test: /node_modules[\\/](i18next|react-i18next)/, priority: 15 },
            { name: 'vendor', test: /node_modules/, maxSize: 250_000, priority: 10 },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: false,
      devOptions: { enabled: true },
      workbox: { navigateFallback: `${basePath}index.html` },
    }),
  ],
})
