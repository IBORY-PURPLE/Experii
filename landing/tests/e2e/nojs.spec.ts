import { expect, test } from '@playwright/test';

test.describe('JS 없음', () => {
  test('작동 방식 4단계가 세로로 모두 보인다', async ({ page }) => {
    await page.goto('/');
    const panels = page.locator('#stage .panel');
    await expect(panels).toHaveCount(4);
    for (let i = 0; i < 4; i++) await expect(panels.nth(i)).toBeVisible();
    await expect(page.locator('#stage [role="tabpanel"]')).toHaveCount(0);
    await expect(page.locator('#stage').getByText('LEFT JOIN orders o').first()).toBeVisible();
  });

  for (const size of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1536, height: 730 },
    { width: 1366, height: 657 },
    { width: 1280, height: 690 },
  ]) {
    test(`데스크톱 폭에서 히어로 앱 창은 루프를 마친 마지막 장면으로 멈춰 있다 (${size.width}×${size.height})`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      const win = page.locator('.hd-win');
      await expect(win).toBeVisible();
      const on = win.locator('.hd-scene.on');
      await expect(on).toHaveCount(1);
      await expect(on.locator('.revisit-line')).toContainText('다시 본 날');
      await expect(on.locator('.revisit-line .dot.on')).toHaveCount(3);
      await expect(on.locator('.xcard .xc-a')).toBeVisible();
      await expect(on.locator('.follow')).toBeVisible();
      await expect(win.locator('.aw-count')).toHaveText('4');
      await expect(win.locator('.aw-bar')).toContainText('예시 화면');
      const bar = (await win.locator('.aw-bar').boundingBox())!;
      expect(bar.y + bar.height, "the window's title bar is whole on the first screen").toBeLessThanOrEqual(size.height);
      await expect(page.locator('.hd-ctrl')).toBeHidden();
      await expect(page.locator('.hd-ctrl[data-dock]'), 'nothing docks without JS').toHaveCount(0);
    });
  }

  test('JS 없이도 다운로드 버튼이 출시 전 안내를 띄운다', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const url = page.url();
    await page.locator('#hero-cta [data-download="hero"]').click();
    await expect(page.locator('#download-note')).toBeVisible();
    await expect(page.locator('#download-note')).toContainText('출시 전이에요');
    expect(page.url()).toBe(url);
    await page.keyboard.press('Escape');
    await expect(page.locator('#download-note')).toBeHidden();
  });

  test('폰 프레임이 없다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[class*="phone" i]')).toHaveCount(0);
  });

  test('폼이 일반 POST로 제출된다', async ({ page }) => {
    await page.goto('/#signup');
    const form = page.locator('form.su-form');
    await page.locator('#f-email').fill('nojs@example.test');
    await form.locator('input[name="student_status"][value="undergrad"]').check({ force: true });
    await form.locator('input[name="sqld_status"][value="studying"]').check({ force: true });
    await form.locator('input[name="ai_subscriptions"][value="none"]').check({ force: true });
    await form.locator('input[name="consent"]').check();
    await form.getByRole('button', { name: '사전 신청하기' }).click();
    await expect(page.getByText('신청됐어요.')).toBeVisible();
  });
});
