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

const shot = async (page: Page, scene: string) => {
  const file = `${scene}.png`;
  await page.screenshot({ path: join(DIR, file) });
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
