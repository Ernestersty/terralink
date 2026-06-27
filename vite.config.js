import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'terralink-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400 // 24 hours
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Terra Link - Real Estate Platform',
        short_name: 'TerraLink',
        description: 'Premium Real Estate Platform for Buyers and Sellers with Secure Escrow Payments',
        theme_color: '#0F172A',
        background_color: '#0F172A',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide'
          }
        ],
        categories: ['real estate', 'business'],
        shortcuts: [
          {
            name: 'View Properties',
            short_name: 'Properties',
            description: 'Browse available property listings',
            url: '/properties',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'My Transactions',
            short_name: 'Transactions',
            description: 'View your transaction history',
            url: '/transactions',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ]
})
