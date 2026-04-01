import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 核心：base必须和仓库名完全一致
  base: '/english-root-tool/',
  plugins: [react()],
  build: {
    // 彻底禁用eval，从构建阶段消除
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
        generatedCode: 'es2015',
        manualChunks: {
          react: ['react', 'react-dom']
        }
      }
    }
  }
})
