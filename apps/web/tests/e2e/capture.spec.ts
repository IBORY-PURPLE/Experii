import { expect, test } from '@playwright/test';
import { enter, pasteImage, removePage } from './helpers';

test('a pasted capture becomes notes on the board within 60 seconds and stays after a reload', async ({ page }) => {
  const pageId = await enter(page);
  const upload = page.waitForResponse((r) => r.url().includes('/captures') && r.request().method() === 'POST');
  const started = Date.now();
  await pasteImage(page);
  const response = await upload;
  expect(response.status()).toBe(201);
  expect((await response.json()).adapter).toBe('mock');

  await expect(page.locator('.cap')).toHaveCount(1);
  const suggestions = page.locator('.suggest .sug');
  await expect(suggestions.first()).toBeVisible({ timeout: 60_000 });
  const took = Date.now() - started;
  expect(took).toBeLessThan(60_000);
  const count = await suggestions.count();
  expect(count).toBeGreaterThan(0);
  test.info().annotations.push({ type: 'suggestions', description: `${count} in ${took}ms` });

  await page.getByRole('button', { name: '모두 넣기' }).click();
  await expect(page.locator('.sticky')).toHaveCount(count);
  await expect(page.locator('.suggest')).toHaveCount(0);
  await expect(page.locator('.tab-label')).toContainText(`필기 ${count}개`);

  await page.reload();
  await expect(page.locator('.sticky')).toHaveCount(count);
  const image = page.locator('.cap img');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  await removePage(page, pageId);
});

test('one suggestion can be put on the board and another left out', async ({ page }) => {
  const pageId = await enter(page);
  await pasteImage(page);
  const suggestions = page.locator('.suggest .sug');
  await expect(suggestions.first()).toBeVisible({ timeout: 60_000 });
  const total = await suggestions.count();
  await suggestions.nth(1).getByRole('button', { name: '넣기', exact: true }).click();
  await expect(page.locator('.sticky')).toHaveCount(1);
  await suggestions.first().getByRole('button', { name: '이 제안 빼기' }).click();
  await expect(suggestions).toHaveCount(total - 2);
  await page.reload();
  await expect(page.locator('.sticky')).toHaveCount(1);
  await expect(page.locator('.suggest .sug')).toHaveCount(total - 2);
  await removePage(page, pageId);
});
