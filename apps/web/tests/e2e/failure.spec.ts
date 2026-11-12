import { expect, test } from '@playwright/test';
import { enter, fixturePath, pasteImage, removePage } from './helpers';

test('a failed capture keeps the image and can be tried again', async ({ page }) => {
  const pageId = await enter(page);
  // the mock fails on request; the header is honoured only while the mock is running
  await page.route('**/api/pages/*/captures', (route) =>
    route.continue({ headers: { ...route.request().headers(), 'x-experii-mock': 'fail' } }),
  );
  await pasteImage(page);
  await expect(page.locator('.cap-status.err')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.cap img')).toBeVisible();
  await page.unroute('**/api/pages/*/captures');

  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.locator('.suggest .sug').first()).toBeVisible({ timeout: 60_000 });
  await removePage(page, pageId);
});

test('an image with nothing to learn gets no notes and a reason', async ({ page }) => {
  const pageId = await enter(page);
  await page.getByTestId('capture-input').setInputFiles(fixturePath('tiny.png'));
  await expect(page.locator('.cap-status.muted')).toContainText('찾지 못했어요', { timeout: 60_000 });
  await expect(page.locator('.suggest')).toHaveCount(0);
  await removePage(page, pageId);
});

test('a file that is not an image is refused in the browser', async ({ page }) => {
  const pageId = await enter(page);
  await page.getByTestId('capture-input').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not an image'),
  });
  await expect(page.locator('.toast')).toContainText('png, jpg, webp');
  await expect(page.locator('.cap')).toHaveCount(0);
  await removePage(page, pageId);
});

test('the server refuses a renamed non-image upload', async ({ page }) => {
  const pageId = await enter(page);
  const res = await page.request.post(`/api/pages/${pageId}/captures`, {
    headers: { origin: new URL(page.url()).origin },
    multipart: {
      file: { name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('<svg></svg>') },
      x: '0',
      y: '0',
    },
  });
  expect(res.status()).toBe(415);
  await removePage(page, pageId);
});

test('pasting text does not make a capture', async ({ page }) => {
  const pageId = await enter(page);
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData('text/plain', '그냥 글');
    window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(500);
  await expect(page.locator('.cap')).toHaveCount(0);
  await pasteImage(page);
  await expect(page.locator('.cap')).toHaveCount(1);
  await removePage(page, pageId);
});
