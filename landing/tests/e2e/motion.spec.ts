import { expect, test, type Page } from '@playwright/test';

// The scroll-in motion (components/motion: GSAP + ScrollTrigger, its own chunk) starts after the page has loaded
// and the main thread is idle, and flags itself on <html data-motion>: "on" while it holds elements back, "done"
// once every one is shown. Each [data-reveal] element is a candidate. It never hides anything before it runs.

const started = (page: Page) =>
  expect(page.locator('html')).toHaveAttribute('data-motion', /^(on|done)$/, { timeout: 15_000 });
const notShown = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1').length);
const jump = (page: Page, top: number) => page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top);
const bottom = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight);
const docTop = (page: Page, selector: string) =>
  page.evaluate((s) => document.querySelector(s)!.getBoundingClientRect().top + scrollY, selector);
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const inlineStyle = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => el.getAttribute('style') ?? '');

// Aborts the request that carries GSAP, whatever the chunk's file name is.
const blockGsap = (page: Page) =>
  page.route('**/_next/static/**/*.js', async (route) => {
    const res = await route.fetch();
    const body = await res.text();
    if (body.includes('ScrollTrigger')) return route.abort();
    return route.fulfill({ response: res, body });
  });

test.describe('모션 줄이기', () => {
  test.use({ reducedMotion: 'reduce' });

  test('내용은 처음부터 모두 보이고, 모션 코드는 받지도 않는다', async ({ page }) => {
    let gsap = false;
    page.on('response', async (r) => {
      if (r.url().endsWith('.js') && (await r.text().catch(() => '')).includes('ScrollTrigger')) gsap = true;
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3_500); // longer than the idle wait the motion would have started after
    expect(await notShown(page)).toBe(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/);
    expect(gsap, 'no GSAP chunk is fetched').toBe(false);
    expect(
      await page.evaluate(() => document.getAnimations().filter((a) => (a as CSSAnimation).animationName?.startsWith('hero-')).length),
      'the hero does not animate in',
    ).toBe(0);
    await expect(page.locator('#hero-h')).toHaveCSS('opacity', '1');
    await expect(page.locator('#hero-h')).toHaveCSS('transform', 'none');
  });

  test('버튼은 hover해도 움직이지 않는다', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#hero-cta .btn-soft');
    await btn.hover();
    await page.waitForTimeout(300);
    await expect(btn).toHaveCSS('transform', 'none');
  });
});

test.describe('움직임 허용', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('히어로는 제목 → 설명 → 버튼 → 앱 창 순서로 등장하고, 버튼과 앱 창은 투명도만 바뀐다', async ({ page }) => {
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { __hero: string[] }).__hero = seen;
      document.addEventListener(
        'animationstart',
        (e) => {
          const el = e.target as HTMLElement;
          if (!e.animationName.startsWith('hero-')) return;
          const who = el.matches('.hero-kicker') ? 'kicker' : el.matches('h1') ? 'title' : el.matches('.hero-sub') ? 'sub' : el.matches('.cta-row') ? 'cta' : 'shot';
          seen.push(`${who}:${e.animationName}`);
        },
        true,
      );
    });
    await page.goto('/');
    // the buttons and the app window start 180 and 270ms in, which can be after the load event
    const heroSteps = () => page.evaluate(() => (window as unknown as { __hero: string[] }).__hero.length);
    await expect.poll(heroSteps, { timeout: 5_000 }).toBe(5);
    const seen = await page.evaluate(() => (window as unknown as { __hero: string[] }).__hero);
    expect(seen.slice().sort(), 'five steps start').toEqual(['cta:hero-fade', 'kicker:hero-rise', 'shot:hero-fade', 'sub:hero-rise', 'title:hero-rise']);
    const at = (name: string) => seen.findIndex((s) => s.startsWith(`${name}:`));
    expect(Math.max(at('kicker'), at('title')), 'title before sub').toBeLessThan(at('sub'));
    expect(at('sub'), 'sub before the buttons').toBeLessThan(at('cta'));
    expect(at('cta'), 'buttons before the app window').toBeLessThan(at('shot'));

    await page.waitForTimeout(1_600);
    for (const sel of ['.hero-kicker', '#hero-h', '.hero-sub', '#hero-cta']) {
      await expect(page.locator(sel)).toHaveCSS('opacity', '1');
      await expect(page.locator(sel)).toHaveCSS('transform', 'none');
    }
  });

  test('스크롤하면 나타나고, 끝나면 인라인 스타일을 남기지 않는다', async ({ page }) => {
    await page.goto('/');
    const before = await overflow(page);
    await started(page);
    const head = page.locator('#problem .sec-head');
    await expect(head, 'held back until it is reached').toHaveCSS('opacity', '0');
    await jump(page, (await docTop(page, '#problem .sec-head')) - 400);
    await expect(head).toHaveCSS('opacity', '1');
    await expect(head).toHaveCSS('transform', 'none');
    expect(await inlineStyle(page, '#problem .sec-head')).toBe('');
    expect(await overflow(page), 'the motion adds no sideways scroll').toBeLessThanOrEqual(before);
  });

  test('한 줄에 놓인 카드는 시차를 두고 차례로 나타난다', async ({ page }) => {
    test.skip(page.viewportSize()!.width < 1024, 'the four cards share a row from 1024px');
    await page.goto('/');
    await started(page);
    const top = (await docTop(page, '.tl-cards')) - page.viewportSize()!.height * 0.5;
    const frames = await page.evaluate(async (y) => {
      const cards = [...document.querySelectorAll('.tl-cards .tc')];
      const out: number[][] = [];
      scrollTo({ top: y, behavior: 'instant' });
      const t0 = performance.now();
      await new Promise<void>((done) => {
        const tick = () => {
          out.push(cards.map((c) => +getComputedStyle(c).opacity));
          if (performance.now() - t0 < 2_200) requestAnimationFrame(tick);
          else done();
        };
        requestAnimationFrame(tick);
      });
      return out;
    }, top);
    expect(frames[0]).toHaveLength(4);
    for (const f of frames) for (let i = 1; i < 4; i++) expect(f[i - 1], `card ${i} is never ahead of card ${i + 1}: ${f}`).toBeGreaterThanOrEqual(f[i] - 1e-6);
    expect(frames.some((f) => f[0] - f[3] > 0.05), 'there are frames where the first is well ahead of the last').toBe(true);
    expect(frames[frames.length - 1]).toEqual([1, 1, 1, 1]);
  });

  test('한 번만 재생한다: 위로 갔다 다시 내려와도 다시 숨지 않는다', async ({ page }) => {
    await page.goto('/');
    await started(page);
    const where = (await docTop(page, '#problem .sec-head')) - 300;
    await jump(page, where);
    await expect(page.locator('#problem .sec-head')).toHaveCSS('opacity', '1');
    const min = await page.evaluate(async (y) => {
      const el = document.querySelector('#problem .sec-head')!;
      let lowest = 1;
      for (const to of [0, y, 0, y]) {
        scrollTo({ top: to, behavior: 'instant' });
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => requestAnimationFrame(r));
          lowest = Math.min(lowest, +getComputedStyle(el).opacity);
        }
      }
      return lowest;
    }, where);
    expect(min).toBe(1);
  });

  test('한 번에 끝까지 내려가도 건너뛴 것까지 모두 보이고, 정리하고 끝난다', async ({ page }) => {
    await page.goto('/');
    const before = await overflow(page);
    await started(page);
    await jump(page, await bottom(page));
    await expect.poll(() => notShown(page), { timeout: 5_000 }).toBe(0);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'done');
    await jump(page, 0);
    expect(await notShown(page)).toBe(0);
    expect(await overflow(page), 'the motion adds no sideways scroll').toBeLessThanOrEqual(before);
  });

  test('깊은 링크 #signup으로 도착하면 사전 신청은 바로 보이고, 위쪽 요소는 숨어 있지 않다', async ({ page }) => {
    await page.goto('/#signup');
    await started(page);
    await expect.poll(() => notShown(page), { timeout: 5_000 }).toBe(0);
    await expect(page.locator('#su-h')).toBeInViewport();
    await expect(page.locator('#signup .su-copy')).toHaveCSS('opacity', '1');
    await page.locator('#f-email').fill('motion@example.test');
    await expect(page.locator('#f-email')).toHaveValue('motion@example.test');
    await jump(page, 0);
    expect(await notShown(page), 'scrolling up finds nothing held back').toBe(0);
  });

  test('모션 코드를 받지 못해도 내용은 숨지 않는다', async ({ page }) => {
    await blockGsap(page);
    await page.goto('/');
    await page.waitForTimeout(4_500); // past the idle wait
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/);
    expect(await notShown(page)).toBe(0);
    await jump(page, await bottom(page));
    expect(await notShown(page)).toBe(0);
  });

  test('안전망: 트리거가 울리지 않아도 줄 안에 든 요소는 2초 안에 나타난다', async ({ page }) => {
    await page.goto('/');
    await started(page);
    // Collapsing sections moves everything below them up, past the trigger lines ScrollTrigger measured earlier.
    await page.evaluate(() => {
      for (const id of ['problem', 'shift', 'difference']) document.getElementById(id)!.style.display = 'none';
    });
    const copy = page.locator('#signup .su-copy');
    await jump(page, (await docTop(page, '#signup .su-copy')) - 120);
    await page.waitForTimeout(800);
    await expect(copy, 'its trigger cannot fire: it is still held back').toHaveCSS('opacity', '0');
    await expect(copy).toHaveCSS('opacity', '1', { timeout: 4_000 });
  });

  test('보는 중에 모션 줄이기를 켜면 남은 것이 모두 바로 보인다', async ({ page }) => {
    await page.goto('/');
    await started(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
    expect(await notShown(page)).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => notShown(page), { timeout: 2_000 }).toBe(0);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'done');
  });

  test('다른 페이지에 갔다가 뒤로 와도 숨은 채로 남는 것이 없다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/');
    await started(page);
    await jump(page, (await docTop(page, '#shift')) - 200);
    await page.locator('.nav-menu a[href="/docs/intro"], a[href="/docs/intro"]').first().click();
    await expect(page).toHaveURL(/\/docs\/intro$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await started(page);
    await jump(page, await bottom(page));
    await expect.poll(() => notShown(page), { timeout: 5_000 }).toBe(0);
    expect(errors).toEqual([]);
  });

  test('끝나면 타이머와 프레임 루프를 남기지 않는다', async ({ page }) => {
    await page.addInitScript(() => {
      const live = new Set<number>();
      const w = window as unknown as { __live: Set<number>; __raf: number };
      w.__live = live;
      w.__raf = 0;
      const set = window.setInterval.bind(window);
      const clear = window.clearInterval.bind(window);
      window.setInterval = ((...a: Parameters<typeof setInterval>) => {
        const id = set(...a) as unknown as number;
        live.add(id);
        return id;
      }) as typeof setInterval;
      window.clearInterval = ((id?: number) => {
        live.delete(id as number);
        return clear(id);
      }) as typeof clearInterval;
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => {
        w.__raf++;
        return raf(cb);
      };
    });
    await page.goto('/');
    await started(page);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __live: Set<number> }).__live.size), { message: 'ScrollTrigger keeps a timer while it works' }).toBeGreaterThan(0);
    await jump(page, await bottom(page)); // the hero window is off screen here, so its own clock is paused too
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'done', { timeout: 6_000 });
    await page.waitForTimeout(300);
    await page.evaluate(() => ((window as unknown as { __raf: number }).__raf = 0));
    await page.waitForTimeout(1_000);
    expect(await page.evaluate(() => (window as unknown as { __live: Set<number> }).__live.size), 'no interval is left running').toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __raf: number }).__raf), 'no animation frame is requested').toBe(0);
  });

  test('키보드로 닿은 숨은 입력칸도 나타나고 쓸 수 있다', async ({ page }) => {
    await page.goto('/');
    await started(page);
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    let reached = false;
    for (let i = 0; i < 120 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => document.activeElement?.id === 'f-email');
    }
    expect(reached, 'Tab reaches the email field').toBe(true);
    await expect(page.locator('#signup .su-copy')).toHaveCSS('opacity', '1');
    await expect(page.locator('#f-email').locator('xpath=ancestor::div[@data-reveal]')).toHaveCSS('opacity', '1');
    await page.keyboard.type('keyboard@example.test');
    await expect(page.locator('#f-email')).toHaveValue('keyboard@example.test');
    await expect(page.locator('#f-email')).toBeInViewport();
  });

  test('나타나는 동안에도 가로 스크롤이 늘지 않는다', async ({ page }) => {
    await page.goto('/');
    const before = await overflow(page);
    await started(page);
    const worst = await page.evaluate(async () => {
      let max = 0;
      const total = document.documentElement.scrollHeight;
      for (let y = 0; y < total; y += 400) {
        scrollTo({ top: y, behavior: 'instant' });
        for (let i = 0; i < 6; i++) {
          await new Promise((r) => requestAnimationFrame(r));
          max = Math.max(max, document.documentElement.scrollWidth - innerWidth);
        }
      }
      return max;
    });
    expect(worst).toBeLessThanOrEqual(before);
  });

  test('버튼은 hover하면 2px 뜨고, 누르면 눌리며, 벗어나면 돌아온다', async ({ page, hasTouch }) => {
    test.skip(!!hasTouch, 'a touch screen has nothing to hover with');
    await page.goto('/');
    const btn = page.locator('#hero-cta .btn-soft');
    await expect(btn).toHaveCSS('transform', 'none');
    await btn.hover();
    await expect(btn).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -2)');
    await page.mouse.down();
    await expect(btn, 'a press wins over the hover').toHaveCSS('transform', 'matrix(0.97, 0, 0, 0.97, 0, 0)');
    await page.mouse.up();
    await page.mouse.move(2, 2);
    await expect(btn).toHaveCSS('transform', 'none');
    const dl = page.locator('#hero-cta .btn-dl');
    await dl.hover();
    await expect(dl).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -2)');
  });
});
