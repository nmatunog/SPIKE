import { defineConfig } from '@playwright/test';

const PORT = 4178;

export default defineConfig({
  testDir: 'tests/versa-verifier',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 900, height: 1100 },
  },
  webServer: {
    command:
      'VERSA_DEMO_LOCAL=1 SKIP_AUTO_SHIP=1 AUTO_SHIP=0 npm run demo:versa-verifier',
    url: `http://127.0.0.1:${PORT}/dev/versa-activate`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
