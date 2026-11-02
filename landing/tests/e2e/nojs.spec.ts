import { expect, test } from '@playwright/test';

test.describe('JS 없음', () => {
  test('흐름 섹션의 세 단계와 연결 문구가 모두 보인다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#flow h2')).toBeVisible();
    const steps = page.locator('#flow .flow-step');
    await expect(steps).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(steps.nth(i)).toBeVisible();
    await expect(page.locator('#flow .flow-new')).toBeVisible();
  });

  test('작동 방식 4단계가 세로로 모두 보인다', async ({ page }) => {
    await page.goto('/');
    const panels = page.locator('#stage .panel');
    await expect(panels).toHaveCount(4);
    for (let i = 0; i < 4; i++) await expect(panels.nth(i)).toBeVisible();
    await expect(page.locator('#stage [role="tabpanel"]')).toHaveCount(0);
    await expect(page.locator('#stage').getByText('LEFT JOIN orders o').first()).toBeVisible();
  });

  for (const size of [
    { width: 360, height: 780 },
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1536, height: 730 },
    { width: 1366, height: 657 },
    { width: 1280, height: 690 },
  ]) {
    test(`히어로 앱 창과 캡션은 ChatGPT 연결 직후의 정지 화면으로 보인다 (${size.width}×${size.height})`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      const win = page.locator('.bd-win');
      await expect(win).toBeVisible();
      await expect(win.locator('.tab-label')).toHaveText('필기 3개');
      await expect(win.locator('.world .sticky:visible')).toHaveCount(3);
      await expect(win.locator('.chat-head h2')).toHaveText('새 대화');
      await expect(win.locator('.subject .count')).toHaveText('0');
      await expect(page.locator('.bd-now-text:visible')).toHaveText('쓰던 ChatGPT 연결');
      await expect(page.locator('.bd-steps li')).toHaveText(['연결', '캡처', '정리', '추천', '면접']);
      await expect(page.locator('.bd-steps li[aria-current="step"]')).toHaveText('연결');
      await expect(page.locator('#bd')).toHaveAttribute('data-play', 'idle');
      await expect(page.locator('.hero-demo-note')).toBeVisible();
      await expect(page.locator('.bd-pause')).toBeHidden();
      const bar = (await win.locator('.bd-titlebar').boundingBox())!;
      expect(bar.y + bar.height, "the window's title bar is whole on the first screen").toBeLessThanOrEqual(size.height);
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

  test('스크롤 등장 대상은 JS가 없으면 숨지 않고 처음부터 모두 보인다', async ({ page }) => {
    await page.goto('/');
    const states = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].map((el) => {
        const cs = getComputedStyle(el);
        return { opacity: cs.opacity, transform: cs.transform, style: el.getAttribute('style') };
      }),
    );
    expect(states.length, 'the page marks its reveal targets').toBeGreaterThan(20);
    expect(states.filter((s) => s.opacity !== '1' || s.transform !== 'none' || s.style)).toEqual([]);
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/);
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

  test('가이드 목차는 JS 없이도 펼쳐서 다른 페이지로 갈 수 있다', async ({ page }) => {
    await page.goto('/docs/intro');
    await page.locator('.docs-mtoc summary').click();
    await page.locator('.docs-mtoc').getByRole('link', { name: '자주 묻는 질문' }).click();
    await expect(page).toHaveURL(/\/docs\/faq$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('자주 묻는 질문');
  });
});

test.describe('JS 없음, 움직임 허용', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('히어로 등장은 CSS만으로 끝나 글씨와 버튼이 모두 보이고, 스크롤 등장 대상은 숨지 않는다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1_600); // the entrance lasts under 1s
    for (const sel of ['.hero-kicker', '#hero-h', '.hero-sub', '#hero-cta']) {
      await expect(page.locator(sel)).toHaveCSS('opacity', '1');
      await expect(page.locator(sel)).toHaveCSS('transform', 'none');
    }
    const held = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1' || el.hasAttribute('style')).length,
    );
    expect(held).toBe(0);
  });
});
