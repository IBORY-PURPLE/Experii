import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { flow, hero } from '@/content/landing';

test.describe('히어로 상단 라벨', () => {
  test('제품 이름이 앞에 오고 뒷부분보다 진하다', async ({ page }) => {
    await page.goto('/');
    const kicker = page.locator('.hero-kicker');
    await expect(kicker).toHaveText(`${hero.brand} · ${hero.kicker}`);
    await expect(kicker.locator('b')).toHaveText(hero.brand);
    const look = await kicker.evaluate((el) => {
      const rest = getComputedStyle(el);
      const brand = getComputedStyle(el.querySelector('b')!);
      return { brandWeight: Number(brand.fontWeight), restWeight: Number(rest.fontWeight), brandColor: brand.color, restColor: rest.color };
    });
    expect(look.brandWeight).toBeGreaterThan(look.restWeight);
    expect(look.brandColor).not.toBe(look.restColor);
  });

  test('히어로 제목과 두 단추는 그대로다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero-h')).toHaveText(hero.headlines.h1.join(' '));
    await expect(page.locator('#hero-cta .btn-dl')).toContainText('Windows 앱 다운로드');
    await expect(page.locator('#hero-cta .btn-dl')).toContainText('출시 예정');
    await expect(page.locator('#hero-cta a[href="#signup"]')).toHaveText(hero.ctaSignup);
  });
});

test.describe('흐름 섹션', () => {
  test('히어로 바로 아래, 다음 섹션 위에 있고 문구가 그대로 보인다', async ({ page }) => {
    await page.goto('/');
    const firstTwo = await page.evaluate(() => [...document.querySelectorAll('main > section')].slice(0, 2).map((s) => s.id));
    expect(firstTwo).toEqual(['top', 'flow']);

    const sec = page.locator('#flow');
    await expect(sec.getByRole('heading', { level: 2 })).toHaveText(flow.title);
    await expect(sec.locator('.lead')).toHaveText(flow.lead);
    const heads = sec.getByRole('heading', { level: 3 });
    await expect(heads).toHaveCount(3);
    for (const [i, s] of flow.steps.entries()) {
      await expect(heads.nth(i)).toHaveText(`${s.unit} · ${s.title}`);
      await expect(sec.locator('.flow-step p').nth(i)).toHaveText(s.body);
    }
    await expect(sec.locator('.flow-old')).toHaveText(flow.bridge.other);
    await expect(sec.locator('.flow-new')).toHaveText('Experii는 내가 공부한 기록에서 질문합니다.');
    await expect(sec.locator('.flow-new b')).toHaveText('내가 공부한 기록');
  });

  test('번호 매듭은 세 개이고 글자는 16px 이상이며 배지가 없다', async ({ page }) => {
    await page.goto('/');
    const sec = page.locator('#flow');
    // the numbers come from a CSS counter, so the page text carries each unit label once, in the heading
    await expect(sec.locator('.flow-knot')).toHaveCount(3);
    await expect(sec.locator('.flow-knot[aria-hidden="true"]'), 'the knots are decoration for assistive tech').toHaveCount(3);
    const small = await sec.locator('h2, h3, p').evaluateAll((els) =>
      els.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => e.textContent),
    );
    expect(small, 'every line of the section is at least 16px').toEqual([]);
    await expect(sec.locator('.ex, .badge')).toHaveCount(0);
  });

  test('가로로 넘치지 않고, 접근성 심각 위반이 없다', async ({ page }) => {
    await page.goto('/');
    await page.locator('#flow').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    const results = await new AxeBuilder({ page }).include('#flow').analyze();
    expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });

  test('넓은 화면에서는 제목이 단계 옆에 붙어 따라온다', async ({ page }) => {
    test.skip(page.viewportSize()!.width < 1024, 'desktop layout only');
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      const step = document.querySelectorAll('#flow .flow-step')[1]!;
      scrollTo(0, step.getBoundingClientRect().top + scrollY - 160);
    });
    const top = await page.locator('#flow .flow-head').evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.round(top), 'the heading holds at the sticky offset').toBe(110);
  });
});
