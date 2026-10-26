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
    expect(vh - win.y, 'at least the title bar and the top of the main pane').toBeGreaterThan(200);
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

  test('동작 줄이기에서는 마지막 장면이 정지 화면으로 보인다', async ({ page }) => {
    desktopOnly(page);
    await page.goto('/');
    const hd = page.locator('.hero-demo');
    await expect(hd).toHaveAttribute('data-play', 'ended');
    await expect(hd).toHaveAttribute('data-scene', 'opened');
    await expect(hd.locator('.hd-scene.on .revisit-line')).toContainText('다시 본 날');
    await expect(hd.locator('.hd-scene.on .revisit-line .dot.on')).toHaveCount(3);
    await expect(hd.locator('.aw-count')).toHaveText('4');
    await expect(hd.locator('.hd-cursor')).toHaveCSS('opacity', '0');
    await expect(page.getByRole('button', { name: /다시 보기/ })).toBeVisible();
  });
});

test.describe('히어로 자동 재생', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('끝까지 한 번 재생되고, 일시정지가 멈추고, 다시 보기가 처음부터 튼다', async ({ page }) => {
    desktopOnly(page);
    test.setTimeout(90_000);
    await page.addInitScript(() => {
      const w = window as unknown as { __beats: string[] };
      w.__beats = [];
      const log = () => {
        const hd = document.querySelector<HTMLElement>('.hero-demo');
        if (!hd) return;
        const beat = `${hd.dataset.scene}:${hd.dataset.remind}`;
        if (w.__beats[w.__beats.length - 1] !== beat) w.__beats.push(beat);
      };
      new MutationObserver(log).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-scene', 'data-remind'] });
      document.addEventListener('DOMContentLoaded', log);
    });
    await page.goto('/');
    const hd = page.locator('.hero-demo');
    await expect(hd).toHaveAttribute('data-play', 'playing');
    await expect(hd.locator('.hd-cursor')).toHaveCSS('opacity', '1');
    await expect(hd.locator('.hd-ask .typed')).toContainText('LEFT JOIN', { timeout: 5_000 });

    await expect(hd).toHaveAttribute('data-scene', 'study', { timeout: 10_000 });
    const pause = page.getByRole('button', { name: /일시정지/ });
    await expect(pause).toBeVisible();
    await pause.click();
    await expect(hd).toHaveAttribute('data-play', 'paused');
    const shown = () => hd.locator('.hd-flow').evaluate((el) => el.querySelectorAll('*').length);
    const before = await shown();
    await page.waitForTimeout(2_000);
    expect(await shown(), 'nothing new appears while paused').toBe(before);
    await page.getByRole('button', { name: /재생/ }).click();
    await expect(hd).toHaveAttribute('data-play', 'playing');

    await expect(hd.locator('.opt.on')).toHaveText('LEFT JOIN', { timeout: 20_000 });
    await expect(hd.locator('.blank.is-right')).toHaveText('LEFT JOIN');
    await expect(hd.locator('.res-table caption')).toHaveText('결과 2행');
    await expect(hd.locator('.aw-count')).toHaveText('4', { timeout: 10_000 });
    await expect(hd.locator('.hd-toasts .notif[data-off="0"]')).toContainText('11월 25일 수요일', { timeout: 15_000 });

    await expect(hd).toHaveAttribute('data-play', 'ended', { timeout: 20_000 });
    await expect(hd).toHaveAttribute('data-scene', 'opened');
    await expect(hd.locator('.hd-scene.on .revisit-line .dot.on')).toHaveCount(3);
    const beats = await page.evaluate(() => (window as unknown as { __beats: string[] }).__beats);
    expect(beats.filter((b, i) => b !== beats[i - 1])).toEqual(
      expect.arrayContaining(['home:0', 'study:0', 'study:1', 'study:2', 'study:3', 'opened:0']),
    );
    expect(beats.indexOf('study:1')).toBeLessThan(beats.indexOf('study:3'));
    expect(beats.indexOf('study:3')).toBeLessThan(beats.lastIndexOf('opened:0'));

    const again = page.getByRole('button', { name: /다시 보기/ });
    await expect(again).toBeVisible();
    await again.click();
    await expect(hd).toHaveAttribute('data-play', 'playing');
    await expect(hd).toHaveAttribute('data-scene', 'home');
    await expect(hd.locator('.aw-count')).toHaveText('3');
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
