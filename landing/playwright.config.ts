import { defineConfig } from '@playwright/test';

// npm scripts cannot set env vars portably (cmd.exe), so the prod script is also recognised by name.
const PROD = process.env.PW_PROD === '1' || process.env.npm_lifecycle_event === 'test:e2e:prod';
const PORT = PROD ? 3100 : 3000;
const BASE_URL = process.env.PW_BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL ?? `http://localhost:${PORT}`,
    channel: process.env.PW_CHANNEL ?? 'msedge',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 360, height: 780 }, hasTouch: true }, testIgnore: /nojs\.spec\.ts/ },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } }, testIgnore: /nojs\.spec\.ts/ },
    { name: 'desktop-1280', use: { viewport: { width: 1280, height: 800 } }, testIgnore: /nojs\.spec\.ts/ },
    { name: 'nojs', use: { viewport: { width: 360, height: 780 }, javaScriptEnabled: false }, testMatch: /nojs\.spec\.ts/ },
  ],
  webServer: BASE_URL
    ? undefined
    : {
        command: PROD ? `npm run start -- -p ${PORT}` : process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
        port: PORT,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
