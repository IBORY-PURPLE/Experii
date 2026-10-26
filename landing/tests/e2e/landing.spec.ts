import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Layout checks also run at short laptop windows, once, under the desktop project.
const SHORT = [
  { width: 1536, height: 730 },
  { width: 1366, height: 657 },
  { width: 1280, height: 690 },
];

const checkedChips = (page: Page) =>
  page.locator('form.su-form input[type="radio"]:checked, form.su-form input[name="ai_subscriptions"]:checked').evaluateAll((els) =>
    els.map((el) => `${(el as HTMLInputElement).name}=${(el as HTMLInputElement).value}`),
  );

const subscriptionGroup = async (page: Page) => {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as {
    nodes: { role?: { value: string }; name?: { value: string } }[];
  };
  return nodes.filter((n) => n.role?.value === 'group' && n.name?.value.includes('구독')).map((n) => n.name!.value);
};

for (const viewport of [null, ...SHORT]) {
  test.describe(viewport ? `레이아웃 ${viewport.width}×${viewport.height}` : '레이아웃', () => {
    if (viewport) {
      test.use({ viewport });
      test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'short windows run once, under desktop'));
    }

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

    test('가로 넘침이 없다', async ({ page }) => {
      await page.goto('/');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
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

    test('작동 방식 끝 링크는 지금 할 수 없는 행동을 약속하지 않고 사전 신청으로 보낸다', async ({ page }) => {
      await page.goto('/');
      const link = page.locator('#how a.how-link');
      await expect(link).toContainText('사전 신청');
      await expect(link).not.toContainText('시작하기');
      await link.click();
      await expect(page).toHaveURL(/#signup$/);
    });

    test('틱 내비의 현재 라벨은 히어로 카드를 덮지 않고, 다른 섹션에서는 넓은 화면에 보인다', async ({ page }) => {
      test.skip(page.viewportSize()!.width < 1280, 'the tick nav shows from 1280px');
      await page.goto('/');
      const label = page.locator('.ticks a[aria-current="true"] span');
      await expect(label).toHaveText('처음');
      const onCard = () =>
        label.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const c = document.querySelector('.hero-card')!.getBoundingClientRect();
          const covers = r.right > c.left && r.left < c.right && r.bottom > c.top && r.top < c.bottom;
          return covers && parseFloat(getComputedStyle(el).opacity) > 0;
        });
      await page.waitForTimeout(300);
      expect(await onCard()).toBe(false);

      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        const how = document.getElementById('how')!;
        scrollTo(0, how.getBoundingClientRect().top + scrollY - innerHeight * 0.3);
      });
      await expect(page.locator('.ticks a[href="#how"]')).toHaveAttribute('aria-current', 'true');
      if (page.viewportSize()!.width >= 1440) await expect(label).toHaveCSS('opacity', '1');
    });
  });
}

test.describe('landing', () => {
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

  test('동의만 빼고 제출해도 고른 칩과 이메일이 그대로 남고, 동의하면 그대로 신청된다', async ({ page }) => {
    await page.goto('/#signup');
    const form = page.locator('form.su-form');
    await page.locator('#f-email').fill('student@example.test');
    await form.getByLabel('대학생', { exact: true }).check();
    await form.getByLabel('지금 공부 중').check();
    await form.getByLabel('ChatGPT 유료').check();
    await form.getByRole('button', { name: '사전 신청하기' }).click();
    await expect(page.locator('#e-consent')).toBeVisible();
    await expect(form.locator('.err')).toHaveCount(1);
    expect(await checkedChips(page)).toEqual(['student_status=undergrad', 'sqld_status=studying', 'ai_subscriptions=chatgpt_paid']);
    await expect(page.locator('#f-email')).toHaveValue('student@example.test');

    await form.getByLabel(/만 14세 이상이며/).check();
    await form.getByRole('button', { name: '사전 신청하기' }).click();
    await expect(page.getByText('신청됐어요.')).toBeVisible();
  });

  test('구독 질문 그룹의 접근 이름은 질문과 안내가 띄어 읽힌다', async ({ page }) => {
    await page.goto('/#signup');
    await expect(page.locator('form.su-form')).toBeVisible();
    expect(await subscriptionGroup(page)).toEqual(['유료 AI 구독 여러 개 고를 수 있어요']);
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

  test('360px에서도 가로 넘침이 없고 앱 창 대신 안내 한 줄이 보인다', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await expect(page.locator('.hero-demo-note')).toBeVisible();
    await expect(page.locator('.hd-win')).toBeHidden();
    await page.locator('#stage').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test('깊은 링크 #signup은 로드 직후 굴러가지 않고 바로 도착하고, 페이지 안 링크는 부드럽게 내려간다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      const w = window as unknown as { __ys: number[] };
      w.__ys = [];
      const tick = () => {
        const y = Math.round(scrollY);
        if (w.__ys[w.__ys.length - 1] !== y) w.__ys.push(y);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const path = () => page.evaluate(() => (window as unknown as { __ys: number[] }).__ys);
    await page.goto('/#signup');
    await expect(page.locator('#su-h')).toBeInViewport();
    await page.waitForTimeout(1_500);
    const landed = await path();
    const first = landed.find((y) => y > 0)!;
    expect(first, `the first move lands (not 0 → a few px → …): ${landed.join(' → ')}`).toBeGreaterThanOrEqual(landed[landed.length - 1] * 0.9);

    await page.evaluate(() => {
      scrollTo({ top: 0, behavior: 'instant' });
      (window as unknown as { __ys: number[] }).__ys = [0];
    });
    await page.locator('#hero-cta a[href="#signup"]').click();
    await expect(page.locator('#su-h')).toBeInViewport();
    await page.waitForTimeout(1_500);
    expect((await path()).length, 'a click on an in-page link glides through many frames').toBeGreaterThan(10);
  });

  test('앱 아이콘(SVG)을 선언하고, 첫 화면을 여는 동안 실패하는 요청이 없다', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    const href = await page.locator('head link[rel="icon"][type="image/svg+xml"]').getAttribute('href');
    const icon = await page.request.get(href!);
    expect(icon.status()).toBe(200);
    expect(icon.headers()['content-type']).toContain('image/svg+xml');
    expect(await icon.text()).toContain('<svg');
    expect(failed, 'no request fails while the page opens (favicon.ico included)').toEqual([]);
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

});

test.describe('JS 없이 사전 신청', () => {
  test.use({ javaScriptEnabled: false });

  test('동의만 빼고 제출하면 오류와 함께 고른 칩과 이메일이 그대로 남고, 동의하면 그대로 신청된다', async ({ page }) => {
    await page.goto('/#signup');
    const form = page.locator('form.su-form');
    await page.locator('#f-email').fill('nojs@example.test');
    await form.locator('input[name="student_status"][value="undergrad"]').check({ force: true });
    await form.locator('input[name="sqld_status"][value="studying"]').check({ force: true });
    await form.locator('input[name="ai_subscriptions"][value="chatgpt_paid"]').check({ force: true });
    await form.getByRole('button', { name: '사전 신청하기' }).click();
    await expect(page.locator('#e-consent')).toBeVisible();
    await expect(page.locator('form.su-form .err')).toHaveCount(1);
    expect(await checkedChips(page)).toEqual(['student_status=undergrad', 'sqld_status=studying', 'ai_subscriptions=chatgpt_paid']);
    await expect(page.locator('#f-email')).toHaveValue('nojs@example.test');

    await page.locator('form.su-form input[name="consent"]').check();
    await page.locator('form.su-form').getByRole('button', { name: '사전 신청하기' }).click();
    await expect(page.getByText('신청됐어요.')).toBeVisible();
  });
});
