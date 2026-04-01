import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/english-root-tool/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'EtymMaster',
        short_name: 'EtymMaster',
        description: 'AI-powered English vocabulary mastery through etymology and visual memory.',
        theme_color: '#f97316',
        icons: [{src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml'}]
      },
      workbox: {globPatterns: ['**/*.{html,js,css,svg,png,jpg,jpeg,gif,ico}']}
    })
  ],
  build: {
    terserOptions: {compress: {evaluate: false, drop_console: false}},
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {generatedCode: 'es2015', manualChunks: {react: ['react', 'react-dom']}}
    }
  }
})
