import { expect, test } from '@playwright/test';
import { enter, pasteImage, removePage } from './helpers';

for (const [width, height] of [
  [1440, 900],
  [1280, 800],
  [390, 844],
] as const) {
  test(`nothing runs off the side at ${width}px and the console stays clean`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    const pageId = await enter(page);
    await pasteImage(page);
    await expect(page.locator('.suggest .sug').first()).toBeVisible({ timeout: 60_000 });
    const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scroll).toBeLessThanOrEqual(inner);
    // the tools and the zoom control never cover each other
    const tools = await page.locator('.toolbar').boundingBox();
    const zoom = await page.locator('.zoom').boundingBox();
    expect(tools && zoom && tools.x + tools.width <= zoom.x).toBe(true);
    expect(errors).toEqual([]);
    await removePage(page, pageId);
    await context.close();
  });
}
