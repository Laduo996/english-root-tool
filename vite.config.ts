import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ensure: not importing vite-plugin-pwa or similar plugins!

export default defineConfig({
  // Ensure the base matches your GitHub repo name for Pages
  base: '/english-root-tool/',
  plugins: [react()], // No PWA plugin
  build: {
    // Disables 'eval' in build output
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
