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
