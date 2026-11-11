import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['functions/_shared/versaCode/**/*.test.js'],
    fileParallelism: false,
  },
});
