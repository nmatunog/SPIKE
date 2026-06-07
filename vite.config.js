import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const capacitorBuild = process.env.CAPACITOR === 'true'

export default defineConfig({
  // Relative paths for native WebView; absolute `/` for Cloudflare Pages SPA routing.
  base: capacitorBuild ? './' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
