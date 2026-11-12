import { expect, test } from '@playwright/test';
import { enter, removePage } from './helpers';

test('the answer streams in, renders its table, and is there after a reload', async ({ page }) => {
  const pageId = await enter(page);
  await expect(page.locator('.mock-strip')).toContainText('연습 모드');
  const input = page.getByLabel('메시지');
  await input.fill('정규화 단계별 차이를 알려줘');
  await input.press('Enter');
  await expect(page.locator('.msg-user')).toHaveText('정규화 단계별 차이를 알려줘');
  await expect(page.locator('.msg-ai table')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: '보내기' })).toBeVisible({ timeout: 30_000 });
  // the first question names the page
  await expect(page.locator('.side-list .exp[aria-current="true"]')).toContainText('정규화 단계별 차이를');

  await page.reload();
  await expect(page.locator('.msg-user')).toHaveCount(1);
  await expect(page.locator('.msg-ai table')).toBeVisible();
  await removePage(page, pageId);
});
