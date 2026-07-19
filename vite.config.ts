import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { PRODUCT_NAME } from './src/lib/brand.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' + manual registration (src/app/ServiceWorkerUpdater.tsx):
      // 'autoUpdate' reloads the page the instant a new deploy is found,
      // which would yank the user out mid-set — the app decides when it's
      // actually safe (no workout in progress) instead.
      registerType: 'prompt',
      injectRegister: false,
      workbox: {
        // Default glob omits woff2 — the self-hosted Fraunces display font
        // would silently fall back to a system serif on a repeat offline visit.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
      manifest: {
        name: PRODUCT_NAME,
        short_name: PRODUCT_NAME,
        description: 'Your personal training operating system',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#191512',
        theme_color: '#191512',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
