import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'sounds/*.mp3'],
      manifest: {
        name: 'CalmWave — מוזיקה שמרגישה את הלחץ',
        short_name: 'CalmWave',
        description: 'מוזיקה אדפטיבית שמתכווננת בזמן אמת ללחץ שלך',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f0a1e',
        theme_color: '#6366f1',
        dir: 'rtl',
        lang: 'he',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.mp3$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'audio-cache', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
})
