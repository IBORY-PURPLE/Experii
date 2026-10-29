import { test, expect, _electron as electron } from '@playwright/test';

test('the built app opens a window that renders the React shell', async () => {
  const app = await electron.launch({ args: ['.'] });
  const win = await app.firstWindow();
  await expect(win).toHaveTitle('Experii');
  await expect(win.locator('h1')).toHaveText('Experii');
  await win.screenshot({ path: 'test-results/smoke.png' });
  await app.close();
});
