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
        // globPatterns' png/svg entries also match authoring-lineage files
        // that were never meant to ship at all: each of the ~112 exercise
        // folders carries a reference.png (the pre-conversion source the
        // AVIFs are generated from — see scripts/convert-assets.mjs) and
        // public/assets/brand/app-icon/ carries the app-icon design
        // lineage (mark-alpha.png, concept renders, the pure mark.svg/
        // mark-small.svg source files consumed only by
        // scripts/generate-app-icon-raster.mjs at build time, not by the
        // running app). None of this is runtime-fetched — the actual
        // exercise AVIFs are served by runtimeCaching below, and the
        // actual icons are the pwa-*.png/apple-touch-icon.png files at
        // the public root, outside this ignore. Left in, this was 159
        // precache entries / ~148 MB on every fresh install — almost
        // entirely these two directories.
        globIgnores: ['assets/exercises/**', 'assets/brand/**'],
        runtimeCaching: [
          {
            // Matches the `?v=<hash>` query param too — see
            // src/lib/exerciseAsset.ts's withHash() and
            // scripts/update-manifest-dims.mjs. CacheFirst keys strictly
            // by full URL, so this is the actual cache-busting mechanism
            // now: a regenerated file gets a new hash and therefore a new
            // URL, fetched fresh automatically; an unchanged file keeps
            // its hash and stays cached. cacheName is a stable name,
            // permanently — versioning moved into the URL itself after
            // three manual bumps (v1 through v3) for the same class of
            // "asset content changed, cache didn't know" incident.
            urlPattern: /\/assets\/exercises\/.*\.avif(\?.*)?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-assets',
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
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
