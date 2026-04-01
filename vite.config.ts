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
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  build: {
    // 文档最佳实践：彻底禁用eval，从打包产物中移除
    terserOptions: {
      compress: {
        evaluate: false,
        drop_console: false
      }
    },
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // 禁用eval相关代码生成
        generatedCode: 'es2015',
        manualChunks: {
          react: ['react', 'react-dom']
        }
      }
    }
  }
})
