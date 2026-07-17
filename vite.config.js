import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Build stamp baked in at build time, format: YYYYDDMM | HH:MM:SS
const BUILD_STAMP = (() => {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getDate())}${p(d.getMonth() + 1)} | ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
})()

export default defineConfig({
  define: {
    __BUILD_STAMP__: JSON.stringify(BUILD_STAMP)
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/(?!api)/],
        clientsClaim: true
      },
      manifest: {
        name: 'Hartinna',
        short_name: 'Hartinna',
        description: 'Hartinna Partner — Agent ordering app',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FDE8F2',
        theme_color: '#D4276C',
        lang: 'en',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
})
