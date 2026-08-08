import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { coachDeckGuardPlugin } from './scripts/vite-coach-deck-guard.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const lifeRoot = path.resolve(__dirname, 'SPIKE_LIFE')

// https://vite.dev/config/
const capacitorBuild = process.env.CAPACITOR === 'true'
const raSpikeStandalone = process.env.VITE_RA_SPIKE_STANDALONE === 'true'
const appBaseRaw = process.env.VITE_APP_BASE || (capacitorBuild ? './' : '/')
const appBase = appBaseRaw.endsWith('/') ? appBaseRaw : `${appBaseRaw}/`
const buildEntries = raSpikeStandalone
  ? { main: 'ra-spike.html' }
  : { main: 'index.html', pitchPanel: 'pitch-panel.html' }

/** Dev-only: serve ra-spike.html for /ra-spike/* navigations (not internship index.html). */
function raSpikeStandaloneDevHtmlPlugin() {
  if (!raSpikeStandalone) {
    return { name: 'ra-spike-standalone-dev-html-skipped' }
  }
  return {
    name: 'ra-spike-standalone-dev-html',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? ''
          const pathOnly = url.split('?')[0]
          const query = url.includes('?') ? url.slice(url.indexOf('?')) : ''

          if (
            pathOnly.startsWith('/@')
            || pathOnly.startsWith('/node_modules/')
            || pathOnly.startsWith('/src/')
            || pathOnly.startsWith('/api')
            || pathOnly.startsWith('/ra-spike/api')
            || pathOnly.startsWith('/ra-spike/@')
            || pathOnly.startsWith('/ra-spike/node_modules/')
            || pathOnly.startsWith('/ra-spike/src/')
            || (pathOnly.includes('.') && !pathOnly.endsWith('.html'))
          ) {
            return next()
          }

          const raSpikeEntry =
            pathOnly === '/ra-spike.html' || pathOnly === '/ra-spike/ra-spike.html'
          const underRaSpike =
            pathOnly === '/ra-spike'
            || pathOnly === '/ra-spike/'
            || pathOnly.startsWith('/ra-spike/')

          if (!raSpikeEntry && underRaSpike) {
            req.url = `/ra-spike.html${query}`
          }
          next()
        })
      }
    },
  }
}

export default defineConfig({
  // Internship: `/`. RA-SPIKE Pages origin: `/ra-spike/` (portal proxy + dynamic chunks).
  base: appBase,
  plugins: [react(), coachDeckGuardPlugin(), raSpikeStandaloneDevHtmlPlugin()],
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
      input: buildEntries,
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (
            id.includes('jspdf')
            || id.includes('pdf-lib')
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
      '/ra-spike/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
