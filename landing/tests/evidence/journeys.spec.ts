import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

// Evidence for PRs and verdicts: the scenes reports/shots/final/shots.sh took with the local gstack browser,
// rerunnable wherever Playwright runs. EVIDENCE_ID names the folder (an issue such as SON-12, default "local").
// EVIDENCE_VIEWPORTS (e.g. "1440x770,1280x690") replaces the hero windows to reproduce a size-specific bug.
const ID = process.env.EVIDENCE_ID || 'local';
const ROOT = join(__dirname, '..', '..');
const DIR = join(ROOT, 'reports', 'evidence', ID);
const files: { file: string; scene: string; viewport: string }[] = [];
const HERO_VIEWPORTS = (process.env.EVIDENCE_VIEWPORTS || '1440x900,1280x800,1536x730').split(',').map((s) => {
  const [width, height] = s.trim().split('x').map(Number);
  return { width, height };
});

test.beforeAll(() => mkdirSync(DIR, { recursive: true }));

// A failed journey keeps the screen it stopped on, so a FAIL verdict carries its own proof.
test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus || page.isClosed()) return;
  const scene = `FAIL-${info.title.replace(/[^\w가-힣-]+/g, '-')}`;
  await shot(page, scene);
});

test.afterAll(() => {
  const sha = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  const buildId = readFileSync(join(ROOT, '.next', 'BUILD_ID'), 'utf8').trim();
  const manifest = { id: ID, sha, buildId, at: new Date().toISOString(), files };
  writeFileSync(join(DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
});

const size = (page: Page) => {
  const { width, height } = page.viewportSize()!;
  return `${width}x${height}`;
};

// Polls with the page's own querySelector, because Playwright's selector engine does not know :popover-open.
const at = async (page: Page, selector: string, settle = 0) => {
  await page.waitForFunction((s) => !!document.querySelector(s), selector, { timeout: 60_000 });
  if (settle) await page.waitForTimeout(settle);
};

const jumpTo = (page: Page, selector: string, offset: number) =>
  page.evaluate(
    ([s, o]) => scrollTo({ top: document.querySelector(s)!.getBoundingClientRect().top + scrollY - o, behavior: 'instant' }),
    [selector, offset] as const,
  );

const open = async (page: Page) => {
  await page.goto('/');
  await expect(page.locator('nextjs-portal'), 'a production page, not the dev server').toHaveCount(0);
};

const shot = async (page: Page, scene: string, clip?: { x: number; y: number; width: number; height: number }) => {
  const file = `${scene}.png`;
  await page.screenshot({ path: join(DIR, file), ...(clip ? { clip } : {}) });
  files.push({ file, scene, viewport: size(page) });
};

const keepVideo = async (page: Page, scene: string) => {
  const viewport = size(page);
  const video = page.video();
  await page.close();
  if (!video) return;
  const file = `${scene}.webm`;
  await video.saveAs(join(DIR, file));
  files.push({ file, scene, viewport });
};

for (const viewport of HERO_VIEWPORTS) {
  const v = `${viewport.width}x${viewport.height}`;
  test.describe(v, () => {
    test.use({ viewport });

    test(`히어로 데모가 끝까지 재생된다 ${v}`, async ({ page }) => {
      await open(page);
      await at(page, '.hd-ask.typing', 700);
      await shot(page, `hero-${v}-01-home`);
      await at(page, '.hd-flow .task', 900);
      await shot(page, `hero-${v}-02-task`);
      await at(page, '.hd-flow .blank.is-right');
      await shot(page, `hero-${v}-03-left-join-press`);
      await at(page, '.hd-flow .fake.save.done', 120);
      await shot(page, `hero-${v}-04-card-saved`);
      await at(page, '.hero-demo[data-remind="3"]', 500);
      await shot(page, `hero-${v}-05-remind-30`);
      await at(page, '.hero-demo[data-play="ended"]', 400);
      await shot(page, `hero-${v}-06-reopened-card`);
      await keepVideo(page, `hero-${v}`);
    });
  });
}

test('다운로드 버튼은 출시 전 안내를 연다', async ({ page }) => {
  await open(page);
  await page.click('#hero-cta [data-download="hero"]');
  await at(page, '#download-note:popover-open', 400);
  await shot(page, 'download-1440x900-notice');
  await keepVideo(page, 'download-1440x900');
});

test('비포·애프터 면접 답변', async ({ page }) => {
  await open(page);
  await jumpTo(page, '.ba figure.interview', 200);
  await expect(page.locator('.ba figure.interview'), 'the scroll-in has finished').toHaveCSS('opacity', '1');
  await page.waitForTimeout(600);
  await shot(page, 'before-after-1440x900');
});

test('섹션 4에서 직접 해 보기: 대화 → 과제 → 카드 → 알림', async ({ page }) => {
  await open(page);
  await jumpTo(page, '#stage', 72);
  await at(page, '#stage[data-ready]', 700);
  await shot(page, 's4-1440x900-1-chat');
  await page.click('#loop-tab-2');
  await at(page, '#loop-panel-2 .opt', 900);
  await shot(page, 's4-1440x900-2a-task-blank');
  await page.click('#loop-panel-2 .opt:first-child');
  await at(page, '#loop-panel-2 .res-chip.bad', 700);
  await shot(page, 's4-1440x900-2b-wrong-inner-join');
  await page.click('#loop-panel-2 .opt:last-child');
  await at(page, '#loop-panel-2 .res-table', 900);
  await shot(page, 's4-1440x900-2c-right-left-join');
  await page.click('#loop-tab-3');
  await at(page, '#loop-panel-3 .save-btn', 900);
  await shot(page, 's4-1440x900-3a-card');
  await page.click('#loop-panel-3 .save-btn');
  await at(page, '#loop-panel-3 .l-list.shown', 700);
  await shot(page, 's4-1440x900-3b-card-list');
  await page.click('#loop-tab-4');
  await at(page, '#loop-panel-4 .notif[data-off="0"]', 900);
  await shot(page, 's4-1440x900-4a-remind-1day');
  await page.click('#loop-panel-4 .btn-notif');
  await page.waitForTimeout(700);
  await page.click('#loop-panel-4 .notif[data-off="0"] .n-hit:not([hidden])');
  await page.waitForTimeout(900);
  await shot(page, 's4-1440x900-4b-remind-30day');
  await page.click('#loop-panel-4 .notif[data-off="0"] .n-hit:not([hidden])');
  await at(page, '#loop-panel-4 .l-card.shown', 1000);
  await shot(page, 's4-1440x900-4c-reopened-card');
  await keepVideo(page, 's4-1440x900');
});

// Web motion (2026-11-02): hero entrance, scroll-in, button hover, and the same page with motion off or without JS.
// The scroll-in starts after load and idle and flags itself on <html data-motion>.
const motionOn = (page: Page) => expect(page.locator('html')).toHaveAttribute('data-motion', /^(on|done)$/, { timeout: 30_000 });
const hold = (page: Page, ms: number) =>
  page.evaluate(
    (t) => document.getAnimations().filter((a) => (a as CSSAnimation).animationName?.startsWith('hero-')).forEach((a) => { a.pause(); a.currentTime = t; }),
    ms,
  );

test('모션: 히어로는 제목 → 설명 → 버튼 → 앱 창 순서로 등장한다 (단계별 정지 화면)', async ({ page }) => {
  // The hero's own animations are held before the first frame, then stepped, so each still is the same moment on every run.
  await page.addInitScript(() => {
    const st = document.createElement('style');
    st.textContent = '.hero-kicker,.hero h1,.hero-sub,.cta-row,.hero-demo,.hero-demo-note{animation-play-state:paused !important}';
    const mo = new MutationObserver(() => {
      if (document.head) {
        document.head.append(st);
        mo.disconnect();
      }
    });
    mo.observe(document, { childList: true, subtree: true });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hero-demo');
  for (const ms of [0, 150, 350, 600, 1000]) {
    await hold(page, ms);
    await page.waitForTimeout(80);
    await shot(page, `motion-hero-1440x900-t${String(ms).padStart(4, '0')}ms`);
  }
});

test('모션: 히어로 등장과 버튼 hover를 실제 속도로 본다', async ({ page }) => {
  await open(page);
  await page.waitForTimeout(1_600);
  await page.hover('#hero-cta .btn-soft');
  await page.waitForTimeout(400);
  await shot(page, 'motion-hover-1440x900-cta', { x: 400, y: 360, width: 640, height: 150 });
  await keepVideo(page, 'motion-hero-load-1440x900');
});

test('모션: 스크롤하면 제목과 카드가 아래에서 올라온다 (1440×900)', async ({ page }) => {
  await open(page);
  await motionOn(page);
  await jumpTo(page, '.quotes', 380);
  await page.waitForTimeout(230);
  await shot(page, 'motion-scroll-1440x900-1-quotes-mid');
  await expect(page.locator('.quotes blockquote').last()).toHaveCSS('opacity', '1');
  await page.waitForTimeout(150);
  await shot(page, 'motion-scroll-1440x900-2-quotes-done');
  await jumpTo(page, '.tl-cards', 330);
  await page.waitForTimeout(230);
  await shot(page, 'motion-scroll-1440x900-3-cards-mid');
  await expect(page.locator('.tl-cards .tc').last()).toHaveCSS('opacity', '1');
  await page.waitForTimeout(150);
  await shot(page, 'motion-scroll-1440x900-4-cards-done');
  // like a visitor: the wheel, top to bottom, recorded
  await jumpTo(page, '#top', 0);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 260) {
    await page.mouse.wheel(0, 260);
    await page.waitForTimeout(110);
  }
  await page.waitForTimeout(1_200);
  await shot(page, 'motion-scroll-1440x900-5-bottom');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'no sideways scroll at 1440').toBeLessThanOrEqual(0);
  await keepVideo(page, 'motion-scroll-1440x900');
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 360, height: 780 },
]) {
  const v = `${viewport.width}x${viewport.height}`;
  test.describe(`모션 폰 ${v}`, () => {
    test.use({ viewport, hasTouch: true });

    test(`모션: 폰에서 위에서 아래로 스크롤한다 (${v})`, async ({ page }) => {
      await open(page);
      await motionOn(page);
      const base = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      let worst = base;
      let step = 0;
      for (let y = 0; y < height; y += 280) {
        await page.mouse.wheel(0, 280);
        await page.waitForTimeout(110);
        worst = Math.max(worst, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
        if (++step % 6 === 0) await shot(page, `motion-phone-${v}-${String(step).padStart(2, '0')}`);
      }
      await page.waitForTimeout(1_200);
      await shot(page, `motion-phone-${v}-bottom`);
      // the 360px sign-up field already overflows on main (22px); what the motion adds is what counts
      expect(worst, 'the motion adds no sideways scroll').toBeLessThanOrEqual(base);
      await keepVideo(page, `motion-phone-${v}`);
    });
  });
}

test.describe('모션 줄이기', () => {
  test.use({ reducedMotion: 'reduce' });

  test('모션: 모션 줄이기에서는 아래쪽 내용이 스크롤 전부터 모두 보인다', async ({ page }) => {
    await open(page);
    await jumpTo(page, '#difference', 72);
    await shot(page, 'motion-reduce-1440x900-difference-at-once');
    expect(await page.locator('[data-reveal]').evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length)).toBe(0);
  });
});

test.describe('JS 없음', () => {
  test.use({ javaScriptEnabled: false });

  test('모션: JS가 없으면 처음부터 모든 섹션이 보인다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: join(DIR, 'motion-nojs-1440x900-full.png'), fullPage: true });
    files.push({ file: 'motion-nojs-1440x900-full.png', scene: 'motion-nojs-1440x900-full', viewport: size(page) });
    expect(await page.locator('[data-reveal]').evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length)).toBe(0);
  });
});
