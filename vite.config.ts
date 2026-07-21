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
        // Exercise AVIFs are deliberately absent from this list (and so
        // from precache) — docs/design/ExerciseAssetPipeline.md's ~100
        // exercises would bloat the install-time download for content most
        // sessions never open; runtimeCaching below caches them on first view.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/exercises\/.*\.avif$/,
            handler: 'CacheFirst',
            options: {
              // Bumped for the background-removal regeneration (Phase B
              // ship) — CacheFirst never revalidates, and every asset
              // kept its URL, so without a new cache name a phone that
              // already viewed an exercise keeps serving the old baked-
              // white AVIF from cache indefinitely. Bump this name again
              // any time a future regeneration reuses existing URLs.
              cacheName: 'exercise-assets-v2',
              expiration: { maxEntries: 200 },
            },
          },
        ],
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
