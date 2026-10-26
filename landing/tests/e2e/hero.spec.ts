import { expect, test, type Page } from '@playwright/test';

const desktopOnly = (page: Page) => test.skip(page.viewportSize()!.width < 1024, 'desktop layout only');

const inFirstScreen = async (page: Page, selector: string) => {
  const vh = page.viewportSize()!.height;
  const box = await page.locator(selector).first().boundingBox();
  expect(box, selector).not.toBeNull();
  expect(box!.y, selector).toBeGreaterThanOrEqual(0);
  expect(box!.y, selector).toBeLessThan(vh);
  return box!;
};

// html has scroll-behavior: smooth; tests jump.
const jump = (page: Page, y: number) => page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);

test.describe('히어로', () => {
  test('첫 화면에 제목, 다운로드 버튼, 앱 창 윗부분이 보인다', async ({ page }) => {
    desktopOnly(page);
    await page.goto('/');
    const vh = page.viewportSize()!.height;
    const h1 = await inFirstScreen(page, '#hero-h');
    expect(h1.y + h1.height).toBeLessThan(vh);
    const dl = await inFirstScreen(page, '#hero-cta [data-download="hero"]');
    expect(dl.y + dl.height).toBeLessThan(vh);
    await expect(page.locator('#hero-cta [data-download="hero"]')).toHaveText(/Windows 앱 다운로드/);
    await expect(page.locator('#hero-cta [data-download="hero"]')).toContainText('출시 예정');
    await expect(page.locator('#hero-cta a[href="#signup"]')).toHaveText('사전 신청하기');
    const win = await inFirstScreen(page, '.hd-win .aw');
    expect(vh - win.y, 'the window shows at least 300px above the fold').toBeGreaterThanOrEqual(300);
    await expect(page.locator('.hd-win .aw-bar')).toContainText('예시 화면');
    await expect(page.locator('.hd-win .aw-side')).toContainText('오늘 공부');
    await expect(page.locator('.hd-win .aw-side')).toContainText('리마인드');
    await expect(page.locator('.hd-win .aw-side')).toContainText('SQLD · 2과목');
  });

  test('앱 창은 히어로 카드 아래 경계에서 잘린다', async ({ page }) => {
    desktopOnly(page);
    await page.goto('/');
    const card = (await page.locator('.hero-card').boundingBox())!;
    const win = (await page.locator('.hd-win .aw').boundingBox())!;
    expect(win.y + win.height).toBeGreaterThan(card.y + card.height);
  });

  test('동작 줄이기에서는 처음부터 마지막 장면이 정지 화면으로 보인다', async ({ page }) => {
    desktopOnly(page);
    await page.addInitScript(() => {
      const w = window as unknown as { __scenes: string[] };
      w.__scenes = [];
      const log = () => {
        const s = document.querySelector<HTMLElement>('.hero-demo')?.dataset.scene;
        if (s && w.__scenes[w.__scenes.length - 1] !== s) w.__scenes.push(s);
      };
      new MutationObserver(log).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-scene'] });
    });
    await page.goto('/');
    const hd = page.locator('.hero-demo');
    await expect(hd).toHaveAttribute('data-play', 'ended');
    await expect(hd).toHaveAttribute('data-scene', 'opened');
    await expect(hd.locator('.hd-scene.on .revisit-line')).toContainText('다시 본 날');
    await expect(hd.locator('.hd-scene.on .revisit-line .dot.on')).toHaveCount(3);
    await expect(hd.locator('.aw-count')).toHaveText('4');
    await expect(hd.locator('.hd-cursor')).toHaveCSS('opacity', '0');
    await expect(page.getByRole('button', { name: /다시 보기/ })).toBeVisible();
    const answer = (await hd.locator('.hd-scene.on .xc-a').boundingBox())!;
    expect(answer.y + answer.height, "the card's answer line fits the first screen").toBeLessThanOrEqual(page.viewportSize()!.height);
    await page.waitForTimeout(1_000);
    expect(await page.evaluate(() => (window as unknown as { __scenes: string[] }).__scenes), 'the first frame never flashes').toEqual(['opened']);
  });
});

test.describe('히어로 자동 재생', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('끝까지 한 번 재생되고, 일시정지가 멈추고, 다시 보기가 처음부터 튼다', async ({ page }) => {
    desktopOnly(page);
    test.setTimeout(120_000);
    await page.addInitScript(() => {
      const w = window as unknown as {
        __beats: string[];
        __switch: string[] | null;
        __toast: { min: number; seen: string[] };
        __dates: number;
      };
      w.__beats = [];
      w.__switch = null;
      w.__toast = { min: 1, seen: [] };
      w.__dates = 0;
      const boxes = () =>
        ['.hd-win', '.hd-ctrl', '.aw-side', '#hero-cta'].map((s) => {
          const r = document.querySelector(s)?.getBoundingClientRect();
          return r ? `${s} ${r.x},${r.y},${r.width},${r.height}` : `${s} missing`;
        });
      let prev: string[] = [];
      const log = () => {
        const hd = document.querySelector<HTMLElement>('.hero-demo');
        if (!hd) return;
        const beat = `${hd.dataset.scene}:${hd.dataset.remind}`;
        const last = w.__beats[w.__beats.length - 1];
        if (last === 'opened:0' && beat === 'home:0' && !w.__switch) {
          const now = boxes();
          w.__switch = now.filter((b, i) => b !== prev[i]);
        }
        if (last !== beat) w.__beats.push(beat);
      };
      new MutationObserver(log).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-scene', 'data-remind'] });
      document.addEventListener('DOMContentLoaded', log);
      const tick = () => {
        const hd = document.querySelector<HTMLElement>('.hero-demo');
        if (hd) {
          prev = boxes();
          if (hd.dataset.remind !== '0') {
            const front = hd.querySelector<HTMLElement>('.hd-toasts .notif[data-off="0"]');
            if (front && getComputedStyle(front).visibility === 'visible') {
              w.__toast.min = Math.min(w.__toast.min, +getComputedStyle(front).opacity);
              if (!w.__toast.seen.includes(hd.dataset.remind!)) w.__toast.seen.push(hd.dataset.remind!);
            }
            const box = hd.querySelector('.hd-date')!.getBoundingClientRect();
            const shown = [...hd.querySelectorAll<HTMLElement>('.hd-date .md')]
              .filter((el) => +getComputedStyle(el.closest('.ld')!).opacity > 0.02)
              .map((el) => el.getBoundingClientRect())
              .map((r) => [Math.max(r.top, box.top), Math.min(r.bottom, box.bottom)])
              .filter(([a, b]) => b > a);
            for (let i = 1; i < shown.length; i++)
              if (shown[i][0] < shown[i - 1][1] && shown[i - 1][0] < shown[i][1]) w.__dates++;
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto('/');
    const hd = page.locator('.hero-demo');
    await expect(hd).toHaveAttribute('data-play', 'playing');
    await expect(hd.locator('.hd-cursor')).toHaveCSS('opacity', '1');
    await expect(hd.locator('.hd-ask .typed')).toContainText('LEFT JOIN', { timeout: 5_000 });

    await expect(hd).toHaveAttribute('data-scene', 'study', { timeout: 10_000 });
    const pause = page.getByRole('button', { name: /일시정지/ });
    await expect(pause).toBeVisible();
    const ctrlBox = await pause.boundingBox();
    await pause.click();
    await expect(hd).toHaveAttribute('data-play', 'paused');
    const shown = () => hd.locator('.hd-flow').evaluate((el) => el.querySelectorAll('*').length);
    const before = await shown();
    await page.waitForTimeout(2_000);
    expect(await shown(), 'nothing new appears while paused').toBe(before);
    expect(await page.getByRole('button', { name: /재생/ }).boundingBox(), 'the button keeps its box when its label changes').toEqual(ctrlBox);
    await page.getByRole('button', { name: /재생/ }).click();
    await expect(hd).toHaveAttribute('data-play', 'playing');

    await expect(hd.locator('.opt.on')).toHaveText('LEFT JOIN', { timeout: 20_000 });
    await expect(hd.locator('.blank.is-right')).toHaveText('LEFT JOIN');
    await expect(hd.locator('.res-table caption')).toHaveText('결과 2행');
    await expect(hd.locator('.aw-count')).toHaveText('4', { timeout: 15_000 });
    await expect(hd.locator('.hd-toasts .notif[data-off="0"]')).toContainText('11월 25일 수요일', { timeout: 15_000 });

    await expect(hd).toHaveAttribute('data-play', 'ended', { timeout: 20_000 });
    await expect(hd).toHaveAttribute('data-scene', 'opened');
    await expect(hd.locator('.hd-scene.on .revisit-line .dot.on')).toHaveCount(3);
    expect(await page.getByRole('button', { name: /다시 보기/ }).boundingBox()).toEqual(ctrlBox);
    const got = await page.evaluate(() => {
      const w = window as unknown as { __beats: string[]; __switch: string[] | null; __toast: { min: number; seen: string[] }; __dates: number };
      return { beats: w.__beats, moved: w.__switch, toast: w.__toast, dates: w.__dates };
    });
    expect(got.beats[0], 'the server HTML shows the finished loop').toBe('opened:0');
    expect(got.moved, 'switching from the finished loop to the first frame moves nothing').toEqual([]);
    expect(got.beats.filter((b, i) => b !== got.beats[i - 1])).toEqual(
      expect.arrayContaining(['home:0', 'study:0', 'study:1', 'study:2', 'study:3', 'opened:0']),
    );
    expect(got.beats.indexOf('study:1')).toBeLessThan(got.beats.indexOf('study:3'));
    expect(got.beats.indexOf('study:3')).toBeLessThan(got.beats.lastIndexOf('opened:0'));
    expect(got.toast.seen.sort(), 'every reminder arrived as the front toast').toEqual(['1', '2', '3']);
    expect(got.toast.min, 'the arriving toast is opaque from its first frame, so the one behind never shows through').toBe(1);
    expect(got.dates, 'outgoing and incoming dates never overlap').toBe(0);

    const again = page.getByRole('button', { name: /다시 보기/ });
    await expect(again).toBeVisible();
    await again.click();
    await expect(hd).toHaveAttribute('data-play', 'playing');
    await expect(hd).toHaveAttribute('data-scene', 'home');
    await expect(hd.locator('.aw-count')).toHaveText('3');
  });

  test('스크롤하지 않은 첫 화면에서 과제·SQL과 보기·결과·답변 한 줄이 각각 2초 이상 온전히 보인다', async ({ page }) => {
    desktopOnly(page);
    test.setTimeout(90_000);
    const key = { task: '.hd-flow .task', solve: '.hd-flow .solve', result: '.hd-flow .result', answer: '.hd-flow .xc-a' };
    await page.addInitScript((sel) => {
      const w = window as unknown as { __read: { ms: Record<string, number>; maxScroll: number } };
      w.__read = { ms: Object.fromEntries(Object.keys(sel).map((k) => [k, 0])), maxScroll: 0 };
      let last = 0;
      const tick = (ts: number) => {
        const dt = last ? ts - last : 0;
        last = ts;
        w.__read.maxScroll = Math.max(w.__read.maxScroll, scrollY);
        const hd = document.querySelector<HTMLElement>('.hero-demo');
        if (hd?.dataset.scene === 'study' && hd.dataset.remind === '0') {
          const thread = hd.querySelector('.hd-thread')!.getBoundingClientRect();
          const top = Math.max(thread.top, document.querySelector('.nav')?.getBoundingClientRect().bottom ?? 0);
          const bottom = Math.min(thread.bottom, innerHeight);
          for (const [k, s] of Object.entries(sel)) {
            const el = hd.querySelector<HTMLElement>(s);
            if (!el) continue;
            const r = el.getBoundingClientRect();
            const opaque = +getComputedStyle(el.closest('.hd-flow > *')!).opacity >= 0.99;
            if (opaque && r.height > 0 && r.top >= top - 0.5 && r.bottom <= bottom + 0.5) w.__read.ms[k] += dt;
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, key);
    await page.goto('/');
    const hd = page.locator('.hero-demo');
    await expect(hd).toHaveAttribute('data-play', 'playing');
    await expect(hd).toHaveAttribute('data-play', 'ended', { timeout: 60_000 });
    const read = await page.evaluate(() => (window as unknown as { __read: { ms: Record<string, number>; maxScroll: number } }).__read);
    expect(read.maxScroll, 'the visitor never scrolled').toBe(0);
    for (const k of Object.keys(key)) expect(read.ms[k], `${k} whole on screen (ms)`).toBeGreaterThanOrEqual(2000);
  });

  test('재생이 움직이는 동안 일시정지 버튼은 어느 스크롤 위치에서도 가려지지 않는다', async ({ page }) => {
    desktopOnly(page);
    test.setTimeout(120_000);
    await page.goto('/');
    await expect(page.locator('.hero-demo')).toHaveAttribute('data-play', 'playing');
    const seen: { y: number; moving: boolean; uncovered: boolean }[] = [];
    for (const y of [0, 150, 250, 350, 410, 453, 525, 600, 700, 800, 880, 925]) {
      await jump(page, y);
      await page.waitForTimeout(250);
      const r = await page.evaluate(
        () =>
          new Promise<{ moving: boolean; uncovered: boolean }>((resolve) => {
            const ctrl = document.querySelector<HTMLElement>('.hd-ctrl')!;
            const uncovered = () => {
              const b = ctrl.getBoundingClientRect();
              const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
              return !!hit && ctrl.contains(hit);
            };
            // the longest stretch with no DOM change while playing is under 3.5s
            const timer = setTimeout(() => {
              mo.disconnect();
              resolve({ moving: false, uncovered: uncovered() });
            }, 4_000);
            const mo = new MutationObserver(() => {
              clearTimeout(timer);
              mo.disconnect();
              resolve({ moving: true, uncovered: uncovered() });
            });
            mo.observe(document.querySelector('.hd-win')!, { subtree: true, childList: true, characterData: true, attributes: true });
          }),
      );
      seen.push({ y, ...r });
    }
    for (const s of seen) expect(s.uncovered || !s.moving, `scrollY ${s.y}: the demo moves while its pause button is covered`).toBe(true);
    expect(seen.some((s) => s.moving), 'the demo moved at some scroll position').toBe(true);
    expect(seen.some((s) => !s.uncovered), 'some scroll position covers the window bar').toBe(true);
  });

  test('재생 중 스크롤해도 커서는 누르는 순간 LEFT JOIN 보기와 저장 버튼 위에 있다', async ({ page }) => {
    desktopOnly(page);
    test.setTimeout(90_000);
    await page.goto('/');
    const hd = page.locator('.hero-demo');
    await expect(hd).toHaveAttribute('data-scene', 'study', { timeout: 10_000 });
    await page.evaluate(() => {
      const w = window as unknown as { __press: Record<string, boolean> };
      w.__press = {};
      const pressed: Record<string, string> = { answer: '.opt.on', save: '.fake.save.done' };
      new MutationObserver(() => {
        for (const [t, sel] of Object.entries(pressed)) {
          if (t in w.__press || !document.querySelector(`.hd-flow ${sel}`)) continue;
          const tip = document.querySelector('.hd-cursor')!.getBoundingClientRect();
          const r = document.querySelector(`.hd-flow [data-t="${t}"]`)!.getBoundingClientRect();
          w.__press[t] = tip.left >= r.left && tip.left <= r.right && tip.top >= r.top && tip.top <= r.bottom;
        }
      }).observe(document.querySelector('.hero-demo')!, { subtree: true, childList: true, attributes: true });
    });
    const moveStarts = async (target: string) => {
      await page.locator(`.hd-flow [data-t="${target}"]`).waitFor({ state: 'attached', timeout: 30_000 });
      const from = await page.locator('.hd-cursor').evaluate((el) => el.style.transform);
      await page.waitForFunction((t) => document.querySelector<HTMLElement>('.hd-cursor')!.style.transform !== t, from, {
        polling: 'raf',
        timeout: 30_000,
      });
      await page.waitForTimeout(250);
    };
    await page.mouse.move(640, 300);
    await moveStarts('answer');
    await page.mouse.wheel(0, 200);
    await moveStarts('save');
    await page.mouse.wheel(0, -150);
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __press: Record<string, boolean> }).__press), { timeout: 30_000 })
      .toEqual({ answer: true, save: true });
  });

  test('탭이 숨으면 멈추고, 돌아오면 이어서 재생한다', async ({ page }) => {
    desktopOnly(page);
    await page.goto('/');
    const hd = page.locator('.hero-demo');
    await expect(hd).toHaveAttribute('data-scene', 'study', { timeout: 10_000 });
    const setHidden = (hidden: boolean) =>
      page.evaluate((h) => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
    await setHidden(true);
    const shown = () => hd.locator('.hd-flow').evaluate((el) => el.querySelectorAll('*').length);
    const before = await shown();
    await page.waitForTimeout(2_000);
    expect(await shown()).toBe(before);
    await setHidden(false);
    await expect.poll(shown, { timeout: 5_000 }).toBeGreaterThan(before);
  });
});
