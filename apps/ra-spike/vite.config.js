import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { coachDeckGuardPlugin } from '../../scripts/vite-coach-deck-guard.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  root: repoRoot,
  base: '/ra-spike/',
  plugins: [react(), coachDeckGuardPlugin()],
  resolve: {
    alias: [
      { find: '@1cma/portal-api', replacement: path.join(repoRoot, 'packages/portal-api/index.js') },
      { find: '@1cma/portal-auth', replacement: path.join(repoRoot, 'packages/portal-auth/index.js') },
    ],
  },
  build: {
    outDir: path.join(repoRoot, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: { main: path.join(repoRoot, 'ra-spike.html') },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@supabase')) return 'supabase-vendor';
          if (
            id.includes('react-dom')
            || id.includes('react-router')
            || id.includes('/react/')
          ) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/ra-spike/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
