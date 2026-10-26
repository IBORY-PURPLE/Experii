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

  test('이어 보기가 끝나면 다시 보기, 탭을 누르면 처음 상태로 돌아간다', async ({ page }) => {
    test.setTimeout(60_000);
    const stage = await toStage(page);
    const play = stage.locator('.play');
    await play.click();
    await expect(stage).toHaveAttribute('data-replay', 'playing');
    await expect(stage).toHaveAttribute('data-replay', 'ended', { timeout: 20_000 });
    await expect(play).toContainText('다시 보기');
    await expect(stage.locator('.replay-note')).toBeVisible();
    await expect(stage.locator('#loop-panel-4 .l-card.shown')).toBeVisible();

    await page.locator('#loop-tab-1').click();
    await expect(stage).toHaveAttribute('data-replay', 'idle');
    await expect(play).toContainText('처음부터 이어 보기');
    await expect(stage.locator('.replay-note')).toHaveCount(0);
    const bars = await stage.locator('.prog b').evaluateAll((els) => els.map((b) => (b as HTMLElement).style.transform));
    expect(bars).toEqual(['scaleX(0)', 'scaleX(0)', 'scaleX(0)', 'scaleX(0)']);

    await play.click();
    await expect(stage).toHaveAttribute('data-replay', 'playing');
    await expect(stage).toHaveAttribute('data-step', '1');
  });

  test('키보드 순서: 단계 탭 → 앱 화면 → 다음 단계 → 이어 보기', async ({ page }) => {
    await toStage(page);
    await page.locator('#loop-tab-1').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#loop-panel-1 .thread')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#loop-panel-1 .next-step')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#stage .play')).toBeFocused();
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
