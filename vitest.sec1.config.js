import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['supabase/tests/**/*.pglite.test.js'],
    fileParallelism: false,
  },
});
