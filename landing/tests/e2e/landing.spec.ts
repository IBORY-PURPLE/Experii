import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('landing', () => {
  test('Before→After 그림과 출처 칩이 히어로 바로 아래에 있다', async ({ page }) => {
    await page.goto('/');
    const heroBottom = (await page.locator('.hero-card').boundingBox())!;
    const figure = page.locator('.ba figure.interview');
    for (const sel of ['.bub-q', '.bub-before', '.bub-after', '.src-chip']) await expect(figure.locator(sel)).toHaveCount(1);
    const box = (await figure.boundingBox())!;
    expect(box.y).toBeGreaterThan(heroBottom.y + heroBottom.height - 1);
    expect(box.y - (heroBottom.y + heroBottom.height)).toBeLessThan(200);
  });

  test('히어로 CTA를 누르면 사전 신청으로 간다', async ({ page }) => {
    await page.goto('/');
    await page.locator('#hero-cta a[href="#signup"]').click();
    await expect(page).toHaveURL(/#signup$/);
    await expect(page.locator('#su-h')).toBeInViewport();
  });

  test('필수 누락이면 필드별 오류와 첫 필드 포커스, 채우면 완료 화면', async ({ page }) => {
    await page.goto('/#signup');
    const form = page.locator('form.su-form');
    await form.getByRole('button', { name: '사전 신청하기' }).click();
    await expect(form.locator('.err')).toHaveCount(5);
    await expect(page.locator('#f-email')).toBeFocused();

    await page.locator('#f-email').fill('student@example.test');
    await form.getByLabel('대학생', { exact: true }).check();
    await form.getByLabel('지금 공부 중').check();
    await form.getByLabel('ChatGPT 유료').check();
    await form.getByLabel('유료 구독 없음').check();
    await expect(form.getByLabel('ChatGPT 유료')).not.toBeChecked();
    await form.getByLabel(/만 14세 이상이며/).check();
    await form.getByRole('button', { name: '사전 신청하기' }).click();
    await expect(page.getByText('신청됐어요.')).toBeVisible();
    await expect(page.locator('.su-done')).toBeFocused();
  });

  test('UTM 값이 숨은 필드에 들어간다', async ({ page }) => {
    await page.goto('/?utm_source=kakao&utm_medium=social&utm_campaign=waitlist-2026-11#signup');
    await expect(page.locator('input[name="utm_source"]')).toHaveValue('kakao');
    await expect(page.locator('input[name="utm_campaign"]')).toHaveValue('waitlist-2026-11');
    await expect(page.locator('input[name="hero_variant"]')).toHaveValue('h1');
  });

  test('히어로 변형 페이지는 다른 제목과 hero_variant를 쓴다', async ({ page }) => {
    await page.goto('/v/h2');
    await expect(page.locator('#hero-h')).toContainText('자격증 있어요');
    await expect(page.locator('input[name="hero_variant"]')).toHaveValue('h2');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /localhost:3000\/?$/);
  });

  test('가로 넘침이 없다', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('360px에서도 가로 넘침이 없고 앱 창 대신 안내 한 줄이 보인다', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await expect(page.locator('.hero-demo-note')).toBeVisible();
    await expect(page.locator('.hd-win')).toBeHidden();
    await page.locator('#stage').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test('페이지 글자는 13px 이상이다', async ({ page }) => {
    await page.goto('/');
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((el) => !el.closest('.sr-only, [hidden], nextjs-portal') && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
        .filter((el) => (el as HTMLElement).offsetParent !== null || getComputedStyle(el).position === 'fixed')
        .map((el) => [el.tagName + '.' + (el as HTMLElement).className, parseFloat(getComputedStyle(el).fontSize)] as const)
        .filter(([, size]) => size < 13),
    );
    expect(small).toEqual([]);
  });

  test('axe serious·critical 위반이 없다', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).exclude('nextjs-portal').analyze();
    const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('처리방침 페이지가 열린다', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('개인정보 처리방침');
  });

  test('처리방침 각 절은 브라우저 접근성 트리에서 제목 이름을 가진 영역이다', async ({ page }) => {
    await page.goto('/privacy');
    const headings = await page.locator('main h2').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as {
      nodes: { role?: { value: string }; name?: { value: string } }[];
    };
    const regions = nodes.filter((n) => n.role?.value === 'region').map((n) => n.name?.value);
    expect(regions).toEqual(headings);
  });

  test('좁은 화면의 하단 고정 버튼은 화면 바닥에 붙고 꼬리말 아래에 빈 공간을 만들지 않는다', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
    const cta = page.locator('[data-cta="sticky"]');
    await page.locator('#difference').evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY));
    await expect(cta.locator('xpath=..')).toHaveAttribute('data-show', '');
    await expect.poll(async () => Math.round((await cta.locator('xpath=..').boundingBox())!.y + (await cta.locator('xpath=..').boundingBox())!.height)).toBe(780);

    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const below = await page.evaluate(
      () => document.documentElement.scrollHeight - (document.querySelector('footer')!.getBoundingClientRect().bottom + scrollY),
    );
    expect(below).toBeLessThanOrEqual(1);
  });

  test('작동 방식 끝 링크는 지금 할 수 없는 행동을 약속하지 않고 사전 신청으로 보낸다', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('#how a.how-link');
    await expect(link).toContainText('사전 신청');
    await expect(link).not.toContainText('시작하기');
    await link.click();
    await expect(page).toHaveURL(/#signup$/);
  });
});
