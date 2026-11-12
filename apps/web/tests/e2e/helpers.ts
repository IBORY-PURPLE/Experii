import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const INVITE = process.env.E2E_INVITE ?? 'local-dev';

// Playwright loads these specs as CommonJS, so __dirname is there.
export const fixturePath = (name: string) => join(__dirname, '..', 'fixtures', name);

const fixture = (name: string) =>
  readFileSync(fixturePath(name)).toString('base64');

// Enters with the invite link as a new visitor, reads past the intro, and opens a fresh study page.
export async function enter(page: Page): Promise<string> {
  await page.goto(`/?invite=${encodeURIComponent(INVITE)}`);
  await expect(page).not.toHaveURL(/invite=/);
  const start = page.getByRole('button', { name: '바로 공부 시작하기' });
  await expect(start).toBeVisible();
  await start.click();
  await expect(page.locator('.board')).toBeVisible();
  return activePage(page);
}

export async function activePage(page: Page): Promise<string> {
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('experii.web.active.v1')))
    .toBeTruthy();
  return (await page.evaluate(() => localStorage.getItem('experii.web.active.v1')))!;
}

// The same event a real Ctrl+V of a screenshot fires.
export async function pasteImage(page: Page, name = 'capture.png') {
  await page.evaluate((data) => {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], 'image.png', { type: 'image/png' }));
    window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, fixture(name));
}

export async function removePage(page: Page, id: string) {
  await page.request.delete(`/api/pages/${id}`, { headers: { origin: new URL(page.url()).origin } });
}
