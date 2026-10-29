import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { docGroups, docPages } from '@/content/docs';

const slugs = docGroups.flatMap((g) => g.slugs);

test.describe('가이드', () => {
  test('랜딩 헤더의 가이드 메뉴로 첫 가이드 페이지에 간다', async ({ page }) => {
    await page.goto('/');
    await page.locator('header.nav').getByRole('link', { name: '가이드' }).click();
    await expect(page).toHaveURL(/\/docs\/intro$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Experii란?');
  });

  test('/docs는 첫 가이드 페이지로 넘어간다', async ({ page }) => {
    await page.goto('/docs');
    await expect(page).toHaveURL(/\/docs\/intro$/);
  });

  for (const slug of slugs) {
    test(`${slug}: 제목, 현재 목차 표시, 가로 넘침 없음, axe 위반 없음`, async ({ page }) => {
      const doc = docPages.find((p) => p.slug === slug)!;
      await page.goto(`/docs/${slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(doc.title);
      await expect(page.locator('.docs-side a[aria-current="page"]')).toHaveAttribute('href', `/docs/${slug}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page }).exclude('nextjs-portal').analyze();
      expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
    });
  }

  test('다음 링크로 순서대로 넘어가고 사전 신청은 랜딩 신청 폼으로 간다', async ({ page }) => {
    await page.goto('/docs/intro');
    await page.locator('.doc-pager a[rel="next"]').click();
    await expect(page).toHaveURL(/\/docs\/why$/);
    await page.locator('.doc-cta a').click();
    await expect(page).toHaveURL(/\/#signup$/);
    await expect(page.locator('#su-h')).toBeInViewport();
  });

  test('360px에서는 목차가 헤더 아래에 접혀 있고 펼치면 페이지를 고를 수 있다', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'one narrow run is enough');
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/docs/intro');
    await expect(page.locator('.docs-side')).toBeHidden();
    const toc = page.locator('.docs-mtoc');
    await expect(toc.locator('.docs-nav')).toBeHidden();
    await toc.locator('summary').click();
    await toc.getByRole('link', { name: '경험 카드' }).click();
    await expect(page).toHaveURL(/\/docs\/card$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
