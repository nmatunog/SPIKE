import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: './dist',
    include: ['**/*.test.js'],
    exclude: ['**/node_modules/**'],
    environment: 'node',
  },
})
