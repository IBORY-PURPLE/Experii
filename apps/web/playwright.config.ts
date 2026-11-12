import { defineConfig } from '@playwright/test';

// local: builds nothing, starts `next start` on 3100 (run `npm run build` first) with .env.local.
// prod: BASE_URL=https://experii.vercel.app E2E_INVITE=<code> npx playwright test --project=prod
const remote = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'local', use: { baseURL: 'http://localhost:3100' } },
    { name: 'prod', use: { baseURL: remote ?? 'https://experii.vercel.app' } },
  ],
  webServer: remote
    ? undefined
    : {
        command: 'npm run start -- -p 3100',
        url: 'http://localhost:3100/robots.txt',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
