import { expect, test } from '@playwright/test';
import { enter, removePage } from './helpers';

// FR-W12: words chosen in an answer become a note as they are (source drag-from-chat).
test('words picked from an answer become a note on the board', async ({ page }) => {
  const pageId = await enter(page);
  const input = page.getByLabel('메시지');
  await input.fill('정규화 알려줘');
  await input.press('Enter');
  await expect(page.locator('.msg-ai table')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: '보내기' })).toBeVisible({ timeout: 30_000 });

  // select one list item of the answer, the way a mouse drag over it would
  await page.evaluate(() => {
    const item = document.querySelector('.msg-ai li');
    if (!item) throw new Error('no list item');
    const range = document.createRange();
    range.selectNodeContents(item);
    const sel = getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });
  const add = page.getByRole('button', { name: '필기에 추가' });
  await expect(add).toBeVisible();
  const picked = (await page.locator('.msg-ai li').first().innerText()).trim();
  await add.click();

  const sticky = page.locator('.sticky');
  await expect(sticky).toHaveCount(1);
  await expect(sticky.locator('.sticky-text')).toHaveText(picked);
  await expect(sticky.locator('.sticky-src')).toContainText('Q1 답에서');

  await page.reload();
  await expect(page.locator('.sticky .sticky-text')).toHaveText(picked);
  await removePage(page, pageId);
});
