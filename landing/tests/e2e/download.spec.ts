import { expect, test, type Page } from '@playwright/test';

type Call = [string, Record<string, string | number> | undefined];

const mockUmami = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __calls: Call[]; umami: { track: (n: string, d?: Record<string, string | number>) => void } };
    w.__calls = [];
    w.umami = { track: (n, d) => w.__calls.push([n, d]) };
  });
const calls = (page: Page) => page.evaluate(() => (window as unknown as { __calls: Call[] }).__calls);

// Layout checks also run at short laptop windows, once, under the desktop project.
const SHORT = [
  { width: 1536, height: 730 },
  { width: 1366, height: 657 },
  { width: 1280, height: 690 },
];

for (const viewport of [null, ...SHORT]) {
  test.describe(`다운로드 버튼 (가짜 문)${viewport ? ` ${viewport.width}×${viewport.height}` : ''}`, () => {
    if (viewport) {
      test.use({ viewport });
      test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'short windows run once, under desktop'));
    }

    test('히어로 버튼은 출시 전 안내를 띄우고 download_click만 남긴다', async ({ page }) => {
      test.skip(page.viewportSize()!.width < 768, 'desktop app download is a desktop-width control');
      await mockUmami(page);
      const downloads: string[] = [];
      page.on('download', (d) => downloads.push(d.suggestedFilename()));
      await page.goto('/');
      const url = page.url();
      const note = page.locator('#download-note');
      await expect(note).toBeHidden();

      const heroBtn = page.locator('#hero-cta [data-download="hero"]');
      await heroBtn.click();
      await expect(note).toBeVisible();
      await expect(note).toHaveAttribute('role', 'dialog');
      await expect(note).toContainText('Experii 데스크톱 앱은 출시 전이에요.');
      await expect(note).toContainText('사전 신청하면 출시할 때 다운로드 링크를 이메일로 보내 드려요.');
      await expect(note.getByRole('link', { name: '사전 신청하기' })).toBeFocused();
      expect(await calls(page)).toContainEqual(['download_click', { location: 'hero', variant: 'h1' }]);
      expect(page.url()).toBe(url);

      await page.keyboard.press('Escape');
      await expect(note).toBeHidden();
      await expect(heroBtn).toBeFocused();
      expect(page.url()).toBe(url);
      expect(downloads).toEqual([]);
    });

    test('헤더 버튼도 같은 안내를 띄우고, 안내의 사전 신청하기는 이메일 칸으로 보낸다', async ({ page }) => {
      test.skip(page.viewportSize()!.width < 768, 'header download is hidden on narrow screens');
      await mockUmami(page);
      await page.goto('/');
      const note = page.locator('#download-note');
      await page.locator('.nav [data-download="nav"]').click();
      await expect(note).toBeVisible();
      expect(await calls(page)).toContainEqual(['download_click', { location: 'nav', variant: 'h1' }]);

      await note.getByRole('link', { name: '사전 신청하기' }).click();
      await expect(note).toBeHidden();
      await expect(page).toHaveURL(/#signup$/);
      await expect(page.locator('#f-email')).toBeFocused();
      await expect(page.locator('#f-email')).toBeInViewport();
    });

    test('닫기 버튼으로 닫힌다', async ({ page }) => {
      test.skip(page.viewportSize()!.width < 768, 'desktop only');
      await page.goto('/');
      await page.locator('#hero-cta [data-download="hero"]').click();
      const note = page.locator('#download-note');
      await expect(note).toBeVisible();
      await note.getByRole('button', { name: '닫기' }).click();
      await expect(note).toBeHidden();
    });

    test('변형 페이지는 자기 variant로 남긴다', async ({ page }) => {
      test.skip(page.viewportSize()!.width < 768, 'desktop only');
      await mockUmami(page);
      await page.goto('/v/h3');
      await page.locator('#hero-cta [data-download="hero"]').click();
      expect(await calls(page)).toContainEqual(['download_click', { location: 'hero', variant: 'h3' }]);
    });

    test('JS가 뜨기 전에 누른 다운로드도 한 번만 download_click으로 남는다', async ({ page }) => {
      test.skip(page.viewportSize()!.width < 768, 'desktop only');
      await mockUmami(page);
      let release!: () => void;
      const scripts = new Promise<void>((r) => (release = r));
      await page.route(
        (url) => url.pathname.startsWith('/_next/static/') && url.pathname.endsWith('.js'),
        async (route) => {
          await scripts;
          await route.continue();
        },
      );
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html'), 'still before hydration').not.toHaveClass(/\bjs\b/);
      const heroBtn = page.locator('#hero-cta [data-download="hero"]');
      await heroBtn.click();
      await expect(page.locator('#download-note')).toBeVisible();
      expect(await calls(page)).toEqual([]);

      release();
      await expect(page.locator('#stage')).toHaveAttribute('data-ready', '');
      const downloads = async () => (await calls(page)).filter(([n]) => n === 'download_click');
      await expect.poll(downloads).toEqual([['download_click', { location: 'hero', variant: 'h1' }]]);

      await page.keyboard.press('Escape');
      await heroBtn.click();
      await expect
        .poll(downloads)
        .toEqual([
          ['download_click', { location: 'hero', variant: 'h1' }],
          ['download_click', { location: 'hero', variant: 'h1' }],
        ]);
    });
  });
}
