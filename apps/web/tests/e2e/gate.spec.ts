import { expect, test } from '@playwright/test';
import { INVITE } from './helpers';

test('without an invite the app stays closed', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '초대 링크가 필요해요' })).toBeVisible();
  const api = await request.get('/api/pages');
  expect(api.status()).toBe(401);
});

test('a wrong invite code says so', async ({ page }) => {
  await page.goto('/?invite=not-a-real-code');
  await expect(page).toHaveURL(/invite_error=1/);
  await expect(page.locator('.err-text')).toContainText('초대 코드가 맞지 않거나');
});

test('the invite link opens the app and leaves the address clean', async ({ page }) => {
  await page.goto(`/?invite=${encodeURIComponent(INVITE)}`);
  await expect(page).not.toHaveURL(/invite=/);
  await expect(page.getByRole('heading', { name: '지금까지 공부 어떻게 했어요?' })).toBeVisible();
  const cookies = await page.context().cookies();
  const visitor = cookies.find((c) => c.name === 'exp_vid');
  expect(visitor?.httpOnly).toBe(true);
});
