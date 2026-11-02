import { expect, test, type Page } from '@playwright/test';

type Size = { width: number; height: number };

// Laptop windows where the app window starts low on the first screen: 1920×1080 at 125% (1536×730), and 1366×768 or 1280×800
// screens less the browser's own chrome. The project's own viewport (360×780, 1440×900 or 1280×800) runs as `null`; the short
// windows run once, under the desktop project.
const SIZES: (Size | null)[] = [null, { width: 1536, height: 730 }, { width: 1366, height: 657 }, { width: 1280, height: 690 }];
const sizeName = (s: Size | null) => (s ? `${s.width}×${s.height}` : '기준 화면');

const prepare = (page: Page, size: Size | null) => {
  test.skip(!!size && test.info().project.name !== 'desktop', 'short windows run once, under the desktop project');
};

const box = async (page: Page, selector: string) => {
  const b = await page.locator(selector).first().boundingBox();
  expect(b, selector).not.toBeNull();
  return b!;
};

const STEPS = ['연결', '캡처', '정리', '추천', '면접'];

test.describe('히어로', () => {
  for (const size of SIZES) {
    test.describe(sizeName(size), () => {
      if (size) test.use({ viewport: size });

      test('첫 화면에 제목, 다운로드 버튼, 앱 창 윗부분이 보인다', async ({ page }) => {
        prepare(page, size);
        await page.goto('/');
        const vh = page.viewportSize()!.height;
        const h1 = await box(page, '#hero-h');
        expect(h1.y).toBeGreaterThanOrEqual(0);
        expect(h1.y + h1.height).toBeLessThan(vh);
        const dl = await box(page, '#hero-cta [data-download="hero"]');
        expect(dl.y + dl.height).toBeLessThan(vh);
        await expect(page.locator('#hero-cta [data-download="hero"]')).toHaveText(/Windows 앱 다운로드/);
        await expect(page.locator('#hero-cta [data-download="hero"]')).toContainText('출시 예정');
        await expect(page.locator('#hero-cta a[href="#signup"]')).toHaveText('사전 신청하기');
        const win = await box(page, '.bd-box');
        expect(win.y, 'the window starts on the first screen').toBeLessThan(vh);
        expect(vh - win.y, 'at least its top part shows above the fold').toBeGreaterThanOrEqual(size ? 100 : 200);
        await expect(page.locator('.bd-win .bd-titlebar')).toBeVisible();
        await expect(page.locator('.bd-win .sidebar')).toContainText('학습 주제');
        await expect(page.locator('.bd-win .sidebar')).toContainText('SQLD에 쌓인 경험');
      });
    });
  }

  test('창은 실제 앱 크기 1427×897의 비율로 줄어들고, 높이가 미리 잡혀 있다', async ({ page }) => {
    await page.goto('/');
    const b = await box(page, '.bd-box');
    expect(b.width / b.height).toBeCloseTo(1427 / 897, 2);
    const vw = page.viewportSize()!.width;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(vw);
    expect(b.width).toBeLessThanOrEqual(1181);
    const win = await page.locator('.bd-win').evaluate((el: HTMLElement) => ({ w: el.offsetWidth, h: el.offsetHeight, transform: getComputedStyle(el).transform }));
    expect([win.w, win.h]).toEqual([1427, 897]);
    const scale = Number(/matrix\(([\d.]+)/.exec(win.transform)![1]);
    expect(scale * 1427).toBeCloseTo(b.width, 0);
    const bodyH = await page.locator('.bd-body').evaluate((el: HTMLElement) => el.offsetHeight);
    expect(bodyH).toBe(865);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'the hero adds no sideways overflow').toBeLessThanOrEqual(0);
  });

  test('창 위에 "예시 화면" 배지가 없고, 노트는 창과 캡션 아래에서 모든 폭에 보인다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero .ex')).toHaveCount(0);
    await expect(page.locator('.bd-box')).not.toContainText('예시 화면');
    const win = await box(page, '.bd-box');
    const cap = await box(page, '.bd-cap');
    const note = page.locator('.hero-demo-note');
    await expect(note).toBeVisible();
    await expect(note).toHaveText('출시 전 제품 · 화면은 개발 중인 예시예요.');
    const n = await box(page, '.hero-demo-note');
    expect(cap.y).toBeGreaterThanOrEqual(win.y + win.height);
    expect(n.y).toBeGreaterThanOrEqual(cap.y + cap.height);
  });

  test('단계 표시는 다섯 개이고 지금 단계가 정해져 있고, 지금 하는 일 글이 하나 보인다', async ({ page }) => {
    await page.goto('/');
    const steps = page.locator('.bd-steps li');
    await expect(steps).toHaveText(STEPS);
    await expect(page.locator('.bd-steps')).toHaveAttribute('aria-label', '진행 단계');
    await expect(page.locator('.bd-steps li[aria-current="step"]')).toHaveText('연결');
    await expect(page.locator('.bd-steps li[aria-current]')).toHaveCount(1);
    await expect(page.locator('.bd-steps button')).toHaveCount(0);
    const fig = page.locator('#bd');
    await expect(fig).toHaveAttribute('data-step', 'connect');
    await expect(fig).toHaveAttribute('data-play', 'idle');
    await expect(page.locator('.bd-now-label')).toHaveText('지금 하는 일');
    await expect(page.locator('.bd-now-text:visible')).toHaveCount(1);
    await expect(page.locator('.bd-now-text:visible')).toHaveText('쓰던 ChatGPT 연결');
    await expect(page.locator('.bd-now-lines')).toHaveAttribute('aria-live', 'off');
  });

  test('재생 단추는 44px 이상이고, 동작 줄이기에서는 눌러야 재생된다', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('.bd-pause');
    await expect(btn).toBeVisible();
    const b = await box(page, '.bd-pause');
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
    await expect(btn).toHaveAccessibleName('재생');
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'idle');
    await btn.click();
    await expect(btn).toHaveAccessibleName('일시정지');
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'playing');
    await btn.click();
    await expect(btn).toHaveAccessibleName('재생');
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
  });

  test('캡션 줄의 높이는 글이 바뀌어도 고정이다', async ({ page }) => {
    await page.goto('/');
    const before = await box(page, '.bd-cap');
    await page.locator('.bd-now-text').evaluateAll((els) => {
      const longest = els.reduce((a, b) => ((b.textContent ?? '').length > (a.textContent ?? '').length ? b : a));
      els.forEach((el) => el.toggleAttribute('data-on', el === longest));
    });
    const after = await box(page, '.bd-cap');
    expect(after.height).toBe(before.height);
    expect(after.y).toBe(before.y);
  });

  test('창 안은 ChatGPT를 연결한 직후 앱 화면이고, 앱 글꼴이 로드된다', async ({ page }) => {
    await page.goto('/');
    const win = page.locator('.bd-win');
    await expect(win.locator('.subject')).toContainText('SQLD');
    await expect(win.locator('.subject .count')).toHaveText('0');
    await expect(win.locator('.side-empty')).toHaveText('아직 경험 카드가 없어요');
    await expect(win.locator('.account')).toContainText('ChatGPT Plus');
    await expect(win.locator('.account')).toContainText('로그인됨');
    await expect(win.locator('.tab-title')).toHaveText('SQLD 보드');
    await expect(win.locator('.tab-label')).toHaveText('필기 3개');
    await expect(win.locator('.world .sticky:visible')).toHaveCount(3);
    await expect(win.getByRole('button', { name: '정리하기' })).toHaveCount(0); // hidden from assistive tech, but drawn
    await expect(win.locator('.board-top .btn')).toHaveText('정리하기');
    await expect(win.locator('.zoom-pct')).toHaveText('90%');
    await expect(win.locator('.hint')).toBeVisible();
    await expect(win.locator('.toolbar .tool')).toHaveCount(2);
    await expect(win.locator('.chat-head h2')).toHaveText('새 대화');
    await expect(win.locator('.chat-head .ttl p')).toHaveText('SQLD · 대화');
    await expect(win.locator('.messages .msg-user:visible, .messages .msg-ai:visible')).toHaveCount(0);
    await expect(win.locator('.x-cursor:visible, .x-capture:visible, .x-section:visible, .x-rec:visible')).toHaveCount(0);
    await expect(win.locator('textarea')).toHaveAttribute('placeholder', 'SQLD에 대해 물어보세요');
    await expect(win.locator('.model-select')).toContainText('기본 모델');
    await expect(win.locator('.plan')).toHaveText('Using ChatGPT plan');
    await expect(win.locator('.plan-row .link')).toHaveText('Manage usage');
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some((f) => f.family.includes('bd-pretendard') && f.status === 'loaded');
    });
    expect(loaded, "the window's own Pretendard subset is in use").toBe(true);
  });

  test('창은 탭 이동에 걸리지 않고 보조 기술에는 그림 설명 하나로만 읽힌다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.bd-box')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.bd-box')).toHaveJSProperty('inert', true);
    const fig = page.locator('#bd');
    await expect(fig).toHaveAccessibleName('Experii 앱 화면 예시');
    await expect(fig).toHaveAccessibleDescription(/SQLD 학습 주제/);
    expect(await fig.ariaSnapshot(), 'the replica adds nothing the reader would hear').not.toContain('로그아웃');
    const inside: string[] = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      inside.push(await page.evaluate(() => (document.activeElement?.closest('.bd-win') ? 'in-window' : '-')));
    }
    expect(inside).not.toContain('in-window');
  });

  test('랜딩의 전역 스타일이 창 안으로 새지 않는다', async ({ page }) => {
    await page.goto('/');
    const got = await page.evaluate(() => {
      const cs = (sel: string) => getComputedStyle(document.querySelector(sel)!);
      const app = cs('.bd-win');
      return {
        textAlign: app.textAlign,
        letterSpacing: app.letterSpacing,
        textWrap: app.textWrap,
        fontSize: app.fontSize,
        lineHeight: app.lineHeight,
        btnH: (document.querySelector('.bd-win .chat-head .btn')! as HTMLElement).offsetHeight,
        btnMinH: cs('.bd-win .chat-head .btn').minHeight,
        h2LetterSpacing: cs('.bd-win .chat-head h2').letterSpacing,
        h2Weight: cs('.bd-win .chat-head h2').fontWeight,
        whoSize: cs('.bd-win .account .who').fontSize,
        svgDisplay: cs('.bd-win .icon-btn svg').display,
        pageAlign: cs('.hero-card').textAlign,
      };
    });
    expect(got.pageAlign, 'the hero card is centred; the window is not').toBe('center');
    expect(got.textAlign).toBe('start');
    expect(got.letterSpacing).toBe('normal');
    expect(got.textWrap).toBe('wrap');
    expect(got.fontSize).toBe('14px');
    expect(got.lineHeight).toBe('21px');
    expect(got.btnH, '.btn of the page has min-height 52px').toBe(32);
    expect(got.btnMinH).toBe('auto');
    expect(got.h2LetterSpacing).toBe('normal');
    expect(got.h2Weight).toBe('600');
    expect(got.whoSize).toBe('14px');
    expect(got.svgDisplay).toBe('block');
  });

  test('로드 직후 앱 창과 캡션 줄은 레이아웃이 밀리지 않는다 (CLS)', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shifts: { value: number; sources: string[] }[] };
      w.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean; sources?: { node?: Node }[] }[]) {
          if (e.hadRecentInput) continue;
          w.__shifts.push({
            value: e.value,
            sources: (e.sources ?? []).map((s) => {
              const el = s.node instanceof Element ? s.node : s.node?.parentElement;
              return el?.closest('.bd-stage') ? 'window' : (el?.tagName ?? '?');
            }),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1_500);
    const shifts = await page.evaluate(() => (window as unknown as { __shifts: { value: number; sources: string[] }[] }).__shifts);
    expect(shifts.filter((s) => s.sources.includes('window')), 'the window, caption and note never move').toEqual([]);
  });

  test('동작 줄이기에서는 GSAP를 받지 않고 시작 화면에 머문다', async ({ page }) => {
    const story = storyRequests(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2_500);
    expect(story.count(), 'the story is not even fetched').toBe(0);
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'idle');
    await expect(page.locator('#bd')).toHaveAttribute('data-step', 'connect');
    const running = await page.locator('.bd-box').evaluate((el) => el.getAnimations({ subtree: true }).length);
    expect(running, 'nothing runs inside the window').toBe(0);
    await expect(page.locator('.bd-win .tab-label')).toHaveText('필기 3개');
    await page.locator('.bd-pause').click();
    await expect.poll(() => story.count(), { message: 'play asked for it' }).toBeGreaterThan(0);
  });
});

// A request for the story's chunk: the one module that draws the capture box.
function storyRequests(page: Page) {
  let n = 0;
  page.on('response', async (r) => {
    if (r.url().endsWith('.js') && (await r.text().catch(() => '')).includes('x-capture-box')) n += 1;
  });
  return { count: () => n };
}

// --- the story ---------------------------------------------------------------------------------------------------------------------
// Time is the page's fake clock, so every moment below is exact: the clock is paused and moved with runFor.

const attr = (page: Page, name: string) => page.locator('#bd').getAttribute(name);
const inside = (page: Page) => page.locator('.bd-win').evaluate((el) => el.innerHTML);
const advance = async (page: Page, ms: number) => {
  for (let left = ms; left > 0; left -= 100) await page.clock.runFor(Math.min(100, left));
};
// Opens the page with the clock frozen and the window in view; returns the window as the server drew it once the story plays (it
// begins within 50 ms of this).
async function startStory(page: Page) {
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 200));
  await page.goto('/', { waitUntil: 'load' });
  const ssr = await inside(page);
  await page.evaluate(() => document.querySelector('#bd')!.scrollIntoView({ block: 'center' }));
  for (let i = 0; i < 80; i++) {
    await page.clock.runFor(50);
    await page.waitForTimeout(50);
    if ((await attr(page, 'data-play')) === 'playing') return ssr;
  }
  throw new Error('the story did not start');
}

test.describe('히어로 재생', () => {
  test.use({ reducedMotion: 'no-preference' });
  test.setTimeout(120_000);

  test('창이 보이면 3초 안에 재생이 시작된다', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.querySelector('#bd')!.scrollIntoView({ block: 'center' }));
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'playing', { timeout: 3_000 });
    await expect(page.locator('.bd-pause')).toHaveAccessibleName('일시정지');
  });

  test('단계 표시와 캡션이 시간에 따라 연결, 캡처, 정리, 추천, 면접으로 바뀐다', async ({ page }) => {
    await startStory(page);
    const names: Record<string, string> = { connect: '연결', capture: '캡처', organize: '정리', recommend: '추천', interview: '면접' };
    const marks: [number, string, string][] = [
      [1.0, 'connect', '쓰던 ChatGPT 연결'],
      [3.0, 'connect', 'SQLD 공부 중'],
      [5.0, 'capture', '대화를 캡처'],
      [7.0, 'capture', '보드에 붙여넣기'],
      [9.0, 'capture', 'AI가 필기 카드로'],
      [11.5, 'organize', '제안을 수락하면 정리'],
      [15.2, 'recommend', '다음 학습 추천'],
      [17.5, 'recommend', '골라서 이어 가기'],
      [20.0, 'interview', 'AI 면접관이 질문'],
      [26.0, 'interview', '연습 통과 · 내 경험'],
    ];
    let at = 0;
    for (const [t, step, line] of marks) {
      await advance(page, t * 1000 - at);
      at = t * 1000;
      await expect(page.locator('#bd')).toHaveAttribute('data-step', step);
      await expect(page.locator('.bd-now-text:visible')).toHaveText(line);
      await expect(page.locator('.bd-steps li[aria-current="step"]')).toHaveText(names[step]);
    }
    await expect(page.locator('.bd-steps li.done'), 'the steps before the current one are marked done').toHaveCount(4);
  });

  test('일시정지하면 멈추고 재생하면 이어진다', async ({ page }) => {
    await startStory(page);
    await advance(page, 5_000);
    await expect(page.locator('#bd')).toHaveAttribute('data-step', 'capture');
    const btn = page.locator('.bd-pause');
    await btn.click();
    await expect(btn).toHaveAccessibleName('재생');
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
    const frozen = await inside(page);
    await advance(page, 12_000);
    expect(await inside(page), 'nothing moves while paused').toBe(frozen);
    await expect(page.locator('#bd')).toHaveAttribute('data-step', 'capture');
    await btn.click();
    await expect(btn).toHaveAccessibleName('일시정지');
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'playing');
    await advance(page, 8_000);
    await expect(page.locator('#bd')).toHaveAttribute('data-step', 'organize');
  });

  test('탭이 숨으면 멈추고 돌아오면 이어서 재생한다, 방문자가 누른 일시정지는 유지한다', async ({ page }) => {
    await startStory(page);
    await advance(page, 3_000);
    const hide = (hidden: boolean) =>
      page.evaluate((h) => {
        Object.defineProperty(document, 'hidden', { value: h, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
    await hide(true);
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
    const at = await inside(page);
    await advance(page, 10_000);
    expect(await inside(page)).toBe(at);
    await hide(false);
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'playing');
    await advance(page, 3_000);
    expect(await inside(page)).not.toBe(at);
    await page.locator('.bd-pause').click();
    await hide(true);
    await hide(false);
    await expect(page.locator('#bd'), 'the visitor paused it').toHaveAttribute('data-play', 'paused');
  });

  test('창이 화면 밖이면 멈추고, 돌아오면 이어서 재생한다', async ({ page }) => {
    await startStory(page);
    await advance(page, 2_000);
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
    const at = await inside(page);
    await advance(page, 6_000);
    expect(await inside(page)).toBe(at);
    await page.evaluate(() => document.querySelector('#bd')!.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'playing');
  });

  test('캡처 구간에서 점선 사각형이 표를 덮고, 놓으면 실선이 된다', async ({ page }) => {
    await startStory(page);
    await advance(page, 5_600);
    const rects = () =>
      page.evaluate(() => {
        const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const box = r('#bd-capture .x-capture-box');
        const table = r('#bd-a1-table');
        return {
          box: [box.left, box.top, box.right, box.bottom],
          table: [table.left, table.top, table.right, table.bottom],
          state: document.querySelector('#bd-capture')!.getAttribute('data-state'),
        };
      });
    await expect(page.locator('#bd-capture')).toBeVisible();
    const before = await rects();
    expect(before.state).toBe('grab');
    expect(before.box[2] - before.box[0], 'the box grows while it is dragged').toBeLessThan(before.table[2] - before.table[0]);
    await expect(page.locator('#bd-capture .x-capture-edge')).toHaveCSS('border-top-style', 'dashed');
    await advance(page, 700);
    const after = await rects();
    expect(after.state).toBe('shot');
    expect(after.box[0]).toBeLessThanOrEqual(after.table[0]);
    expect(after.box[1]).toBeLessThanOrEqual(after.table[1]);
    expect(after.box[2]).toBeGreaterThanOrEqual(after.table[2]);
    expect(after.box[3]).toBeGreaterThanOrEqual(after.table[3]);
    await expect(page.locator('#bd-capture .x-capture-edge')).toHaveCSS('border-top-style', 'solid');
  });

  test('한 바퀴가 끝나면 시작 화면으로 정확히 돌아가 다시 시작하고, 콘솔 오류가 없다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    const ssr = await startStory(page);
    await advance(page, 26_000);
    await expect(page.locator('.bd-win #bd-stamp')).toBeVisible();
    await expect(page.locator('.bd-win #bd-exp-row')).toBeVisible();
    await expect(page.locator('.bd-win #bd-count')).toHaveText('1');
    for (let i = 0; i < 60 && (await attr(page, 'data-loop')) !== '1'; i++) await advance(page, 100);
    expect(await attr(page, 'data-loop'), 'a second loop began').toBe('1');
    await advance(page, 450);
    await expect(page.locator('#bd')).toHaveAttribute('data-step', 'connect');
    const clean = (html: string) => html.replace(/ style=""/g, '');
    expect(clean(await inside(page)), "the window's text, classes and styles are the server's again").toBe(clean(ssr));
    await advance(page, 5_000);
    await expect(page.locator('#bd-cursor-me'), 'the cursor is back in the second loop').toHaveJSProperty('hidden', false);
    expect(errors).toEqual([]);
  });

  for (const size of [
    { width: 360, height: 780 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`재생 중에도 가로 넘침이 없고 캡션 줄과 노트가 제자리다 (${size.width}×${size.height})`, async ({ page }) => {
      await page.setViewportSize(size);
      await startStory(page);
      const geometry = () =>
        page.evaluate(() => {
          const y = (s: string) => {
            const b = document.querySelector(s)!.getBoundingClientRect();
            return [Math.round(b.top + scrollY), Math.round(b.height)];
          };
          return { over: document.documentElement.scrollWidth - innerWidth, cap: y('.bd-cap'), note: y('.hero-demo-note'), box: y('.bd-box') };
        });
      const first = await geometry();
      expect(first.over).toBeLessThanOrEqual(0);
      for (const t of [4_000, 6_000, 8_000, 6_000, 8_000]) {
        await advance(page, t);
        const g = await geometry();
        expect(g.over).toBeLessThanOrEqual(0);
        expect(g.cap, 'the caption row does not move').toEqual(first.cap);
        expect(g.note).toEqual(first.note);
        expect(g.box).toEqual(first.box);
      }
    });
  }
});

// --- where the cursors are when it matters ----------------------------------------------------------------------------------------------

const tip = (page: Page, id: string) =>
  page.evaluate((i) => {
    const r = document.getElementById(i)!.getBoundingClientRect();
    return { x: r.left, y: r.top };
  }, id);
const rect = (page: Page, selector: string) =>
  page.evaluate((s) => {
    const r = document.querySelector(s)!.getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom };
  }, selector);
const within = (p: { x: number; y: number }, r: { l: number; t: number; r: number; b: number }, slack = 1) =>
  p.x >= r.l - slack && p.x <= r.r + slack && p.y >= r.t - slack && p.y <= r.b + slack;

test.describe('히어로 커서', () => {
  test.use({ reducedMotion: 'no-preference' });
  test.setTimeout(120_000);

  // [seconds into the story the press starts, who, target]. The page's clock is the story's: 0.6 s of still comes first.
  const CLICKS: [number, string, string, string][] = [
    [1.75, 'bd-cursor-me', '#bd-input', '입력창'],
    [9.05, 'bd-cursor-me', '#bd-tonote .btn', '[보드에 필기]'],
    [13.3, 'bd-cursor-me', '#bd-accept', '[수락]'],
    [17.1, 'bd-cursor-me', '#bd-rec-1 .x-rec-act .btn', '[이걸로 시작]'],
    [19.3, 'bd-cursor-me', '#bd-practice', '[면접 연습]'],
  ];

  test('누르는 순간 커서 끝은 누르는 단추 위에 있다', async ({ page }) => {
    await startStory(page);
    let at = 0;
    for (const [t, who, target, name] of CLICKS) {
      const ms = (t + 0.6 + 0.04) * 1000;
      await advance(page, ms - at);
      at = ms;
      const point = await tip(page, who);
      const box = await rect(page, target);
      expect(within(point, box), `${name}: the cursor's tip ${JSON.stringify(point)} is in ${JSON.stringify(box)}`).toBe(true);
    }
  });

  test('[수락]으로 가는 커서는 [나중에] 위를 지나지 않는다', async ({ page }) => {
    await startStory(page);
    await advance(page, (11.2 + 0.6) * 1000);
    const later = page.locator('#bd-proposal .btn').nth(1);
    let crossed = false;
    for (let i = 0; i < 25; i++) {
      await advance(page, 100);
      const r = await later.evaluate((el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; });
      if (within(await tip(page, 'bd-cursor-me'), r, 0)) crossed = true;
    }
    expect(crossed, 'the tip never touches [나중에]').toBe(false);
  });

  test('두 말풍선이 함께 보이지 않는다', async ({ page }) => {
    await startStory(page);
    const talking = () => page.evaluate(() => ['bd-cursor-me', 'bd-cursor-ai'].filter((i) => document.getElementById(i)!.dataset.talk === 'on').length);
    let both = 0;
    let said = 0;
    for (let ms = 0; ms < 28_000; ms += 100) {
      await advance(page, 100);
      const n = await talking();
      if (n > 1) both += 1;
      if (n > 0) said += 1;
    }
    expect(said, 'the cursors did talk').toBeGreaterThan(20);
    expect(both, 'never two bubbles at once').toBe(0);
  });

  test('Q2가 보일 때 포인터 끝은 서준 행 안이고 말풍선은 행의 글자와 겹치지 않는다', async ({ page }) => {
    await startStory(page);
    await advance(page, (22.5 + 0.6) * 1000);
    await expect(page.locator('#bd-cursor-ai')).toHaveAttribute('data-talk', 'on');
    await expect(page.locator('#bd-cursor-ai .x-bubble p')).toHaveText('서준 칸은 왜 NULL이죠?');
    const point = await tip(page, 'bd-cursor-ai');
    const row = await rect(page, '#bd-card-1-fig .bd-shot tbody tr:nth-child(3)');
    const spot = await rect(page, '#bd-card-1-spot');
    expect(within(point, row), `the tip ${JSON.stringify(point)} is in the Seojun row ${JSON.stringify(row)}`).toBe(true);
    expect(within(point, spot)).toBe(true);
    const bubble = await rect(page, '#bd-cursor-ai .x-bubble');
    const cells = await page.locator('#bd-card-1-fig .bd-shot tbody tr:nth-child(3) td').evaluateAll((els) =>
      els.map((el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }),
    );
    for (const c of cells) {
      const overlaps = bubble.l < c.r && bubble.r > c.l && bubble.t < c.b && bubble.b > c.t;
      expect(overlaps, `the bubble ${JSON.stringify(bubble)} leaves the cell ${JSON.stringify(c)}`).toBe(false);
    }
    const win = await rect(page, '.bd-box');
    expect(bubble.r).toBeLessThanOrEqual(win.r);
    expect(bubble.b).toBeLessThanOrEqual(win.b);
  });

  test('읽기가 끝난 뒤에는 도는 아이콘이 남지 않는다', async ({ page }) => {
    await startStory(page);
    const spinners = () =>
      page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.bd-win .spin')].filter((el) => el.getClientRects().length > 0).length);
    let at = 0;
    for (const t of [8.3, 15.5, 16.5, 20, 27]) {
      await advance(page, (t + 0.6) * 1000 - at);
      at = (t + 0.6) * 1000;
      expect(await spinners(), `no spinner left at ${t}s`).toBe(0);
    }
  });

  test('[이걸로 시작]은 눌림이 한 번 보인 뒤에 진행 중 칩으로 바뀐다', async ({ page }) => {
    await startStory(page);
    const started = () => page.locator('#bd-rec-1').evaluate((el) => el.classList.contains('is-started'));
    await advance(page, (17.14 + 0.6) * 1000);
    expect(await started(), 'pressed, not yet started').toBe(false);
    await advance(page, 150);
    expect(await started()).toBe(true);
  });

  test('캡처 중에는 "나" 이름표가 선택하는 표를 가리지 않는다', async ({ page }) => {
    await startStory(page);
    await advance(page, (4.9 + 0.6) * 1000);
    await expect(page.locator('#bd-capture')).toBeVisible();
    await expect(page.locator('#bd-cursor-me .x-cursor-tag')).toBeHidden();
    await advance(page, 1_500);
    await expect(page.locator('#bd-cursor-me .x-cursor-tag')).toBeVisible();
  });

  test('표는 행과 함께 나타나고, 빈 격자가 먼저 보이지 않는다', async ({ page }) => {
    await startStory(page);
    await advance(page, (3.5 + 0.6) * 1000);
    const clip = () => page.locator('#bd-a1-table').evaluate((el) => el.style.clipPath);
    expect(await clip()).toMatch(/inset\(0px 0px 100%/);
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      await advance(page, 50);
      seen.add(await clip());
    }
    expect(seen.size, 'the table comes down in steps').toBeGreaterThan(3);
    await advance(page, 400);
    expect(await clip()).toBe('none');
  });
});

// --- the visitor's controls under odd timing -----------------------------------------------------------------------------------------------

test.describe('히어로 일시정지 경계', () => {
  test.use({ reducedMotion: 'no-preference' });
  test.setTimeout(120_000);

  test('일시정지가 화면 밖을 다녀와도 유지된다', async ({ page }) => {
    await startStory(page);
    await advance(page, 3_000);
    await page.locator('.bd-pause').click();
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await advance(page, 500);
    await page.evaluate(() => document.querySelector('#bd')!.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await advance(page, 500);
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
    const at = await inside(page);
    await advance(page, 3_000);
    expect(await inside(page)).toBe(at);
  });

  test('일시정지 중에는 창 안 CSS 애니메이션도 멈춘다', async ({ page }) => {
    await startStory(page);
    await advance(page, 7_600);
    const states = () => page.evaluate(() => document.querySelector('.bd-win')!.getAnimations({ subtree: true }).map((a) => `${(a as CSSAnimation).animationName}:${a.playState}`));
    const running = await states();
    expect(running.some((s) => s.startsWith('bd-spin') && s.endsWith('running')), `the card's spinner turns: ${running}`).toBe(true);
    await page.locator('.bd-pause').click();
    const held = await states();
    expect(held.length).toBeGreaterThan(0);
    expect(held.every((s) => s.endsWith('paused')), `everything holds: ${held}`).toBe(true);
    await page.locator('.bd-pause').click();
    expect((await states()).some((s) => s.endsWith('running'))).toBe(true);
  });

  test('한 판이 끝나기 직전에 멈추면 멈춘 채 있고, 다시 누르면 다음 판으로 넘어간다', async ({ page }) => {
    // (the tick between a loop's end and the next one's start cannot be hit from outside; the code keeps `want` for it)
    const ssr = await startStory(page);
    await advance(page, 30_050);
    await page.locator('.bd-pause').click();
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
    await advance(page, 3_000);
    expect(await attr(page, 'data-loop'), 'no next loop while paused').toBeNull();
    await page.locator('.bd-pause').click();
    await advance(page, 200);
    expect(await attr(page, 'data-loop'), 'the next loop began').toBe('1');
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'playing');
    await advance(page, 300);
    const clean = (html: string) => html.replace(/ style=""/g, '');
    expect(clean(await inside(page))).toBe(clean(ssr));
  });

  test('동작 줄이기를 재생 중에 켜면 멈추고, 끄면 자동 재생 조건으로 이어진다', async ({ page }) => {
    await startStory(page);
    await advance(page, 4_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
    const at = await inside(page);
    await advance(page, 5_000);
    expect(await inside(page)).toBe(at);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('#bd'), 'the window is on screen, so it plays again').toHaveAttribute('data-play', 'playing');
    await advance(page, 2_000);
    expect(await inside(page)).not.toBe(at);
  });

  test('방문자가 멈춘 것은 동작 줄이기를 껐다 켜도 멈춰 있다', async ({ page }) => {
    await startStory(page);
    await advance(page, 4_000);
    await page.locator('.bd-pause').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
  });

  test('다른 쪽으로 갔다 돌아와도 창은 다시 시작 화면이고 오류가 없다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    const ssr = await startStory(page);
    await advance(page, 6_000);
    await page.getByRole('link', { name: '가이드' }).first().click();
    await expect(page).toHaveURL(/\/docs/);
    await page.goBack();
    await expect(page.locator('#bd')).toBeVisible();
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'idle');
    const clean = (html: string) => html.replace(/ style=""/g, '');
    expect(clean(await inside(page)), 'the window came back as the server draws it').toBe(clean(ssr));
    expect(errors).toEqual([]);
  });
});

test.describe('히어로 청크를 받는 동안', () => {
  // reduced motion (the project's default): nothing starts by itself, so the visitor's presses are the only input
  test('받는 중에 한 번 더 누르면 일시정지로 유지된다', async ({ page }) => {
    await page.route('**/_next/static/**/*.js', async (route) => {
      const res = await route.fetch();
      const body = await res.text();
      if (body.includes('x-capture-box')) await new Promise((r) => setTimeout(r, 1_800));
      await route.fulfill({ response: res, body });
    });
    await page.goto('/');
    const btn = page.locator('.bd-pause');
    await btn.click();
    await expect(btn).toHaveAccessibleName('일시정지');
    await btn.click();
    await expect(btn).toHaveAccessibleName('재생');
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'paused');
    const before = await page.locator('.bd-win').evaluate((el) => el.innerHTML);
    await page.waitForTimeout(3_200);
    await expect(page.locator('#bd'), 'the chunk came, the pause stayed').toHaveAttribute('data-play', 'paused');
    expect(await page.locator('.bd-win').evaluate((el) => el.innerHTML)).toBe(before);
  });

  test('받기가 실패하면 라벨이 일시정지에 남지 않는다', async ({ page }) => {
    await page.route('**/_next/static/**/*.js', async (route) => {
      const res = await route.fetch();
      const body = await res.text();
      if (body.includes('x-capture-box')) return route.abort();
      return route.fulfill({ response: res, body });
    });
    await page.goto('/');
    const btn = page.locator('.bd-pause');
    await btn.click();
    await expect(btn).toHaveAccessibleName('재생');
    await expect(page.locator('#bd')).toHaveAttribute('data-play', 'idle');
  });
});
