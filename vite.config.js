import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const capacitorBuild = process.env.CAPACITOR === 'true'

export default defineConfig({
  // Relative paths for native WebView; absolute `/` for Cloudflare Pages SPA routing.
  base: capacitorBuild ? './' : '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        main: 'index.html',
        pitchPanel: 'pitch-panel.html',
      },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (
            id.includes('jspdf')
            || id.includes('html2canvas')
            || id.includes('pptxgenjs')
            || id.includes('canvg')
            || id.includes('dompurify')
          ) {
            return 'spike-export'
          }
          if (id.includes('@supabase')) {
            return 'supabase-vendor'
          }
          if (
            id.includes('react-dom')
            || id.includes('react-router')
            || id.includes('/react/')
          ) {
            return 'react-vendor'
          }
          return undefined
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
