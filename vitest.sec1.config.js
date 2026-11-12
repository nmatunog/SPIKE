import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['supabase/tests/**/*.pglite.test.js', 'supabase/tests/**/*.test.js'],
    fileParallelism: false,
  },
});
