import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const desktopOnly = (page: Page) => test.skip(page.viewportSize()!.width < 1024, 'desktop layout only');

const toStage = async (page: Page) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const st = document.getElementById('stage')!;
    scrollTo(0, st.getBoundingClientRect().top + scrollY - 72);
  });
  await expect(page.locator('#stage')).toHaveAttribute('data-ready', '');
  return page.locator('#stage');
};

test.describe('작동 방식 (섹션 4)', () => {
  test('폰 프레임이 없고, 화면은 데스크톱 앱 창 안에 그려진다', async ({ page }) => {
    const stage = await toStage(page);
    await expect(page.locator('.phone')).toHaveCount(0);
    await expect(page.locator('[class*="phone" i]')).toHaveCount(0);
    const win = stage.locator(':scope > .aw');
    await expect(win).toHaveCount(1);
    await expect(win.locator('.aw-ctl i')).toHaveCount(3);
    const w = (await win.boundingBox())!;
    const s = (await stage.locator('#loop-panel-1 .screen').boundingBox())!;
    expect(s.x).toBeGreaterThanOrEqual(w.x - 1);
    expect(s.y).toBeGreaterThan(w.y);
    expect(s.x + s.width).toBeLessThanOrEqual(w.x + w.width + 1);
    expect(s.y + s.height).toBeLessThanOrEqual(w.y + w.height + 1);
  });

  test('빈칸에 오답을 고르면 결과 0행, 정답을 고르면 결과 2행', async ({ page }) => {
    const stage = await toStage(page);
    await page.locator('#loop-tab-2').click();
    const panel = stage.locator('#loop-panel-2');
    await expect(panel.locator('.blank')).toHaveText('[ ? ]');
    await panel.getByRole('button', { name: 'INNER JOIN' }).click();
    await expect(panel.locator('.blank.is-wrong')).toHaveText('INNER JOIN');
    await expect(panel.locator('.res-chip.bad')).toHaveText('결과 0행');
    await expect(panel.getByRole('button', { name: 'INNER JOIN' })).toHaveAttribute('aria-pressed', 'true');
    await panel.getByRole('button', { name: 'LEFT JOIN' }).click();
    await expect(panel.locator('.blank.is-right')).toHaveText('LEFT JOIN');
    await expect(panel.locator('.res-table caption')).toHaveText('결과 2행');
    await expect(panel.getByRole('button', { name: '다음 단계: 경험 카드' })).toBeVisible();
  });

  test('알림 1·7·30일을 넘기면 같은 경험 카드가 다시 열린다', async ({ page }) => {
    const stage = await toStage(page);
    await page.locator('#loop-tab-4').click();
    const panel = stage.locator('#loop-panel-4');
    const front = panel.locator('.notif[data-off="0"]');
    await expect(front.locator('.n-date')).toHaveText('10월 27일 화요일');
    await panel.getByRole('button', { name: '다음 알림', exact: true }).click();
    await expect(front.locator('.n-date')).toHaveText('11월 2일 월요일');
    await front.getByRole('button', { name: '다음 알림 보기' }).click();
    await expect(front.locator('.n-date')).toHaveText('11월 25일 수요일');
    await front.getByRole('button', { name: '30일 알림 열기' }).click();
    await expect(panel.locator('.l-card.shown')).toBeVisible();
    await expect(panel.locator('.l-card .revisit-line .dot.on')).toHaveCount(3);
    await expect(panel.locator('.l-card .xc-a')).toContainText('LEFT JOIN과 IS NULL');
    await expect(stage.locator('.aw-title')).toHaveText('경험 카드');
    await expect(panel.getByRole('button', { name: '처음 알림부터 다시' })).toBeVisible();
  });

  test('세트 칩을 누르면 무대가 헤더 바로 아래에 오고 질문이 바뀐다 (V-3/V-4)', async ({ page }) => {
    desktopOnly(page);
    await page.goto('/');
    const chip = page.locator('.how-topics a[data-topic="group"]');
    await chip.scrollIntoViewIfNeeded();
    await chip.click();
    await expect(page).toHaveURL(/#how-group$/);
    await expect(chip).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('#loop-panel-1 .m.me').first()).toHaveText('GROUP BY랑 HAVING 차이가 뭐야? WHERE랑 헷갈려');
    await expect
      .poll(() => page.locator('#stage').evaluate((el) => Math.round(el.getBoundingClientRect().top)))
      .toBeGreaterThanOrEqual(60);
    const top = await page.locator('#stage').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThanOrEqual(84);
  });

  test('해시로 들어와도 무대가 헤더 바로 아래에 온다', async ({ page }) => {
    desktopOnly(page);
    await page.goto('/#how-rank');
    await expect(page.locator('#loop-panel-1 .m.me').first()).toHaveText('ROW_NUMBER랑 RANK 차이가 뭐야?');
    const top = await page.locator('#stage').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(60);
    expect(top).toBeLessThanOrEqual(84);
  });

  test('단계 2·3·4를 연 상태에서도 axe serious·critical 위반이 없다 (흐린 문맥 글자 대비 포함)', async ({ page }) => {
    await toStage(page);
    for (const n of [2, 3, 4]) {
      await page.locator(`#loop-tab-${n}`).click();
      await expect(page.locator(`#loop-panel-${n}`)).toBeVisible();
      const results = await new AxeBuilder({ page }).include('#how').analyze();
      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `step ${n} ${v.id}: ${v.nodes.map((x) => x.target.join(' ')).join(', ')}`)).toEqual([]);
    }
  });

  test('섹션 4는 직접 해 보는 버전이라 자동 재생 버튼이 없다 (보는 버전은 히어로)', async ({ page }) => {
    const stage = await toStage(page);
    await expect(stage.getByRole('button', { name: /이어 보기|다시 보기|일시정지/ })).toHaveCount(0);
  });

  test('경험 카드로 저장을 누르면 내 경험 카드 목록이 열리고 사이드바 숫자가 1 늘어난다', async ({ page }) => {
    desktopOnly(page);
    const stage = await toStage(page);
    await page.locator('#loop-tab-3').click();
    const panel = stage.locator('#loop-panel-3');
    const count = stage.locator('.aw-count');
    const before = Number(await count.textContent());
    const save = panel.getByRole('button', { name: '경험 카드로 저장' });
    await expect(save).toBeVisible();
    await expect(panel.locator('.l-list')).toBeHidden();
    await save.click();
    await expect(panel.locator('.l-list')).toBeVisible();
    await expect(panel.locator('.l-list .xl-new')).toContainText('주문 없는 회원을 LEFT JOIN과 IS NULL로 추리는 과제');
    await expect(count).toHaveText(String(before + 1));
    await expect(panel.locator('.xscroll')).toBeFocused();
  });

  test('직접 해 보는 창에서 누를 수 없는 것은 눌러 보이지 않는다', async ({ page }) => {
    await toStage(page);
    for (const n of [1, 2, 3, 4]) {
      await page.locator(`#loop-tab-${n}`).click();
      await expect(page.locator(`#loop-panel-${n}`)).toBeVisible();
      const dead = await page.locator('#stage').evaluate((root) =>
        [...root.querySelectorAll('*')]
          .filter((el) => {
            const cs = getComputedStyle(el);
            if (!el.getClientRects().length || cs.visibility === 'hidden') return false;
            const looksClickable = cs.cursor === 'pointer' || el.classList.contains('fake');
            return looksClickable && !el.closest('button, a[href], [role="tab"], input, label');
          })
          .map((el) => `${el.tagName}.${el.className}: ${el.textContent}`),
      );
      expect(dead, `step ${n}`).toEqual([]);
    }
  });

  test('리마인드는 데스크톱 알림처럼 창 오른쪽 위에 도착한 알림만 쌓인다', async ({ page }) => {
    desktopOnly(page);
    const stage = await toStage(page);
    await page.locator('#loop-tab-4').click();
    const panel = stage.locator('#loop-panel-4');
    const screen = (await panel.locator('.screen').boundingBox())!;
    const arrived = () =>
      panel
        .locator('.notif')
        .evaluateAll((els) =>
          els.filter((e) => parseFloat(getComputedStyle(e).opacity) > 0.05).map((e) => e.querySelector('.n-date')!.textContent),
        );
    await expect.poll(arrived).toEqual(['10월 27일 화요일']);

    const front = panel.locator('.notif[data-off="0"]');
    const f = (await front.boundingBox())!;
    expect(screen.x + screen.width - (f.x + f.width)).toBeLessThanOrEqual(32);
    expect(f.y - screen.y).toBeLessThanOrEqual(48);
    const date = (await panel.locator('.ld[data-pos="now"] .md').boundingBox())!;
    expect(date.x - screen.x).toBeLessThanOrEqual(48);
    expect(date.y - screen.y).toBeLessThanOrEqual(64);

    const hit = front.getByRole('button', { name: '다음 알림 보기' });
    expect(await hit.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');
    await hit.click();
    await expect.poll(arrived).toEqual(['10월 27일 화요일', '11월 2일 월요일']);
    await expect(front.locator('.n-date')).toHaveText('11월 2일 월요일');
  });

  test('분석 스크립트가 늦게 떠도 깊은 링크 방문의 loop_step 1이 남는다', async ({ page }) => {
    desktopOnly(page);
    type Call = [string, Record<string, string | number> | undefined];
    await page.goto('/#how-group');
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', '');
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const w = window as unknown as { __calls: Call[]; umami: { track: (n: string, d?: Record<string, string | number>) => void } };
      w.__calls = [];
      w.umami = { track: (n, d) => void w.__calls.push([n, d]) };
    });
    await page.locator('.how-topics a[data-topic="join"]').click();
    await page.locator('#loop-tab-2').click();
    const steps = () =>
      page.evaluate(() =>
        (window as unknown as { __calls: Call[] }).__calls.filter(([n]) => n === 'loop_step').map(([, d]) => d),
      );
    await expect
      .poll(steps)
      .toEqual([
        { step: 1, variant: 'h1', topic: 'group' },
        { step: 2, variant: 'h1', topic: 'join' },
      ]);
  });

  test('키보드 순서: 단계 탭 → 앱 화면 → 다음 단계 → 섹션 끝 링크', async ({ page }) => {
    await toStage(page);
    await page.locator('#loop-tab-1').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#loop-panel-1 .thread')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#loop-panel-1 .next-step')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#how a.how-link')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#loop-tab-1')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#loop-tab-2')).toBeFocused();
    await expect(page.locator('#loop-tab-2')).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('작동 방식, 움직임 허용', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('③ 쿼리 조각은 날아오는 조각이 출발한 뒤에야 카드에 보인다', async ({ page }) => {
    await toStage(page);
    const log = await page.evaluate(
      () =>
        new Promise<{ fly: number; snip: number }>((resolve) => {
          const p = document.getElementById('loop-panel-3')!;
          const t0 = performance.now();
          let fly = -1;
          let snip = -1;
          document.getElementById('loop-tab-3')!.click();
          const tick = () => {
            const t = performance.now() - t0;
            if (fly < 0 && p.querySelector('.fly.go')) fly = t;
            const s = p.querySelector('.l-chat .xc-snip');
            if (snip < 0 && s && !s.classList.contains('pending') && getComputedStyle(s).opacity !== '0') snip = t;
            if (t < 3000) requestAnimationFrame(tick);
            else resolve({ fly, snip });
          };
          tick();
        }),
    );
    expect(log.fly).toBeGreaterThanOrEqual(0);
    expect(log.snip).toBeGreaterThan(log.fly);
  });
});
