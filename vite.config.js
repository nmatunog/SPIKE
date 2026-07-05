import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { coachDeckGuardPlugin } from './scripts/vite-coach-deck-guard.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const lifeRoot = path.resolve(__dirname, 'SPIKE_LIFE')

// https://vite.dev/config/
const capacitorBuild = process.env.CAPACITOR === 'true'

export default defineConfig({
  // Relative paths for native WebView; absolute `/` for Cloudflare Pages SPA routing.
  base: capacitorBuild ? './' : '/',
  plugins: [react(), coachDeckGuardPlugin()],
  resolve: {
    alias: [
      {
        find: '@spike-life/ui/layout',
        replacement: path.join(lifeRoot, 'packages/ui/dist/layout/index.js'),
      },
      {
        find: '@spike-life/ui',
        replacement: path.join(lifeRoot, 'packages/ui/dist/index.js'),
      },
      {
        find: '@spike-life/domain',
        replacement: path.join(lifeRoot, 'packages/domain/dist/index.js'),
      },
      {
        find: '@spike-life/application',
        replacement: path.join(lifeRoot, 'packages/application/dist/index.js'),
      },
      {
        find: '@spike-life/content-philippines',
        replacement: path.join(lifeRoot, 'packages/content-philippines/dist/index.js'),
      },
      {
        find: '@spike-life/infrastructure',
        replacement: path.join(lifeRoot, 'packages/infrastructure/dist/index.js'),
      },
      {
        find: '@spike-life/content-core',
        replacement: path.join(lifeRoot, 'packages/content-core/dist/index.js'),
      },
      {
        find: '@spike-life/board-config/board.json',
        replacement: path.join(lifeRoot, 'packages/board-config/src/board.json'),
      },
      {
        find: '@spike-life/board-config',
        replacement: path.join(lifeRoot, 'packages/board-config/dist/index.js'),
      },
    ],
  },
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
