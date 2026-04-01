import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // 🔴 核心：GitHub Pages 子路径，必须和仓库名完全一致
  base: '/english-root-tool/',
  
  // 🔴 打包配置：让生产环境和开发环境1:1一致，避免样式/动画变形
  build: {
    terserOptions: {
      compress: {
        evaluate: false, // 彻底禁用eval，避免CSP报错
        drop_console: false // 保留控制台，方便排查
      }
    },
    sourcemap: false, // 关闭sourcemap，避免eval相关代码
    cssCodeSplit: false, // 把CSS打包成一个文件，避免样式加载错乱
    rollupOptions: {
      output: {
        // 禁用eval相关的代码生成，确保3D动画正常
        generatedCode: 'es2015'
      }
    }
  },
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        sourcemap: false,
        // 确保所有静态资源被缓存，避免404
        globPatterns: ['**/*.{html,js,css,ico,png,svg}']
      },
      // 🔴 PWA manifest 所有路径100%对齐base
      manifest: {
        name: 'EtymMaster',
        short_name: 'EtymMaster',
        start_url: '/english-root-tool/', // 必须加base，否则PWA启动路径错误
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        orientation: 'portrait',
        shortcuts: [
          {
            name: 'Study Now',
            short_name: 'Study',
            description: 'Start your daily vocabulary study',
            url: '/english-root-tool/'
          },
          {
            name: 'Etymology Explorer',
            short_name: 'Etymology',
            description: 'Explore word roots and prefixes',
            url: '/english-root-tool/?view=etymology'
          }
        ],
        icons: [
          {
            src: '/english-root-tool/pwa-icon.svg', // 必须加base，否则图标404
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
