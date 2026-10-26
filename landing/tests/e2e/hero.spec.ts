import { expect, test, type Page } from '@playwright/test';

type Size = { width: number; height: number };

// Real laptop windows, where the app window starts low on the first screen: 1920×1080 at 125% (1536×730),
// and 1366×768 or 1280×800 screens less the browser's own chrome. The project's own viewport (1440×900 or
// 1280×800) runs as `null`; the short windows run once, under the desktop project.
const SIZES: (Size | null)[] = [null, { width: 1536, height: 730 }, { width: 1366, height: 657 }, { width: 1280, height: 690 }];
const sizeName = (s: Size | null) => (s ? `${s.width}×${s.height}` : '기준 화면');

const prepare = (page: Page, size: Size | null) => {
  test.skip(page.viewportSize()!.width < 1024, 'desktop layout only');
  test.skip(!!size && test.info().project.name !== 'desktop', 'short windows run once, under the desktop project');
};

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
const winTop = (page: Page) => page.evaluate(() => document.querySelector('.hd-win')!.getBoundingClientRect().top + scrollY);
// Scrolls the way a visitor brings the window up to watch it: its title bar just under the header.
const toWindow = async (page: Page) => jump(page, (await winTop(page)) - 72);
const label = (page: Page) => page.locator('.hd-ctrl-l .on').textContent();

interface Watch {
  changes: number;
  lies: string[];
  read: Record<'task' | 'solve' | 'result' | 'answer', number>;
  playMs: number;
  rests: string[];
  beats: string[];
  moved: string[] | null;
  toast: { min: number; seen: string[] };
  dates: number;
  maxScroll: number;
}
const watched = (page: Page) => page.evaluate(() => (window as unknown as { __hd: Watch }).__hd);

// Installed before the page loads. Per animation frame it records whether the window's picture changed
// (anything inside the window but its play control, and the thread's camera slide that follows scrolling),
// and flags each frame where the control's label disagrees: the picture changing under 재생/다시 보기, or
// 일시정지 shown over a picture that has not changed for 3.5s (the script's longest still stretch is ~3s).
// It also times each key beat whole on screen, the time spent playing, and any text the pointer rests on.
const watch = (page: Page) =>
  page.addInitScript(() => {
    const KEY = { task: '.hd-flow .task', solve: '.hd-flow .solve', result: '.hd-flow .result', answer: '.hd-flow .xc-a' };
    const w: Watch = {
      changes: 0,
      lies: [],
      read: { task: 0, solve: 0, result: 0, answer: 0 },
      playMs: 0,
      rests: [],
      beats: [],
      moved: null,
      toast: { min: 1, seen: [] },
      dates: 0,
      maxScroll: 0,
    };
    (window as unknown as { __hd: Watch }).__hd = w;
    let dirty = '';
    new MutationObserver((recs) => {
      for (const r of recs) {
        const el = r.target instanceof Element ? r.target : r.target.parentElement;
        if (!el?.closest('.hd-win') || el.closest('.hd-slot')) continue;
        if (r.type === 'attributes' && r.attributeName === 'style' && el.classList.contains('hd-flow')) continue;
        dirty ||= `${r.type} ${r.attributeName ?? ''} on .${[...el.classList].join('.')}`;
      }
    }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });

    const boxes = () =>
      ['.hd-win', '.hd-ctrl', '.aw-side', '#hero-cta'].map((s) => {
        const r = document.querySelector(s)?.getBoundingClientRect();
        return r ? `${s} ${r.x},${r.y + scrollY},${r.width},${r.height}` : `${s} missing`;
      });
    let prev: string[] = [];
    const logBeat = () => {
      const hd = document.querySelector<HTMLElement>('.hero-demo');
      if (!hd) return;
      const beat = `${hd.dataset.scene}:${hd.dataset.remind}`;
      const last = w.beats[w.beats.length - 1];
      if (last === 'opened:0' && beat === 'home:0' && !w.moved) {
        const now = boxes();
        w.moved = now.filter((b, i) => b !== prev[i]);
      }
      if (last !== beat) w.beats.push(beat);
    };
    new MutationObserver(logBeat).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-scene', 'data-remind'] });

    let ready = false;
    document.addEventListener('DOMContentLoaded', () => {
      logBeat();
      requestAnimationFrame(() => (ready = true));
    });
    let text = '';
    let since = 0;
    let last = 0;
    let lastChange = 0;
    let pending = 0;
    let why = '';
    let pos = '';
    let still = 0;
    let checked = 0;
    const range = document.createRange();
    const tick = (ts: number) => {
      const dt = last ? ts - last : 0;
      last = ts;
      const hd = document.querySelector<HTMLElement>('.hero-demo');
      if (hd) {
        prev = boxes();
        const now = hd.querySelector('.hd-ctrl-l .on')?.textContent ?? '';
        if (now !== text) {
          text = now;
          since = ts;
        }
        const claims = text === '일시정지';
        // React renders the label a frame after the clock moves the pointer, so a change is a lie only if
        // the label has not caught up 150ms later.
        if (dirty && ready) {
          w.changes++;
          lastChange = ts;
          if (!claims && ts - since > 150 && !pending) {
            pending = ts;
            why = `${dirty} under "${text}" (${hd.dataset.play} ${hd.dataset.scene} y${Math.round(scrollY)})`;
          }
        }
        dirty = '';
        if (claims) pending = 0;
        else if (pending && ts - pending > 150) {
          w.lies.push(`${Math.round(pending)}ms: ${why}`);
          pending = 0;
        }
        if (claims && ready && ts - Math.max(lastChange, since) > 3500) {
          w.lies.push(`${Math.round(ts)}ms: "${text}" over a picture still for 3.5s`);
          lastChange = ts;
        }
        if (hd.dataset.play === 'playing') w.playMs += dt;
        w.maxScroll = Math.max(w.maxScroll, scrollY);

        const ctrl = hd.querySelector('.hd-ctrl')!;
        if (hd.dataset.scene === 'study' && hd.dataset.remind === '0') {
          const thread = hd.querySelector('.hd-thread')!.getBoundingClientRect();
          const top = Math.max(
            thread.top,
            document.querySelector('.nav')?.getBoundingClientRect().bottom ?? 0,
            ctrl.hasAttribute('data-dock') ? ctrl.getBoundingClientRect().bottom : 0,
          );
          const bottom = Math.min(thread.bottom, innerHeight);
          for (const [k, s] of Object.entries(KEY)) {
            const el = hd.querySelector<HTMLElement>(s);
            if (!el) continue;
            const r = el.getBoundingClientRect();
            const opaque = +getComputedStyle(el.closest('.hd-flow > *')!).opacity >= 0.99;
            if (opaque && r.height > 0 && r.top >= top - 0.5 && r.bottom <= bottom + 0.5) w.read[k as keyof typeof KEY] += dt;
          }
        }

        const cursor = hd.querySelector<HTMLElement>('.hd-cursor')!;
        if (cursor.style.transform !== pos) {
          pos = cursor.style.transform;
          still = ts;
        } else if (hd.dataset.play === 'playing' && ts - still > 600 && ts - checked > 100) {
          checked = ts;
          const a = cursor.querySelector('svg')!.getBoundingClientRect();
          const tip = { l: a.left + 3, t: a.top + 1, r: a.left + 15, b: a.top + 19 };
          const root = hd.querySelector(hd.dataset.remind !== '0' ? '.hd-remind' : '.hd-scene.on')!;
          const thread = hd.querySelector('.hd-thread')!.getBoundingClientRect();
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const words = n.textContent!.trim();
            const el = n.parentElement!;
            if (!words || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
            const clip = el.closest('.hd-thread') ? thread : null;
            range.selectNodeContents(n);
            for (const r of range.getClientRects()) {
              const t = Math.max(r.top, clip?.top ?? -Infinity, tip.t);
              const b = Math.min(r.bottom, clip?.bottom ?? Infinity, tip.b);
              if (b - t > 1 && Math.min(r.right, tip.r) - Math.max(r.left, tip.l) > 1 && !w.rests.includes(words)) w.rests.push(words);
            }
          }
        }

        if (hd.dataset.remind !== '0') {
          const front = hd.querySelector<HTMLElement>('.hd-toasts .notif[data-off="0"]');
          if (front && getComputedStyle(front).visibility === 'visible') {
            w.toast.min = Math.min(w.toast.min, +getComputedStyle(front).opacity);
            if (!w.toast.seen.includes(hd.dataset.remind!)) w.toast.seen.push(hd.dataset.remind!);
          }
          const box = hd.querySelector('.hd-date')!.getBoundingClientRect();
          const shown = [...hd.querySelectorAll<HTMLElement>('.hd-date .md')]
            .filter((el) => +getComputedStyle(el.closest('.ld')!).opacity > 0.02)
            .map((el) => el.getBoundingClientRect())
            .map((r) => [Math.max(r.top, box.top), Math.min(r.bottom, box.bottom)])
            .filter(([x, y]) => y > x);
          for (let i = 1; i < shown.length; i++) if (shown[i][0] < shown[i - 1][1] && shown[i - 1][0] < shown[i][1]) w.dates++;
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

// Autoplay starts on the first screen of the reference windows and of 1536×730; on the shorter ones it may
// wait for the visitor's first wheel notch. Either way it starts with the question box whole on screen.
const startsAutoplay = async (page: Page, size: Size | null) => {
  const hd = page.locator('.hero-demo');
  if (!size || size.height >= 730) {
    await expect(hd).toHaveAttribute('data-play', 'playing', { timeout: 4_000 });
    expect(await page.evaluate(() => scrollY)).toBe(0);
  } else {
    await page.waitForTimeout(1_500);
    if ((await hd.getAttribute('data-play')) === 'idle') {
      await page.mouse.move(size.width / 2, size.height / 2);
      await page.mouse.wheel(0, 100);
    }
    await expect(hd).toHaveAttribute('data-play', 'playing', { timeout: 3_000 });
  }
  await expect(hd.locator('.hd-ask .typed')).toContainText('LEFT', { timeout: 3_000 });
  const ask = await hd.locator('.hd-ask').evaluate((el) => el.getBoundingClientRect().bottom);
  expect(ask, 'the question box is whole on screen while it types').toBeLessThanOrEqual(page.viewportSize()!.height);
};

const advances = async (page: Page, within: number) => {
  const from = (await watched(page)).changes;
  await expect.poll(async () => (await watched(page)).changes, { timeout: within, intervals: [100] }).toBeGreaterThan(from + 2);
};

test.describe('히어로', () => {
  for (const size of SIZES) {
    test.describe(sizeName(size), () => {
      if (size) test.use({ viewport: size });

      test('첫 화면에 제목, 다운로드 버튼, 앱 창 윗부분이 보인다', async ({ page }) => {
        prepare(page, size);
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
        if (size) {
          const bar = (await page.locator('.hd-win .aw-bar').boundingBox())!;
          expect(bar.y + bar.height, "the window's title bar is whole on the first screen").toBeLessThanOrEqual(vh);
        } else expect(vh - win.y, 'the window shows at least 300px above the fold').toBeGreaterThanOrEqual(300);
        await expect(page.locator('.hd-win .aw-bar')).toContainText('예시 화면');
        await expect(page.locator('.hd-win .aw-side')).toContainText('오늘 공부');
        await expect(page.locator('.hd-win .aw-side')).toContainText('리마인드');
        await expect(page.locator('.hd-win .aw-side')).toContainText('SQLD · 2과목');
      });

      test('앱 창은 히어로 카드 아래 경계에서 잘린다', async ({ page }) => {
        prepare(page, size);
        await page.goto('/');
        const card = (await page.locator('.hero-card').boundingBox())!;
        const win = (await page.locator('.hd-win .aw').boundingBox())!;
        expect(win.y + win.height).toBeGreaterThan(card.y + card.height);
      });

      test('동작 줄이기에서는 처음부터 마지막 장면이 정지 화면으로 보인다', async ({ page }) => {
        prepare(page, size);
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
        // the short windows show the reopened card's revisit dots; the reference ones its answer line too
        const last = (await hd.locator(size ? '.hd-scene.on .revisit-line' : '.hd-scene.on .xc-a').boundingBox())!;
        expect(last.y + last.height, 'the finished loop reads on the first screen').toBeLessThanOrEqual(page.viewportSize()!.height);
        await page.waitForTimeout(1_000);
        expect(await page.evaluate(() => (window as unknown as { __scenes: string[] }).__scenes), 'the first frame never flashes').toEqual(['opened']);
      });
    });
  }
});

test.describe('히어로 자동 재생', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const size of SIZES) {
    test.describe(sizeName(size), () => {
      if (size) test.use({ viewport: size });

      test('끝까지 26초 안에 한 번 재생되고, 핵심 장면은 2초 이상 온전히 보이며, 일시정지·다시 보기가 듣는다', async ({ page }) => {
        prepare(page, size);
        test.setTimeout(150_000);
        await watch(page);
        await page.goto('/');
        await startsAutoplay(page, size);
        const hd = page.locator('.hero-demo');
        if (size) await toWindow(page);
        const scrolled = await page.evaluate(() => scrollY);

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
        const got = await watched(page);
        expect(got.beats[0], 'the server HTML shows the finished loop').toBe('opened:0');
        expect(got.moved, 'switching from the finished loop to the first frame moves nothing').toEqual([]);
        expect(got.beats).toEqual(expect.arrayContaining(['home:0', 'study:0', 'study:1', 'study:2', 'study:3', 'opened:0']));
        expect(got.beats.indexOf('study:1')).toBeLessThan(got.beats.indexOf('study:3'));
        expect(got.beats.indexOf('study:3')).toBeLessThan(got.beats.lastIndexOf('opened:0'));
        expect(got.toast.seen.sort(), 'every reminder arrived as the front toast').toEqual(['1', '2', '3']);
        expect(got.toast.min, 'the arriving toast is opaque from its first frame, so the one behind never shows through').toBe(1);
        expect(got.dates, 'outgoing and incoming dates never overlap').toBe(0);
        expect(got.maxScroll, 'the visitor scrolled at most once, to the window').toBe(scrolled);
        // soft, so one run reports every broken promise of the pass
        for (const [k, ms] of Object.entries(got.read)) expect.soft(ms, `${k} whole on screen (ms)`).toBeGreaterThanOrEqual(2_000);
        expect.soft(got.playMs, 'one pass plays in about 26 seconds').toBeLessThanOrEqual(26_300);
        expect.soft(got.lies, 'the control label always matches whether the picture moves').toEqual([]);
        expect.soft(got.rests, 'the resting pointer covers no text').toEqual([]);

        if (size) await jump(page, 0);
        await page.getByRole('button', { name: /다시 보기/ }).click();
        await expect(hd).toHaveAttribute('data-play', 'playing');
        await expect(hd).toHaveAttribute('data-scene', 'home');
        await expect(hd.locator('.aw-count')).toHaveText('3');
        await expect(hd.locator('.hd-ask .typed'), '다시 보기 plays from the start within 2s').toContainText('LEFT', { timeout: 2_000 });
        expect((await watched(page)).lies).toEqual([]);
      });

      test('재생을 누르면 2초 안에 장면이 움직인다: 첫 화면에서도, 헤더 밑에 붙은 버튼에서도', async ({ page }) => {
        prepare(page, size);
        test.setTimeout(60_000);
        await watch(page);
        await page.goto('/');
        await page.waitForTimeout(1_500);
        const hd = page.locator('.hero-demo');
        const ctrl = page.locator('.hd-ctrl');
        if ((await hd.getAttribute('data-play')) === 'playing') {
          await ctrl.click();
          await expect(hd).toHaveAttribute('data-play', 'paused');
        } else {
          expect(await label(page), 'a demo that is not moving offers 재생').toBe('재생');
          await ctrl.click();
          await advances(page, 2_000);
          await expect(hd).toHaveAttribute('data-scene', 'home');
          await expect(hd.locator('.hd-ask .typed')).toContainText('LEFT', { timeout: 2_000 });
          await ctrl.click();
          await expect(hd).toHaveAttribute('data-play', 'paused');
        }
        await jump(page, (await winTop(page)) - 72 + 60);
        await expect(ctrl, 'past the header the control docks under it').toHaveAttribute('data-dock', '');
        const uncovered = await ctrl.evaluate((el) => {
          const b = el.getBoundingClientRect();
          const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          return !!hit && el.contains(hit);
        });
        expect(uncovered, 'the docked control is on top').toBe(true);
        await ctrl.click();
        await advances(page, 2_000);
        expect(await label(page)).toBe('일시정지');
        expect((await watched(page)).lies).toEqual([]);
      });

      test('스크롤 위치마다 일시정지 버튼은 보이고, 창이 보이는 동안 표시 없이 멈추지 않으며, 라벨은 실제 재생과 같다', async ({ page }) => {
        prepare(page, size);
        test.setTimeout(120_000);
        await watch(page);
        await page.goto('/');
        await startsAutoplay(page, size);
        const top = (await winTop(page)) - 72;
        // the bar under the header first (while the loop still runs), then the bar on screen, then mostly gone
        const spots = [
          { y: top + 50, covered: true },
          { y: top + 200, covered: true },
          { y: top + 360, covered: true },
          { y: Math.max(0, top - 40), covered: false },
          { y: 0, covered: false },
          { y: top + 620, covered: false },
        ];
        const seen: { y: number; covered: boolean; moving: boolean; uncovered: boolean; label: string }[] = [];
        for (const spot of spots) {
          await jump(page, spot.y);
          await page.waitForTimeout(300);
          const from = (await watched(page)).changes;
          await page.waitForTimeout(3_600);
          const r = await page.evaluate(() => {
            const ctrl = document.querySelector<HTMLElement>('.hd-ctrl')!;
            const b = ctrl.getBoundingClientRect();
            const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
            return { uncovered: !!hit && ctrl.contains(hit), label: ctrl.querySelector('.hd-ctrl-l .on')!.textContent! };
          });
          seen.push({ ...spot, ...r, moving: (await watched(page)).changes > from });
        }
        for (const s of seen) {
          expect(s.uncovered || !s.moving, `scrollY ${s.y}: the demo moves while its pause button is covered`).toBe(true);
          if (s.covered) expect(s.uncovered, `scrollY ${s.y}: the window shows, so its control docks under the header`).toBe(true);
        }
        expect(
          seen.some((s) => s.covered && s.moving),
          'with the title bar under the header, the window keeps playing',
        ).toBe(true);
        expect((await watched(page)).lies, 'the control label always matches whether the picture moves').toEqual([]);
      });

      test('재생 중 스크롤해도 커서는 누르는 순간 LEFT JOIN 보기와 저장 버튼 위에 있다', async ({ page }) => {
        prepare(page, size);
        test.setTimeout(90_000);
        await watch(page);
        await page.goto('/');
        await startsAutoplay(page, size);
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
        if (size) await toWindow(page);
        await page.mouse.move(640, 300);
        await moveStarts('answer');
        await page.mouse.wheel(0, 120);
        await moveStarts('save');
        await page.mouse.wheel(0, -100);
        await expect
          .poll(() => page.evaluate(() => (window as unknown as { __press: Record<string, boolean> }).__press), { timeout: 30_000 })
          .toEqual({ answer: true, save: true });
        expect((await watched(page)).lies).toEqual([]);
      });

      test('탭이 숨으면 재생 라벨로 멈추고, 돌아오면 이어서 재생한다', async ({ page }) => {
        prepare(page, size);
        await watch(page);
        await page.goto('/');
        await startsAutoplay(page, size);
        if (size) await toWindow(page);
        const hd = page.locator('.hero-demo');
        await expect(hd).toHaveAttribute('data-scene', 'study', { timeout: 10_000 });
        const setHidden = (hidden: boolean) =>
          page.evaluate((h) => {
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
            document.dispatchEvent(new Event('visibilitychange'));
          }, hidden);
        await setHidden(true);
        await expect(hd).toHaveAttribute('data-play', 'held');
        expect(await label(page)).toBe('재생');
        const shown = () => hd.locator('.hd-flow').evaluate((el) => el.querySelectorAll('*').length);
        const before = await shown();
        await page.waitForTimeout(2_000);
        expect(await shown()).toBe(before);
        await setHidden(false);
        await expect(hd).toHaveAttribute('data-play', 'playing');
        await expect.poll(shown, { timeout: 5_000 }).toBeGreaterThan(before);
        expect((await watched(page)).lies).toEqual([]);
      });

      test('재생 도중 동작 줄이기를 켜면 바로 마지막 장면에서 멈춘다', async ({ page }) => {
        prepare(page, size);
        await watch(page);
        await page.goto('/');
        await startsAutoplay(page, size);
        const hd = page.locator('.hero-demo');
        await expect(hd).toHaveAttribute('data-scene', 'study', { timeout: 10_000 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect(hd).toHaveAttribute('data-play', 'ended', { timeout: 1_000 });
        await expect(hd).toHaveAttribute('data-scene', 'opened');
        await expect(hd.locator('.hd-scene.on .revisit-line .dot.on')).toHaveCount(3);
        await expect(hd.locator('.aw-count')).toHaveText('4');
        expect(await label(page)).toBe('다시 보기');
        const from = (await watched(page)).changes;
        await page.waitForTimeout(2_000);
        expect((await watched(page)).changes, 'nothing moves after the switch').toBe(from);
        expect((await watched(page)).lies).toEqual([]);
      });
    });
  }
});
