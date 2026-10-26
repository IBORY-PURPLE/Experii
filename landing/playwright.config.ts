import { defineConfig } from '@playwright/test';

const PORT = 3000;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.PW_CHANNEL ?? 'msedge',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 360, height: 780 }, hasTouch: true }, testIgnore: /nojs\.spec\.ts/ },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } }, testIgnore: /nojs\.spec\.ts/ },
    { name: 'nojs', use: { viewport: { width: 360, height: 780 }, javaScriptEnabled: false }, testMatch: /nojs\.spec\.ts/ },
  ],
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    port: PORT,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
