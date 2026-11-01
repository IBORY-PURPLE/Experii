import {
  test,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Locator,
  type Page,
} from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { CONTEXT_VERSION } from '../../src/main/context';
import { API_KEYS } from '../../src/shared/api';
import { PROMPT_VERSION } from '../../src/shared/card';
import type { ToolEvent } from '../../src/shared/ipc';
import {
  MOCK_CARD,
  MOCK_MODEL,
  MOCK_MODEL_ALT,
  MOCK_TOKEN,
  MOCK_TOOL_QUERY,
  TRIGGERS,
  startMockOpenAI,
  type MockServer,
} from './mock-openai';

type Running = { app: ElectronApplication; win: Page };
type Item = { type: string; role?: string; content?: Array<{ text?: string }> };

const dirs: string[] = [];
let shots: string;
let mock: MockServer;
let userData: string;
let run: Running | null = null;

function tempDir() {
  const dir = mkdtempSync(path.join(tmpdir(), 'experii-e2e-'));
  dirs.push(dir);
  return dir;
}

async function launch(dir: string, signedIn = true): Promise<Running> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !key.startsWith('EXPERII_')) env[key] = value;
  }
  env.EXPERII_USER_DATA = dir;
  if (signedIn) {
    env.EXPERII_API_BASE_URL = mock.url;
    env.EXPERII_TEST_ACCESS_TOKEN = MOCK_TOKEN;
  }
  const app = await electron.launch({ args: ['.'], env });
  return { app, win: await app.firstWindow() };
}

function current(): Running {
  if (!run) throw new Error('app is not running');
  return run;
}

// setContentSize can land one CSS pixel wide on some Windows builds (1281 for 1280), so a width is met within 1px.
async function expectWidth(win: Page, width: number) {
  await expect
    .poll(async () =>
      Math.abs((await win.evaluate(() => window.innerWidth)) - width),
    )
    .toBeLessThanOrEqual(1);
}

// Shots show the settled screen: transitions and fades run to their end, and no hover is left from the last click.
async function shot(win: Page, name: string) {
  await win.mouse.move(0, 0);
  await win.screenshot({
    path: path.join(shots, `${name}.png`),
    animations: 'disabled',
    scale: 'css',
  });
}

const itemText = (item: Item) =>
  (item.content ?? []).map((c) => c.text ?? '').join('');

function savedItems(dir: string) {
  const db = new DatabaseSync(path.join(dir, 'experii.db'));
  try {
    return db
      .prepare('SELECT type, role, text FROM items ORDER BY seq')
      .all() as Array<{ type: string; role: string | null; text: string }>;
  } finally {
    db.close();
  }
}

function isRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const cardView = (win: Page) => win.locator('article.card-view');
const lockedTiles = (win: Page) => win.locator('.tile.locked');
const doneTile = (win: Page) =>
  win.locator('.node:has(.knob:not(.current):not(.locked)) .tile');
const makeButton = (win: Page) =>
  win.getByRole('button', { name: '경험으로 남기기', exact: true });
// FR-07 (2026-10-30): a node or card opens its note page in a tab; the card sits pinned there as a summary.
const roadmapTab = (win: Page) => win.locator('.tab.road .tab-main');
const pinned = (win: Page) => win.locator('section.pin');
const openWholeCard = async (win: Page) => {
  await pinned(win).getByRole('button', { name: '카드 전체 보기' }).click();
  await expect(cardView(win)).toBeVisible();
  return cardView(win);
};

function cardIds(dir: string) {
  const db = new DatabaseSync(path.join(dir, 'experii.db'));
  try {
    return (
      db.prepare('SELECT id FROM experience_cards ORDER BY id').all() as Array<{
        id: string;
      }>
    ).map((r) => r.id);
  } finally {
    db.close();
  }
}

async function sendAndWait(win: Page, text: string) {
  const input = win.getByLabel('메시지');
  await input.fill(text);
  await input.press('Enter');
  await expect(win.locator('.msg-ai[aria-live]')).toBeVisible();
  await expect(win.locator('.msg-ai[aria-live]')).toBeHidden({
    timeout: 15_000,
  });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  shots = path.join(test.info().project.outputDir, 'shots');
  mkdirSync(shots, { recursive: true });
  mock = await startMockOpenAI({ delay: 40 });
});

test.afterAll(async () => {
  await run?.app.close().catch(() => {});
  await mock?.close();
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

test('the renderer is isolated and only sees the allowed bridge', async () => {
  const { app, win } = await launch(tempDir());
  await expect(win).toHaveTitle('Experii');
  expect(
    await app.evaluate(({ BrowserWindow, Menu, nativeTheme }) => [
      Menu.getApplicationMenu(),
      nativeTheme.themeSource,
      BrowserWindow.getAllWindows()[0].getBackgroundColor().toLowerCase(),
    ]),
    'no menu, the light theme and the --bg-main ground',
  ).toEqual([null, 'light', '#f8f9f9']);

  // Without a menu the zoom keys come from main.ts. The keys go in as native input, the way main.ts sees them
  // (Playwright's keyboard skips that handler). The default window has room for two steps (120%).
  const ctrl = (keyCode: string) =>
    app.evaluate(({ BrowserWindow }, key) => {
      const page = BrowserWindow.getAllWindows()[0].webContents;
      page.sendInputEvent({
        type: 'keyDown',
        keyCode: key,
        modifiers: ['control'],
      });
      page.sendInputEvent({
        type: 'keyUp',
        keyCode: key,
        modifiers: ['control'],
      });
    }, keyCode);
  const zoom = () =>
    app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].webContents.getZoomLevel(),
    );
  await ctrl('=');
  await expect.poll(zoom).toBe(0.5);
  await ctrl('=');
  await ctrl('Plus');
  await expect
    .poll(zoom, { message: 'zoom stops before the columns shrink' })
    .toBe(1);
  await ctrl('-');
  await expect.poll(zoom).toBe(0.5);
  await ctrl('0');
  await expect.poll(zoom).toBe(0);
  await ctrl('=');
  await ctrl('=');
  await expect.poll(zoom).toBe(1);
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setContentSize(1184, 681),
  );
  await expect
    .poll(zoom, { message: 'the smallest window has no room to zoom in' })
    .toBe(0);

  expect(
    await win.evaluate(
      () => typeof (globalThis as { require?: unknown }).require,
    ),
  ).toBe('undefined');
  expect(
    await win.evaluate(
      () => typeof (globalThis as { process?: unknown }).process,
    ),
  ).toBe('undefined');
  expect(await win.evaluate(() => Object.keys(window.experii).sort())).toEqual(
    [...API_KEYS].sort(),
  );
  expect(await win.evaluate(() => location.protocol)).toBe('app:');
  expect(
    await win.evaluate(() => window.experii.getRoadmap('nope')),
  ).toMatchObject({ ok: false, code: 'invalid_payload' });

  const before = await win.evaluate(() => location.href);
  expect(
    await win.evaluate(() => window.open('https://example.com')),
  ).toBeNull();
  await win.evaluate(() => {
    location.href = 'https://example.com';
  });
  await win.waitForTimeout(500);
  expect(await win.evaluate(() => location.href)).toBe(before);
  expect(app.windows()).toHaveLength(1);
  await app.close();
});

test('a first run shows the empty state', async () => {
  userData = tempDir();
  run = await launch(userData);
  const { win } = run;
  await expect(win.getByText('아직 과목이 없어요')).toBeVisible();
  await expect(
    win.getByRole('button', { name: '과목 만들기', exact: true }),
    'the sidebar offers one create button until a subject exists',
  ).toHaveCount(1);
  await expect(
    win.getByRole('heading', { name: '과목을 만들면 여기에 길이 생겨요' }),
  ).toBeVisible();
  const input = win.getByLabel('메시지');
  await expect(input).toBeDisabled();
  await expect(input).toHaveAttribute(
    'placeholder',
    '대화는 늘 과목 안에서 시작해요',
  );
  await shot(win, 'm2-first-run');
});

test('creates a subject and streams two turns onto the screen', async () => {
  const { win } = current();
  await win.getByRole('button', { name: '첫 과목 만들기' }).click();
  const dialog = win.getByRole('dialog', { name: '새 과목' });
  await dialog.getByLabel('과목 이름').fill('SQLD');
  await shot(win, 'm2-new-subject-dialog');
  await dialog.getByRole('button', { name: '만들기' }).click();
  await expect(dialog).toBeHidden();
  await expect(win.locator('.subject[aria-current="true"]')).toContainText(
    'SQLD',
  );
  await expect(
    win.getByRole('heading', { name: '오른쪽에서 첫 대화를 시작해 보세요' }),
  ).toBeVisible();
  await shot(win, 'm2-subject-empty');

  await win.getByRole('button', { name: '과목 만들기' }).click();
  await dialog.getByLabel('과목 이름').fill('sqld');
  await dialog.getByRole('button', { name: '만들기' }).click();
  await expect(dialog.getByText('이미 있는 과목이에요')).toBeVisible();
  await dialog.getByRole('button', { name: '취소' }).click();

  const input = win.getByLabel('메시지');
  await input.fill('LEFT JOIN이 헷갈려요');
  await input.press('Enter');
  const live = win.locator('.msg-ai[aria-live]');
  await expect(live).toContainText('핵심 정리');
  await expect(win.getByRole('button', { name: '멈추기' })).toBeVisible();
  const partial = await live.innerText();
  await shot(win, 'm2-streaming');
  await expect(live).toBeHidden({ timeout: 15_000 });
  const answer = win.locator('.msg-ai').last();
  expect(
    (await answer.innerText()).length,
    'deltas reached the screen before the turn completed',
  ).toBeGreaterThan(partial.length);

  await expect(
    answer.getByRole('heading', { name: '핵심 정리' }),
  ).toBeVisible();
  await expect(answer.locator('ol > li')).toHaveCount(2);
  await expect(answer.locator('pre code')).toContainText('LEFT JOIN dept');
  await expect(answer.locator('.link-text')).toHaveText('공식 문서');
  await expect(answer.locator('a')).toHaveCount(0);
  await shot(win, 'm2-markdown-answer');

  mock.pace.delay = 0;
  mock.pace.holdMs = 1500;
  await input.fill('행이 3개 나왔어요');
  await input.press('Enter');
  await expect(live).toContainText('비교해 보면 좋아요.');
  const burst = await live.innerText();
  await expect(live).toBeHidden({ timeout: 15_000 });
  mock.pace.delay = 40;
  mock.pace.holdMs = 0;
  expect(burst, 'every delta of a burst reached the screen').toBe(
    await win.locator('.msg-ai').last().innerText(),
  );
  await expect(win.locator('.msg-user')).toHaveCount(2);
  await expect(win.locator('.msg-ai')).toHaveCount(2);
  await expect(win.locator('.tile', { hasText: '진행 중' })).toContainText(
    '2턴 대화 중',
  );
  await shot(win, 'm2-main');
});

test('turns the conversation into a redacted card and grows the path', async () => {
  const { win } = current();
  mock.pace.holdMs = 5_000;
  await makeButton(win).click();
  const head = win.locator('.chat-head');
  await expect(head.getByRole('status')).toHaveText('카드 만드는 중…');
  await expect(makeButton(win)).toHaveCount(0);
  await expect(head.getByRole('button', { name: '새 대화' })).toHaveCount(0);
  expect(
    await head.locator('h2').evaluate((el) => el.scrollWidth <= el.clientWidth),
    'the conversation title is not cut while its card is made',
  ).toBe(true);
  await expect(win.locator('.sidebar').getByRole('status')).toContainText(
    '경험 카드를 만드는 중…',
  );
  await expect(win.locator('.chip.making')).toContainText('카드 만드는 중');
  await shot(win, 'm3-card-making');
  await win.getByRole('button', { name: '취소' }).click();
  await expect(makeButton(win)).toBeEnabled();
  await expect(head.getByRole('button', { name: '새 대화' })).toBeVisible();
  await expect(win.locator('.tile', { hasText: '진행 중' })).toBeVisible();
  await expect(cardView(win)).toHaveCount(0);

  mock.pace.holdMs = 0;
  const before = savedItems(userData);
  await makeButton(win).click();
  await expect(pinned(win)).toContainText(MOCK_CARD.card.title);
  const view = await openWholeCard(win);

  const body = mock.requests.at(-1)!;
  expect(body.store).toBe(false);
  expect(body.text).toMatchObject({
    format: { type: 'json_schema', name: 'experience_card', strict: true },
  });
  const input = body.input as Item[];
  expect(input.map((i) => [i.type, i.role])).toEqual([
    ['message', 'user'],
    ['message', 'assistant'],
    ['message', 'user'],
    ['message', 'assistant'],
    ['message', 'developer'],
  ]);
  expect(itemText(input[4])).toContain(PROMPT_VERSION);
  expect(savedItems(userData), 'the card exchange is not saved').toEqual(
    before,
  );

  const { card } = MOCK_CARD;
  await expect(view.locator('.cv-band')).toContainText(
    '경험 카드 · SQLD · 오늘',
  );
  await expect(view.getByRole('heading', { name: card.title })).toBeVisible();
  await expect(view.locator('.line-box')).toContainText(card.interview_line);
  await expect(view.getByRole('note')).toHaveText(
    '비밀로 보이는 문자열을 가렸어요: API 키 1개',
  );
  const star = view.locator('.star');
  await expect(star).toContainText(card.star.situation);
  await expect(star).toContainText('***REDACTED***');
  await expect(star).not.toContainText('sk-mock');
  await expect(star.locator('dd.missing')).toHaveText(
    '(대화에서 결과를 확인하지 못함)',
  );
  await expect(view.locator('.concepts li')).toHaveText(card.concepts);
  await expect(view).toContainText(card.next_steps);
  await expect(view).toContainText(`지시문 ${PROMPT_VERSION}`);

  await expect(doneTile(win)).toHaveCount(0);
  await expect(win.locator('.exp', { hasText: card.title })).toContainText(
    '오늘 · 평가 전',
  );
  await shot(win, 'm3-card-created');

  await view.getByRole('button', { name: '면접에 쓸 만해요' }).click();
  await expect(
    view.getByRole('button', { name: '면접에 쓸 만해요' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(win.locator('.exp', { hasText: card.title })).toContainText(
    '오늘 · 쓸 만해요',
  );
  await view.locator('.rate').scrollIntoViewIfNeeded();
  await shot(win, 'm3-card-rated');

  await view.getByRole('button', { name: '접기' }).click();
  await expect(
    pinned(win).getByRole('button', { name: '쓸 만해요' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await roadmapTab(win).click();
  await expect(win.locator('.statbar')).toContainText('1/1');
  await expect(doneTile(win)).toContainText('쓸 만해요');
  await expect(lockedTiles(win)).toHaveText(
    card.recommended_next.map((r) => new RegExp(r.title)),
  );
  await win.locator('.middle').evaluate((el) => el.scrollTo(0, 0));
  await shot(win, 'm3-path-after-card');
});

test('restores the conversation from its node after a restart and resends the whole history', async () => {
  await current().app.close();
  run = await launch(userData);
  const { win } = run;
  await expect(doneTile(win)).toBeVisible();
  await expect(win.locator('.msg-user')).toHaveCount(0);

  await doneTile(win).click();
  await openWholeCard(win);
  await expect(
    cardView(win).getByRole('button', { name: '면접에 쓸 만해요' }),
    'the rating survives a restart',
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(win.locator('.msg-user')).toHaveCount(2);
  await expect(win.locator('.msg-ai')).toHaveCount(2);

  mock.requests.length = 0;
  await sendAndWait(win, 'ON 조건으로 바꿔 볼게요');
  expect(mock.requests).toHaveLength(1);
  const body = mock.requests[0];
  expect(body.store).toBe(false);
  expect(body.stream).toBe(true);
  expect(body).not.toHaveProperty('previous_response_id');
  const messages = (body.input as Item[])
    .filter((i) => i.type === 'message')
    .map((i) => [i.role, itemText(i)]);
  expect(messages).toEqual([
    ['developer', expect.stringContaining(`맥락 버전: ${CONTEXT_VERSION}`)],
    ['user', 'LEFT JOIN이 헷갈려요'],
    ['assistant', expect.stringContaining('핵심 정리')],
    ['user', '행이 3개 나왔어요'],
    ['assistant', expect.stringContaining('확인했어요')],
    ['user', 'ON 조건으로 바꿔 볼게요'],
  ]);
  await expect(win.locator('.msg-ai')).toHaveCount(3);
});

test('a locked node opens a new conversation with a draft, then hides once started', async () => {
  const { win } = current();
  const next = MOCK_CARD.card.recommended_next[0];
  await roadmapTab(win).click();
  await lockedTiles(win).filter({ hasText: next.title }).click();
  const bubble = win.getByRole('group', { name: 'GPT가 추천한 다음 공부' });
  await expect(bubble).toContainText(next.title);
  await expect(bubble).toContainText(next.reason);
  await shot(win, 'm3-locked-bubble');

  await bubble.getByRole('button', { name: '이걸로 시작' }).click();
  await expect(bubble).toBeHidden();
  const input = win.getByLabel('메시지');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue(new RegExp(`"${next.title}"`));
  await expect(win.locator('.msg-user')).toHaveCount(0);
  const draft = await input.inputValue();

  await input.press('Enter');
  await expect(win.locator('.msg-ai[aria-live]')).toBeHidden({
    timeout: 15_000,
  });
  const sent = (mock.requests.at(-1)!.input as Item[]).filter(
    (i) => i.role === 'user',
  );
  expect(sent.map(itemText)).toEqual([draft]);
  await expect(lockedTiles(win)).toHaveCount(1);
  await expect(lockedTiles(win)).not.toContainText(next.title);
  await expect(win.locator('.tile', { hasText: '진행 중' })).toContainText(
    '1턴 대화 중',
  );
});

test('a relaunch starts a new conversation even with one in progress', async () => {
  await current().app.close();
  run = await launch(userData);
  const { win } = run;
  const inProgress = win.locator('.tile', { hasText: '진행 중' });
  await expect(inProgress).toBeVisible();
  await expect(win.locator('.messages .day')).toHaveText('새 대화');
  await expect(win.locator('.msg-user')).toHaveCount(0);

  await inProgress.click();
  await expect(win.locator('.messages .day')).toHaveText('이어서 공부하는 중');
  await expect(win.locator('.msg-user')).toHaveCount(1);
});

test('a stream killed mid-way leaves no partial output after a restart', async () => {
  const { app, win } = current();
  const before = savedItems(userData);
  const prompt = `${TRIGGERS.slow} 조금 더 설명해 줘`;
  const input = win.getByLabel('메시지');
  await input.fill(prompt);
  await input.press('Enter');
  await expect(win.locator('.msg-ai[aria-live]')).toContainText('확인했어요');

  // On Windows Playwright starts Electron through cmd.exe, so app.process() is that shell. Electron's exit code shows
  // before its files are released; the shell exits only once Electron has fully ended, so the database is free then.
  const processes = await app.evaluate(({ app: electronApp }) =>
    electronApp.getAppMetrics().map((m) => ({ pid: m.pid, type: m.type })),
  );
  const proc = app.process();
  const exited = new Promise((resolve) => proc.once('exit', resolve));
  process.kill(processes.find((p) => p.type === 'Browser')!.pid, 'SIGKILL');
  await exited;
  await expect
    .poll(() => processes.filter((p) => isRunning(p.pid)).length, {
      message: 'every app process ends before the relaunch',
    })
    .toBe(0);
  run = null;
  expect(savedItems(userData), 'nothing from the killed turn').toEqual(before);

  run = await launch(userData);
  const { win: next } = run;
  await next.locator('.tile', { hasText: '진행 중' }).click();
  await expect(next.locator('.msg-user')).toHaveCount(1);
  await expect(next.locator('.msg-ai')).toHaveCount(1);
  await expect(next.getByText(prompt)).toHaveCount(0);
});

test('stopping a stream saves nothing and puts the text back', async () => {
  const { win } = current();
  const before = savedItems(userData);
  const prompt = `${TRIGGERS.slow} 하나만 더 물어볼게요`;
  const input = win.getByLabel('메시지');
  await input.fill(prompt);
  await input.press('Enter');
  const live = win.locator('.msg-ai[aria-live]');
  await expect(live).toContainText('확인했어요');
  await win.getByRole('button', { name: '멈추기' }).click();
  await expect(live).toBeHidden();
  await expect(input).toHaveValue(prompt);
  await expect(win.getByRole('alert')).toHaveCount(0);
  await expect(win.locator('.msg-user')).toHaveCount(1);
  expect(savedItems(userData), 'nothing from the stopped turn').toEqual(before);
  await input.fill('');
});

test('regenerating a card asks first, keeps its id and clears the rating', async () => {
  const { win } = current();
  await win.locator('.exp', { hasText: MOCK_CARD.card.title }).click();
  const view = await openWholeCard(win);
  await expect(win.locator('.msg-user')).toHaveCount(3);
  const ids = cardIds(userData);

  await view.getByRole('button', { name: '카드 다시 만들기' }).click();
  const dialog = win.getByRole('dialog', { name: '카드를 다시 만들까요?' });
  await expect(dialog).toContainText('평가는 지워지고');
  await shot(win, 'm3-regenerate-confirm');
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(dialog).toBeHidden();
  await expect(
    view.getByRole('button', { name: '면접에 쓸 만해요' }),
  ).toHaveAttribute('aria-pressed', 'true');

  await view.getByRole('button', { name: '카드 다시 만들기' }).click();
  await dialog.getByRole('button', { name: '다시 만들기' }).click();
  await expect(dialog).toBeHidden();
  await expect(
    view.getByRole('button', { name: '면접에 쓸 만해요' }),
  ).toHaveAttribute('aria-pressed', 'false');
  expect(cardIds(userData), 'same card id').toEqual(ids);

  await view.getByRole('button', { name: '아니에요' }).click();
  await expect(view.getByRole('button', { name: '아니에요' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await roadmapTab(win).click();
  await expect(win.locator('.statbar')).toContainText('0/1');
  await expect(
    lockedTiles(win),
    'not the latest conversation, so the recommendations stay',
  ).toHaveCount(1);
});

test('a conversation with nothing learned does not become a card', async () => {
  const { win } = current();
  await win.locator('.tile', { hasText: '진행 중' }).click();
  await sendAndWait(win, `${TRIGGERS.noLearning} 그냥 인사만 할게요`);
  await makeButton(win).click();
  // The chat head says it is making the card in a status of its own, so the banner is found by its words.
  const banner = win
    .getByRole('status')
    .filter({ hasText: '카드로 남길 학습 내용이 없어요' });
  await expect(banner).toBeVisible();
  await shot(win, 'm3-no-learning');
  await banner.getByRole('button', { name: '계속 대화하기' }).click();
  await expect(banner).toBeHidden();
  await expect(win.getByLabel('메시지')).toBeFocused();
  await expect(pinned(win)).toContainText(
    '경험으로 남기면 이 대화로 카드를 만들어요',
  );
  await roadmapTab(win).click();
  await expect(win.locator('.tile', { hasText: '진행 중' })).toBeVisible();
  await expect(doneTile(win)).toHaveCount(1);
});

test('error banners keep the sent message in the input', async () => {
  const { win } = current();
  const input = win.getByLabel('메시지');
  const banner = win.getByRole('alert');

  const broken = `${TRIGGERS.network} 예제를 하나 더 보여 줘`;
  await input.fill(broken);
  await input.press('Enter');
  await expect(banner).toContainText('답을 받지 못했어요');
  await expect(
    banner.getByRole('button', { name: '다시 보내기' }),
  ).toBeVisible();
  await expect(input).toHaveValue(broken);
  await expect(win.locator('.msg-user')).toHaveCount(2);
  await shot(win, 'm2-banner-network');

  const long = `${TRIGGERS.tooLong} 지금까지 내용을 다시 정리해 줘`;
  await input.fill(long);
  await input.press('Enter');
  await expect(banner).toContainText('대화가 너무 길어요');
  await expect(
    banner.getByRole('button', { name: '경험으로 남기기' }),
  ).toBeVisible();
  await expect(banner.getByRole('button', { name: '새 대화' })).toBeVisible();
  await expect(input).toHaveValue(long);
  await shot(win, 'm3-banner-too-long');
});

test('the main screen fits a 1280 wide window', async () => {
  const { app, win } = current();
  await win.getByLabel('메시지').fill('');
  await doneTile(win).click();
  await openWholeCard(win);
  await win.getByRole('button', { name: '새 대화' }).click();
  await expect(win.locator('.msg-user')).toHaveCount(0);
  await expect(
    win.locator('.tab.active'),
    'a new conversation from a page opens its own page tab',
  ).toContainText('새 페이지');
  await win.getByRole('button', { name: '뒤로' }).click();
  await expect(win.locator('.msg-user')).toHaveCount(3);
  await openWholeCard(win);
  await cardView(win).getByRole('button', { name: '이어서 묻기' }).click();
  await expect(win.getByLabel('메시지')).toBeFocused();
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setContentSize(1280, 800),
  );
  await expectWidth(win, 1280);
  expect(
    await win.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    'no horizontal scroll',
  ).toBe(true);
  await win.locator('.middle').evaluate((el) => el.scrollTo(0, 0));
  await shot(win, 'm3-main-1280');
});

test('h2 reads the ratings the app saved', async () => {
  await current().app.close();
  run = null;
  const out = execFileSync(
    process.execPath,
    ['scripts/h2.mjs', `--db=${path.join(userData, 'experii.db')}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  expect(out).toContain(
    `${PROMPT_VERSION}: 카드 1장, 평가 1장, 쓸 만해요 0장, 0.0% (미달)`,
  );
});

test('without a session the sign-in screen comes first', async () => {
  const signedOut = await launch(tempDir(), false);
  try {
    const { win } = signedOut;
    await expect(
      win.getByRole('heading', { name: '공부한 과정이 면접 경험으로 쌓여요' }),
    ).toBeVisible();
    await expect(
      win.getByRole('button', { name: 'Continue with ChatGPT' }),
    ).toBeVisible();
    await expect(
      win.getByText('ChatGPT Plus·Pro 계정으로 로그인해요'),
    ).toBeVisible();
    await shot(win, 'm2-sign-in');
  } finally {
    await signedOut.app.close();
  }
});

test.describe('the chat knows the app, switches models and searches cards', () => {
  let brain: Running | null = null;
  let brainData: string;

  test.afterAll(async () => {
    await brain?.app.close().catch(() => {});
  });

  const running = () => {
    if (!brain) throw new Error('app is not running');
    return brain;
  };

  // Which form the tools went out in: a namespace, an additional_tools item, plain functions, or none.
  const form = (body: Record<string, unknown>) => {
    const tools = body.tools as Array<{ type: string }> | undefined;
    if (tools?.[0]?.type === 'namespace') return 'namespace';
    if (tools?.[0]?.type === 'function') return 'flat';
    return (body.input as Item[]).some((i) => i.type === 'additional_tools')
      ? 'additional_tools'
      : 'off';
  };

  const latestConversation = (dir: string) => {
    const db = new DatabaseSync(path.join(dir, 'experii.db'));
    try {
      const row = db
        .prepare(
          'SELECT id FROM conversations ORDER BY created_at DESC, rowid DESC LIMIT 1',
        )
        .get() as { id: string };
      return row.id;
    } finally {
      db.close();
    }
  };

  const types = (dir: string, conversationId: string) => {
    const db = new DatabaseSync(path.join(dir, 'experii.db'));
    try {
      return (
        db
          .prepare(
            'SELECT type FROM items WHERE conversation_id = ? ORDER BY seq',
          )
          .all(conversationId) as Array<{ type: string }>
      ).map((r) => r.type);
    } finally {
      db.close();
    }
  };

  test('a card search runs as a tool call and the answer quotes what it found', async () => {
    brainData = tempDir();
    brain = await launch(brainData);
    const { win } = brain;
    await win.getByRole('button', { name: '첫 과목 만들기' }).click();
    const dialog = win.getByRole('dialog', { name: '새 과목' });
    await dialog.getByLabel('과목 이름').fill('SQLD');
    await dialog.getByRole('button', { name: '만들기' }).click();
    await sendAndWait(win, 'LEFT JOIN이 헷갈려요');
    await makeButton(win).click();
    await expect(pinned(win)).toContainText(MOCK_CARD.card.title);
    await win.getByRole('button', { name: '새 대화' }).click();
    await expect(win.locator('.msg-user')).toHaveCount(0);

    await win.evaluate(() => {
      const w = window as unknown as { toolEvents: unknown[] };
      w.toolEvents = [];
      window.experii.onToolEvent((e) => w.toolEvents.push(e));
    });
    mock.requests.length = 0;
    await sendAndWait(win, `${TRIGGERS.tool} 내 카드에서 JOIN 찾아줘`);

    const events = await win.evaluate(
      () => (window as unknown as { toolEvents: ToolEvent[] }).toolEvents,
    );
    expect(events.map((e) => [e.status, e.label, e.query, e.count])).toEqual([
      ['running', '내 경험 카드 검색', MOCK_TOOL_QUERY, undefined],
      ['done', '내 경험 카드 검색', MOCK_TOOL_QUERY, 1],
    ]);
    const answer = win.locator('.msg-ai').last();
    await expect(answer).toContainText('1장을 찾았어요');
    await expect(answer).toContainText(MOCK_CARD.card.title);
    await expect(win.getByRole('alert')).toHaveCount(0);

    expect(mock.requests.map(form)).toEqual(['namespace', 'namespace']);
    const [first, second] = mock.requests.map((b) => b.input as Item[]);
    expect(first[0].role).toBe('developer');
    expect(itemText(first[0])).toContain('지금 과목: SQLD');
    expect(itemText(first[0])).toContain('search_experience_cards');
    const call = second.find((i) => i.type === 'function_call') as Item & {
      call_id: string;
    };
    const output = second.find(
      (i) => i.type === 'function_call_output',
    ) as Item & { call_id: string; output: string };
    expect(output.call_id).toBe(call.call_id);
    expect(JSON.parse(output.output)).toMatchObject({
      total: 1,
      cards: [{ subject: 'SQLD', title: MOCK_CARD.card.title }],
    });
    expect(types(brainData, latestConversation(brainData))).toEqual([
      'message',
      'reasoning',
      'function_call',
      'function_call_output',
      'reasoning',
      'message',
    ]);
  });

  test('a model chosen for the conversation goes out from the next request and becomes the default', async () => {
    const { win } = running();
    expect(await win.evaluate(() => window.experii.listModels())).toEqual({
      ok: true,
      data: {
        models: [
          { slug: MOCK_MODEL, displayName: 'Mock' },
          { slug: MOCK_MODEL_ALT, displayName: 'Mock mini' },
        ],
        current: MOCK_MODEL,
      },
    });
    const id = latestConversation(brainData);
    expect(
      await win.evaluate(
        ([cid, model]) => window.experii.setConversationModel(cid, model),
        [id, MOCK_MODEL_ALT],
      ),
    ).toEqual({ ok: true, data: null });

    mock.requests.length = 0;
    await sendAndWait(win, '모델을 바꿨어요');
    await expect(win.getByRole('alert')).toHaveCount(0);
    expect(mock.requests).toHaveLength(1);
    const body = mock.requests[0];
    expect(body.model).toBe(MOCK_MODEL_ALT);
    const input = body.input as Item[];
    expect(itemText(input[0])).toContain(`Mock mini (${MOCK_MODEL_ALT})`);
    expect(
      input.filter((i) => i.type === 'reasoning'),
      'reasoning from the other model stays in the app',
    ).toEqual([]);

    const view = await win.evaluate(
      (cid) => window.experii.getConversation(cid),
      id,
    );
    expect(view).toMatchObject({
      ok: true,
      data: {
        model: MOCK_MODEL_ALT,
        toolCalls: [
          {
            afterMessage: 0,
            label: '내 경험 카드 검색',
            query: MOCK_TOOL_QUERY,
            count: 1,
          },
        ],
      },
    });
    expect(await win.evaluate(() => window.experii.listModels())).toMatchObject(
      { ok: true, data: { current: MOCK_MODEL_ALT } },
    );
  });

  test('after a restart the saved call and its output go out again as a pair', async () => {
    await running().app.close();
    brain = await launch(brainData);
    const { win } = brain;
    await win.locator('.tile', { hasText: '진행 중' }).click();
    await expect(win.locator('.msg-user')).toHaveCount(2);
    mock.requests.length = 0;
    await sendAndWait(win, '다시 켰어요');
    await expect(win.getByRole('alert')).toHaveCount(0);
    const body = mock.requests[0];
    expect(body.model).toBe(MOCK_MODEL_ALT);
    const input = body.input as Item[];
    expect(input.map((i) => [i.type, i.role])).toEqual([
      ['message', 'developer'],
      ['message', 'user'],
      ['function_call', undefined],
      ['function_call_output', undefined],
      ['message', 'assistant'],
      ['message', 'user'],
      ['reasoning', undefined],
      ['message', 'assistant'],
      ['message', 'user'],
    ]);
    const [call, output] = input.slice(2, 4) as Array<
      Item & { call_id: string }
    >;
    expect(output.call_id).toBe(call.call_id);
  });

  test('a refused tool form falls back within the send, and the next request carries no tools', async () => {
    const { win } = running();
    mock.requests.length = 0;
    await sendAndWait(win, `${TRIGGERS.toolRefused} 내 카드 찾아줘`);
    await expect(win.getByRole('alert')).toHaveCount(0);
    expect(mock.requests.map(form)).toEqual([
      'namespace',
      'additional_tools',
      'flat',
      'off',
    ]);
    await sendAndWait(win, '고마워요');
    expect(mock.requests).toHaveLength(5);
    expect(form(mock.requests[4])).toBe('off');
  });
});

test.describe('card speed', () => {
  let app: Running | null = null;
  const cardRequests = () =>
    mock.requests.filter(
      (body) =>
        (body.text as { format?: { name?: string } } | undefined)?.format
          ?.name === 'experience_card',
    );

  test.afterAll(async () => {
    await app?.app.close().catch(() => {});
    mock.pace.cardDelay = 0;
    mock.pace.holdMs = 0;
  });

  test('card fields arrive one at a time, title first, before the card is done', async () => {
    app = await launch(tempDir());
    const { win } = app;
    await win.getByRole('button', { name: '첫 과목 만들기' }).click();
    const dialog = win.getByRole('dialog', { name: '새 과목' });
    await dialog.getByLabel('과목 이름').fill('네트워크');
    await dialog.getByRole('button', { name: '만들기' }).click();
    await expect(dialog).toBeHidden();
    await sendAndWait(win, 'TCP 3-way handshake가 헷갈려요');

    mock.pace.cardDelay = 15;
    mock.pace.holdMs = 1_000;
    const { conversationId, result, events } = await win.evaluate(async () => {
      const subjects = await window.experii.listSubjects();
      const map = subjects.ok
        ? await window.experii.getRoadmap(subjects.data[0].id)
        : null;
      const node = map?.ok
        ? map.data.nodes.find((n) => n.kind === 'current')
        : undefined;
      if (node?.kind !== 'current') throw new Error('no conversation');
      let done = false;
      const events: Array<Record<string, unknown>> = [];
      const off = window.experii.onCardEvent((e) =>
        events.push({ ...e, done }),
      );
      const result = await window.experii.generateCard(node.conversationId);
      done = true;
      off();
      return { conversationId: node.conversationId, result, events };
    });

    expect(result).toMatchObject({ ok: true, data: { kind: 'card' } });
    const { card } = MOCK_CARD;
    expect(events).toEqual(
      (['title', 'summary', 'interview_line'] as const).map((field) => ({
        conversationId,
        type: 'progress',
        field,
        text: card[field],
        done: false,
      })),
    );
    expect(cardRequests().at(-1)!.reasoning).toEqual({ effort: 'low' });
  });

  test('the conversation goes on while a card is being made', async () => {
    if (!app) throw new Error('app is not running');
    const { win } = app;
    await win.getByRole('button', { name: '새 대화' }).click();
    await expect(win.locator('.msg-user')).toHaveCount(0);
    await sendAndWait(win, 'TCP와 UDP는 뭐가 달라요?');

    mock.pace.cardDelay = 50;
    mock.pace.holdMs = 0;
    const before = cardRequests().length;
    await makeButton(win).click();
    await expect.poll(() => cardRequests().length).toBe(before + 1);

    await expect(win.getByLabel('메시지')).toBeEnabled();
    await sendAndWait(win, 'DNS는 왜 UDP를 써요?');
    await expect(win.locator('.msg-user')).toHaveCount(2);
    await expect(win.locator('.msg-ai')).toHaveCount(2);
    await expect(pinned(win), 'the card is still being made').toHaveCount(0);

    await expect(pinned(win).locator('.pin-rate')).toBeVisible({
      timeout: 20_000,
    });
    const users = (cardRequests().at(-1)!.input as Item[])
      .filter((i) => i.role === 'user')
      .map(itemText);
    expect(users, 'only the conversation as it was at the click').toEqual([
      'TCP와 UDP는 뭐가 달라요?',
    ]);
    await expect(win.locator('.msg-user')).toHaveCount(2);
  });
});

test.describe('answer tables and folding panels', () => {
  let dir: string;
  const appRoot = (win: Page) => win.locator('.app');
  const paneWidth = (win: Page, pane: 'sidebar' | 'chat') =>
    win
      .locator(`.${pane}-pane`)
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
  // Waits out the fold transitions; spinners and the stream cursor loop forever, so they are left out.
  const settle = (win: Page) =>
    win.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      ),
    );
  const noSideScroll = (win: Page) =>
    win.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );

  test('a #표 answer draws GFM tables that scroll sideways inside the chat', async () => {
    await run?.app.close();
    dir = tempDir();
    run = await launch(dir);
    const { win } = run;
    await win.getByRole('button', { name: '첫 과목 만들기' }).click();
    const dialog = win.getByRole('dialog', { name: '새 과목' });
    await dialog.getByLabel('과목 이름').fill('SQLD');
    await dialog.getByRole('button', { name: '만들기' }).click();
    await expect(dialog).toBeHidden();

    await sendAndWait(win, `${TRIGGERS.table} JOIN 결과를 표로 보여 줘`);
    const answer = win.locator('.msg-ai').last();
    const tables = answer.locator('.md-table');
    await expect(tables).toHaveCount(2);
    await expect(tables.first().locator('table th')).toHaveText([
      'emp_id',
      'name',
      'dept_name',
    ]);
    await expect(tables.first().locator('td.null')).toHaveText(['NULL']);
    await expect(tables.nth(1).locator('td.null')).toHaveCount(4);
    await expect(answer.locator('.md-code-lang')).toHaveText('sql');
    await expect(answer.locator('pre code.language-sql')).toContainText(
      'LEFT JOIN dept d',
    );
    await expect(answer.locator('strong')).toHaveText('“NULL”');
    await expect(answer).not.toContainText('|');

    const wide = tables.nth(1);
    expect(
      await wide.evaluate((el) => ({
        overflowX: getComputedStyle(el).overflowX,
        wider: el.scrollWidth > el.clientWidth,
      })),
    ).toEqual({ overflowX: 'auto', wider: true });
    expect(
      await win
        .locator('.messages')
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
      'the wide table scrolls by itself, not the whole chat',
    ).toBe(true);
    await wide.evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
    expect(await wide.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    await wide.evaluate((el) => el.scrollTo({ left: 0 }));
    await shot(win, 'night-view-table');
  });

  test('each side panel folds from its head button and unfolds from its edge handle', async () => {
    const { win } = current();
    const root = appRoot(win);
    await expect(root).toHaveAttribute('data-sidebar', 'open');
    await expect(root).toHaveAttribute('data-chat', 'open');

    const sideToggle = win.locator('#sidebar-toggle');
    await expect(sideToggle).toHaveAccessibleName('사이드바 접기');
    await expect(sideToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(sideToggle).toHaveAttribute('aria-controls', 'sidebar-panel');
    await sideToggle.click();
    await expect(root).toHaveAttribute('data-sidebar', 'folded');
    await expect(win.locator('#sidebar-panel')).toHaveAttribute('inert', '');
    const sideHandle = win.getByRole('button', { name: '사이드바 펴기' });
    await expect(sideHandle).toBeVisible();
    await expect(sideHandle).toHaveAttribute('aria-expanded', 'false');
    await expect(sideHandle).toHaveAttribute('aria-controls', 'sidebar-panel');
    await expect(sideHandle, 'focus follows the folded panel').toBeFocused();
    await settle(win);
    expect(await paneWidth(win, 'sidebar')).toBe(20);
    expect(
      await win
        .locator('#sidebar-panel')
        .evaluate((el) => el.getBoundingClientRect().right),
      'the sidebar slid out of the window',
    ).toBeLessThanOrEqual(0);
    await shot(win, 'night-view-sidebar-folded');

    await sideHandle.click();
    await expect(root).toHaveAttribute('data-sidebar', 'open');
    await expect(win.locator('#sidebar-panel')).not.toHaveAttribute('inert');
    await expect(sideHandle).toBeHidden();
    await expect(sideToggle).toBeFocused();
    await settle(win);
    expect(await paneWidth(win, 'sidebar')).toBe(248);

    const chatToggle = win.locator('#chat-toggle');
    await expect(chatToggle).toHaveAccessibleName('대화 패널 접기');
    await expect(chatToggle).toHaveAttribute('aria-controls', 'chat-panel');
    await chatToggle.click();
    await expect(root).toHaveAttribute('data-chat', 'folded');
    await expect(win.locator('#chat-panel')).toHaveAttribute('inert', '');
    const chatHandle = win.getByRole('button', { name: '대화 패널 펴기' });
    await expect(chatHandle).toBeFocused();
    await settle(win);
    expect(await paneWidth(win, 'chat')).toBe(20);
    await chatHandle.click();
    await expect(root).toHaveAttribute('data-chat', 'open');
    await expect(chatToggle).toBeFocused();
    await settle(win);
    expect(await paneWidth(win, 'chat')).toBe(380);
  });

  test('Ctrl+B and Ctrl+Shift+B fold the panels, except while the IME composes', async () => {
    const { win } = current();
    const root = appRoot(win);
    const input = win.getByLabel('메시지');
    await input.click();

    await win.keyboard.press('Control+KeyB');
    await expect(root).toHaveAttribute('data-sidebar', 'folded');
    await expect(input, 'typing focus stays in the chat').toBeFocused();
    await win.keyboard.press('Control+KeyB');
    await expect(root).toHaveAttribute('data-sidebar', 'open');

    await input.evaluate((el) =>
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ㅠ',
          code: 'KeyB',
          ctrlKey: true,
          shiftKey: true,
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    await expect(root).toHaveAttribute('data-chat', 'open');

    await win.keyboard.press('Control+Shift+KeyB');
    await expect(root).toHaveAttribute('data-chat', 'folded');
    await expect(
      win.getByRole('button', { name: '대화 패널 펴기' }),
    ).toBeFocused();
    await win.keyboard.press('Control+KeyB');
    await expect(root).toHaveAttribute('data-sidebar', 'folded');
    await settle(win);
    expect(await noSideScroll(win)).toBe(true);
    await shot(win, 'night-view-both-folded');
  });

  test('folded panels stay folded after a restart', async () => {
    await current().app.close();
    run = await launch(dir);
    const { win } = run;
    const root = appRoot(win);
    await expect(root).toHaveAttribute('data-sidebar', 'folded');
    await expect(root).toHaveAttribute('data-chat', 'folded');
    expect(
      await win.evaluate(() => localStorage.getItem('experii.layout.v1')),
    ).toBe('{"sidebar":false,"chat":false}');
    expect(await paneWidth(win, 'sidebar')).toBe(20);
    expect(await paneWidth(win, 'chat')).toBe(20);
  });

  test('starting a recommended step unfolds the chat', async () => {
    const { win } = current();
    await win.locator('.tile', { hasText: '진행 중' }).click();
    await win.keyboard.press('Control+Shift+KeyB');
    await expect(appRoot(win)).toHaveAttribute('data-chat', 'open');
    await makeButton(win).click();
    await expect(pinned(win).locator('.pin-rate')).toBeVisible({
      timeout: 20_000,
    });
    await win.keyboard.press('Control+Shift+KeyB');
    await expect(appRoot(win)).toHaveAttribute('data-chat', 'folded');

    await roadmapTab(win).click();
    const next = MOCK_CARD.card.recommended_next[0];
    await lockedTiles(win).filter({ hasText: next.title }).click();
    await win
      .getByRole('group', { name: 'GPT가 추천한 다음 공부' })
      .getByRole('button', { name: '이걸로 시작' })
      .click();
    await expect(appRoot(win)).toHaveAttribute('data-chat', 'open');
    const input = win.getByLabel('메시지');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue(new RegExp(`"${next.title}"`));
  });

  test('no fold state scrolls sideways at 1200 or 1280 wide', async () => {
    const { app, win } = current();
    const root = appRoot(win);
    if ((await root.getAttribute('data-sidebar')) === 'folded')
      await win.keyboard.press('Control+KeyB');
    await expect(root).toHaveAttribute('data-sidebar', 'open');
    await expect(root).toHaveAttribute('data-chat', 'open');
    const states: string[] = [];
    for (const width of [1200, 1280]) {
      await app.evaluate(
        ({ BrowserWindow }, w) =>
          BrowserWindow.getAllWindows()[0].setContentSize(w, 800),
        width,
      );
      await expectWidth(win, width);
      for (const keys of [
        'Control+KeyB',
        'Control+Shift+KeyB',
        'Control+KeyB',
        'Control+Shift+KeyB',
      ]) {
        await win.keyboard.press(keys);
        await settle(win);
        const state = `${width}: ${await root.getAttribute('data-sidebar')}/${await root.getAttribute('data-chat')}`;
        expect(await noSideScroll(win), state).toBe(true);
        states.push(state);
      }
    }
    expect(states).toEqual([
      '1200: folded/open',
      '1200: folded/folded',
      '1200: open/folded',
      '1200: open/open',
      '1280: folded/open',
      '1280: folded/folded',
      '1280: open/folded',
      '1280: open/open',
    ]);
  });

  test('reduced motion turns the fold animation off', async () => {
    const { win } = current();
    const duration = () =>
      appRoot(win).evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(await duration()).toBe('0.24s');
    await win.emulateMedia({ reducedMotion: 'reduce' });
    expect(await duration()).toBe('0s');
    expect(
      await win
        .locator('#chat-panel')
        .evaluate((el) => getComputedStyle(el).transitionDuration),
    ).toBe('0s');
    await win.emulateMedia({ reducedMotion: null });
  });
});

test.describe('model picker, tool line and card progress on screen', () => {
  let app: Running | null = null;
  const running = () => {
    if (!app) throw new Error('app is not running');
    return app;
  };
  const picker = (win: Page) => win.getByRole('combobox', { name: '모델' });
  const streaming = (win: Page) => win.locator('.msg-ai[aria-live]');
  const makingTile = (win: Page) =>
    win.locator('.node:has(.chip.making) .tile');
  const searched = `내 경험 카드 검색 · '${MOCK_TOOL_QUERY}' · `;
  const cardRequests = () =>
    mock.requests.filter(
      (body) =>
        (body.text as { format?: { name?: string } } | undefined)?.format
          ?.name === 'experience_card',
    ).length;
  const lastUserText = (body: Record<string, unknown>) =>
    (body.input as Item[])
      .filter((i) => i.role === 'user')
      .map(itemText)
      .at(-1);

  async function startSend(win: Page, text: string) {
    const input = win.getByLabel('메시지');
    await input.fill(text);
    await input.press('Enter');
    await expect(streaming(win)).toBeVisible();
  }

  test.afterAll(async () => {
    await app?.app.close().catch(() => {});
    mock.pace.cardDelay = 0;
    mock.pace.holdMs = 0;
  });

  test('the model picker shows the conversation model, locks while an answer streams, and the next request uses it', async () => {
    await run?.app.close().catch(() => {});
    run = null;
    app = await launch(tempDir());
    const { win } = app;
    await win.getByRole('button', { name: '첫 과목 만들기' }).click();
    const dialog = win.getByRole('dialog', { name: '새 과목' });
    await dialog.getByLabel('과목 이름').fill('SQLD');
    await dialog.getByRole('button', { name: '만들기' }).click();
    await expect(dialog).toBeHidden();

    const select = picker(win);
    await expect(select).toHaveValue(MOCK_MODEL);
    await expect(select.locator('option')).toHaveText(['Mock', 'Mock mini']);
    await expect(select).toBeEnabled();
    await select.selectOption(MOCK_MODEL_ALT);
    await expect(select).toHaveValue(MOCK_MODEL_ALT);

    mock.requests.length = 0;
    mock.pace.holdMs = 1_500;
    await startSend(win, 'LEFT JOIN이 헷갈려요');
    await expect(select, 'no switching while an answer streams').toBeDisabled();
    await expect(streaming(win)).toBeHidden({ timeout: 15_000 });
    mock.pace.holdMs = 0;
    await expect(select).toBeEnabled();
    await expect(select).toHaveValue(MOCK_MODEL_ALT);
    expect(mock.requests.map((b) => b.model)).toEqual([MOCK_MODEL_ALT]);
    await shot(win, 'night-view2-model-picker');
    await win.locator('.chat .composer').screenshot({
      path: path.join(shots, 'night-view2-model-picker-row.png'),
      scale: 'css',
    });

    await win.getByRole('button', { name: '새 대화' }).click();
    await expect(win.locator('.msg-user')).toHaveCount(0);
    await expect(select, 'the pick is the new default').toHaveValue(
      MOCK_MODEL_ALT,
    );
    await select.selectOption(MOCK_MODEL);
    await win.locator('.tile', { hasText: '진행 중' }).click();
    await expect(win.locator('.msg-user')).toHaveCount(1);
    await expect(select, 'a saved conversation keeps its model').toHaveValue(
      MOCK_MODEL_ALT,
    );
    mock.requests.length = 0;
    await sendAndWait(win, 'ON 조건도 알려 주세요');
    expect(mock.requests.map((b) => b.model)).toEqual([MOCK_MODEL_ALT]);
  });

  test('a card being made shows its title, summary and interview line on its tile and in the sidebar before it is done', async () => {
    const { win } = running();
    const { card } = MOCK_CARD;
    await roadmapTab(win).click();
    await win.evaluate((c) => {
      const w = window as unknown as { seen: string[] };
      w.seen = [];
      const note = (what: string, shown: boolean) => {
        if (shown && !w.seen.includes(what)) w.seen.push(what);
      };
      const observer = new MutationObserver(() => {
        const tile = document.querySelector('.node:has(.chip.making) .tile');
        const text = tile?.textContent ?? '';
        note('title', tile?.querySelector('h2')?.textContent === c.title);
        note('summary', text.includes(c.summary));
        note('interview_line', text.includes(c.interview_line));
        note('card', !!document.querySelector('section.pin .pin-rate'));
        if (w.seen.includes('card')) observer.disconnect();
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    }, card);

    mock.pace.cardDelay = 25;
    mock.pace.holdMs = 1_500;
    await makeButton(win).click();
    const tile = makingTile(win);
    await expect(tile.locator('h2')).toHaveText(card.title);
    await expect(tile).toContainText(card.summary);
    await expect(tile.locator('.line-box')).toContainText(card.interview_line);
    const item = win
      .getByRole('status')
      .filter({ hasText: '경험 카드를 만드는 중…' });
    await expect(item).toContainText(card.title);
    await expect(item).toContainText(card.summary);
    await expect(pinned(win), 'the card is not done yet').toHaveCount(0);
    await shot(win, 'night-view2-card-progress');

    await expect(pinned(win).locator('.pin-rate')).toBeVisible({
      timeout: 20_000,
    });
    mock.pace.cardDelay = 0;
    mock.pace.holdMs = 0;
    expect(
      await win.evaluate(() => (window as unknown as { seen: string[] }).seen),
      'each field showed on the tile before the card opened',
    ).toEqual(['title', 'summary', 'interview_line', 'card']);
  });

  test('a #도구 search shows one status line above the streaming answer, and in the same place after a reopen', async () => {
    const { win } = running();
    await win.getByRole('button', { name: '새 대화' }).click();
    await expect(win.locator('.msg-user')).toHaveCount(0);

    mock.pace.holdMs = 1_500;
    await startSend(win, `${TRIGGERS.tool} 내 카드에서 JOIN 찾아줘`);
    const live = streaming(win).locator('.tool-line');
    await expect(live).toHaveText(`${searched}1장`);
    await expect(live).toHaveAttribute('role', 'status');
    await expect(streaming(win)).toContainText('1장을 찾았어요');
    await shot(win, 'night-view2-tool-line');
    await expect(streaming(win)).toBeHidden({ timeout: 15_000 });
    mock.pace.holdMs = 0;

    const answer = win.locator('.msg-ai', { hasText: '1장을 찾았어요' });
    await expect(answer.locator('.tool-line')).toHaveText(`${searched}1장`);
    await expect(win.locator('.tool-line')).toHaveCount(1);

    await win.getByRole('button', { name: '새 대화' }).click();
    await expect(win.locator('.tool-line')).toHaveCount(0);
    await roadmapTab(win).click();
    await win.locator('.tile', { hasText: '진행 중' }).click();
    await expect(win.locator('.msg-user')).toHaveCount(1);
    await expect(answer.locator('.tool-line')).toHaveText(`${searched}1장`);
    expect(
      await answer.evaluate((el) =>
        [...el.children].map((c) => c.className.split(' ')[0]),
      ),
      'the line sits between the speaker and the text',
    ).toEqual(['who', 'tool-lines', 'md']);
    await shot(win, 'night-view2-tool-line-reopened');
  });

  test('a card finished while an answer streams stays folded on the path', async () => {
    const { win } = running();
    await roadmapTab(win).click();
    await expect(doneTile(win)).toHaveCount(1);
    const chatDelay = mock.pace.delay;
    const before = cardRequests();
    // Both answers hold 3 s; the chat starts after the card and streams slower, so it is still going when the card lands.
    mock.pace.holdMs = 3_000;
    mock.pace.delay = 120;
    try {
      await makeButton(win).click();
      await expect.poll(cardRequests).toBe(before + 1);
      await startSend(win, 'JOIN 결과를 하나 더 보여 줘');

      await expect(win.locator('.chip.making')).toHaveCount(0, {
        timeout: 15_000,
      });
      await expect(
        streaming(win),
        'the answer is still streaming',
      ).toBeVisible();
      await expect(doneTile(win)).toHaveCount(2);
      await expect(pinned(win)).toHaveCount(0);
      await expect(streaming(win)).toBeHidden({ timeout: 15_000 });
    } finally {
      mock.pace.holdMs = 0;
      mock.pace.delay = chatDelay;
    }
    await expect(win.locator('.msg-ai')).toHaveCount(2);
    await expect(pinned(win), 'nor after the answer ends').toHaveCount(0);
  });

  test('unsupported and tool_limit errors get their own banners that send again', async () => {
    const { win } = running();
    const input = win.getByLabel('메시지');
    const banner = win.getByRole('alert');
    const questions = win.locator('.msg-user');
    await expect(questions).toHaveCount(2);

    const refused = `${TRIGGERS.unsupported} 이 그림도 같이 봐 줘`;
    mock.requests.length = 0;
    await input.fill(refused);
    await input.press('Enter');
    await expect(banner).toContainText('이 계정이 받지 않는 기능이 있었어요');
    await expect(input).toHaveValue(refused);
    await expect(questions).toHaveCount(2);
    await shot(win, 'night-view2-banner-unsupported');
    await banner.getByRole('button', { name: '다시 보내기' }).click();
    await expect.poll(() => mock.requests.length).toBe(2);
    expect(lastUserText(mock.requests[1])).toBe(refused);
    await expect(banner).toContainText('이 계정이 받지 않는 기능이 있었어요');
    await expect(questions, 'the resent question is not doubled').toHaveCount(
      2,
    );

    const looping = `${TRIGGERS.toolLoop} 카드를 계속 찾아줘`;
    mock.requests.length = 0;
    await input.fill(looping);
    await input.press('Enter');
    await expect(banner).toContainText('도구를 너무 여러 번 불렀어요');
    await expect(
      banner.getByRole('button', { name: '다시 보내기' }),
    ).toBeVisible();
    await expect(input).toHaveValue(looping);
    expect(
      mock.requests.length,
      'three rounds of tool calls, then the fourth call stops the answer',
    ).toBe(4);
    await shot(win, 'night-view2-banner-tool-limit');
  });
});

test.describe('note pages', () => {
  type SavedNote = {
    kind: string;
    text: string;
    source_seq: number | null;
    question_no: number | null;
    x: number;
    y: number;
  };
  let app: Running | null = null;
  let dir: string;
  const running = () => {
    if (!app) throw new Error('app is not running');
    return app;
  };
  const stickies = (win: Page) => win.locator('.sticky');
  const pageTab = (win: Page, title: string) =>
    win.locator('.tab.page', { hasText: title });
  const activeTab = (win: Page) => win.locator('.tab.active');
  const toast = (win: Page) => win.locator('.toast');
  const box = async (target: Locator) => (await target.boundingBox())!;
  const marked = (win: Page) =>
    win.evaluate(() => CSS.highlights.get('noted')?.size ?? 0);
  const firstTitle = 'LEFT JOIN이 헷갈려요';

  function query<T>(sql: string): T[] {
    const db = new DatabaseSync(path.join(dir, 'experii.db'));
    try {
      return db.prepare(sql).all() as T[];
    } finally {
      db.close();
    }
  }
  const savedNotes = () =>
    query<SavedNote>(
      'SELECT kind, text, source_seq, question_no, x, y FROM notes ORDER BY created_at, rowid',
    );
  const answerSeqs = () =>
    query<{ seq: number }>(
      `SELECT seq FROM items WHERE role = 'assistant' ORDER BY seq`,
    ).map((r) => r.seq);

  // Picks words inside an answer as a mouse would, then lets go of the button.
  async function pick(win: Page, answer: Locator, words: string) {
    await answer.evaluate((el, w) => {
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const at = n.textContent?.indexOf(w) ?? -1;
        if (at < 0) continue;
        const range = document.createRange();
        range.setStart(n, at);
        range.setEnd(n, at + w.length);
        const sel = getSelection()!;
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      throw new Error(`no "${w}" in the answer`);
    }, words);
    await win.evaluate(() =>
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })),
    );
  }

  // A drag as the browser runs one: dragstart on the picked words, then dragenter and dragover where it is headed.
  async function startDrag(
    win: Page,
    answer: Locator,
    words: string,
    to: { x: number; y: number },
  ) {
    await pick(win, answer, words);
    return win.evaluate(({ x, y }) => {
      const data = new DataTransfer();
      const from = getSelection()!.getRangeAt(0).startContainer.parentElement!;
      (window as unknown as { drag: unknown }).drag = { data, from };
      const started = from.dispatchEvent(
        new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer: data,
        }),
      );
      if (!started) return { started, types: [] as string[] };
      const at = {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        clientX: x,
        clientY: y,
      };
      const target = document.elementFromPoint(x, y)!;
      target.dispatchEvent(new DragEvent('dragenter', at));
      target.dispatchEvent(new DragEvent('dragover', at));
      return { started, types: [...data.types] };
    }, to);
  }

  async function finishDrag(win: Page, to: { x: number; y: number }) {
    await win.evaluate(({ x, y }) => {
      const { data, from } = (
        window as unknown as { drag: { data: DataTransfer; from: Element } }
      ).drag;
      document.elementFromPoint(x, y)!.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: data,
          clientX: x,
          clientY: y,
        }),
      );
      from.dispatchEvent(
        new DragEvent('dragend', { bubbles: true, dataTransfer: data }),
      );
    }, to);
  }

  test.afterAll(async () => {
    await app?.app.close().catch(() => {});
  });

  test('words picked from a saved answer become a note with the button beside them', async () => {
    await run?.app.close().catch(() => {});
    run = null;
    dir = tempDir();
    app = await launch(dir);
    const { win } = app;
    await win.getByRole('button', { name: '첫 과목 만들기' }).click();
    const dialog = win.getByRole('dialog', { name: '새 과목' });
    await dialog.getByLabel('과목 이름').fill('SQLD');
    await dialog.getByRole('button', { name: '만들기' }).click();
    await expect(dialog).toBeHidden();
    await sendAndWait(win, firstTitle);
    await sendAndWait(win, '행이 3개 나왔어요');
    const answers = win.locator('.msg-ai');
    await expect(answers.nth(1)).toHaveAttribute('data-q', '2');

    const words =
      '행 수가 늘어난 이유는 오른쪽 테이블에 같은 키가 여러 개 있어서예요.';
    await pick(win, answers.nth(1), words);
    const add = win.getByRole('button', { name: '필기에 추가' });
    await expect(add).toBeVisible();
    await shot(win, 'night-notes-add-button');
    await add.click();

    await expect(activeTab(win)).toContainText(firstTitle);
    await expect(activeTab(win)).toContainText('필기 1개 · 진행 중');
    await expect(stickies(win)).toHaveCount(1);
    await expect(stickies(win).first().locator('.sticky-text')).toHaveText(
      words,
    );
    await expect(stickies(win).first().locator('.sticky-src')).toHaveText(
      /^Q2 · 오[전후] \d{1,2}:\d{2}$/,
    );
    await expect(toast(win)).toHaveText('Q2 답에서 필기를 남겼어요');
    await expect(
      win.locator('.msg-user'),
      'the chat stays on the conversation',
    ).toHaveCount(2);
    expect(savedNotes()).toEqual([
      expect.objectContaining({
        kind: 'excerpt',
        text: words,
        source_seq: answerSeqs()[1],
        question_no: 2,
      }),
    ]);
    await expect.poll(() => marked(win), 'the kept words are marked').toBe(1);

    await pick(win, answers.nth(1), words);
    await add.click();
    await expect(toast(win)).toHaveText('이미 필기한 부분이에요');
    expect(savedNotes()).toHaveLength(1);
  });

  test('dragging words onto the page drops a note where they land', async () => {
    const { win } = running();
    await expect(toast(win)).toHaveCount(0, { timeout: 8_000 });
    const canvas = await box(win.locator('.canvas'));
    const to = {
      x: Math.round(canvas.x + canvas.width * 0.2),
      y: Math.round(canvas.y + canvas.height * 0.62),
    };
    const words = '왼쪽 행을 모두 남기고';
    const drag = await startDrag(win, win.locator('.msg-ai').nth(0), words, to);
    expect(drag.types).toContain('application/x-experii-note');
    const tag = win.locator('.droptag');
    await expect(tag).toContainText('여기에 놓으면 필기가 돼요');
    await expect(tag).toContainText('Q1 답에서');
    await expect(win.locator('.landing')).toBeVisible();
    await shot(win, 'night-notes-drag');

    await finishDrag(win, to);
    await expect(tag).toHaveCount(0);
    const dropped = stickies(win).filter({ hasText: words });
    await expect(dropped).toHaveCount(1);
    await expect(toast(win)).toHaveText('Q1 답에서 필기를 남겼어요');
    expect(savedNotes().at(-1)).toMatchObject({ text: words, question_no: 1 });
    // At 100% the note hangs from the pointer: half a note to the left, 24px up. Measured once it has landed.
    await dropped.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished)),
    );
    const landed = await box(dropped);
    expect(Math.abs(landed.x - (to.x - 132))).toBeLessThanOrEqual(1);
    expect(Math.abs(landed.y - (to.y - 24))).toBeLessThanOrEqual(1);

    await pick(win, win.locator('.msg-ai').nth(0), '양쪽에 짝이 있는 행만');
    await win.getByRole('button', { name: '필기에 추가' }).click();
    await expect(stickies(win)).toHaveCount(3);
    const columns = savedNotes().filter((n) => n.text !== words);
    expect(
      columns.map((n) => [n.question_no, n.x, n.y]),
      'notes kept with the button stand in their question column',
    ).toEqual([
      [2, 664, 64],
      [1, 376, 64],
    ]);
    await expect.poll(() => marked(win)).toBe(3);
  });

  test('a streaming answer cannot become a note, nor a conversation not saved yet', async () => {
    const { win } = running();
    const input = win.getByLabel('메시지');
    await input.fill(`${TRIGGERS.slow} 조금만 더 알려 줘`);
    await input.press('Enter');
    const live = win.locator('.msg-ai[aria-live]');
    await expect(live).toContainText('확인했어요');
    const canvas = await box(win.locator('.canvas'));
    const drag = await startDrag(win, live, '확인했어요', {
      x: canvas.x + 400,
      y: canvas.y + 400,
    });
    expect(drag.started, 'the drag is called off').toBe(false);
    await expect(toast(win)).toHaveText('답이 끝나면 필기할 수 있어요');
    await win.getByRole('button', { name: '멈추기' }).click();
    await expect(live).toBeHidden();
    await input.fill('');
    expect(savedNotes()).toHaveLength(3);

    const refused = await win.evaluate(async () => {
      const subjects = await window.experii.listSubjects();
      if (!subjects.ok) throw new Error('no subjects');
      const fresh = await window.experii.openConversation(subjects.data[0].id);
      if (!fresh.ok) throw new Error('no conversation');
      return window.experii.createNote({
        conversationId: fresh.data.id,
        text: '글',
        sourceSeq: 2,
        x: 0,
        y: 0,
      });
    });
    expect(refused).toMatchObject({ ok: false, code: 'not_saved' });
  });

  test('a note moves where it is dragged and stays there after a restart', async () => {
    const { win } = running();
    const words = '왼쪽 행을 모두 남기고';
    const before = savedNotes().find((n) => n.text === words)!;
    const note = stickies(win).filter({ hasText: words });
    const b = await box(note);
    await win.mouse.move(b.x + 60, b.y + 16);
    await win.mouse.down();
    await win.mouse.move(b.x + 120, b.y - 24, { steps: 6 });
    await win.mouse.move(b.x + 180, b.y - 64, { steps: 6 });
    await win.mouse.up();
    await expect
      .poll(() => savedNotes().find((n) => n.text === words)!.x)
      .toBe(before.x + 120);
    expect(savedNotes().find((n) => n.text === words)!.y).toBe(before.y - 80);

    await running().app.close();
    app = await launch(dir);
    const { win: next } = app;
    await expect(roadmapTab(next)).toHaveAttribute('aria-current', 'page');
    await expect(pageTab(next, firstTitle), 'the tab is back').toBeVisible();
    const tile = next.locator('.tile', { hasText: '진행 중' });
    await expect(tile).toContainText('필기 3개');
    await tile.click();
    await expect(next.locator('.msg-user')).toHaveCount(2);
    const moved = stickies(next).filter({ hasText: words });
    await expect(moved).toHaveCSS('left', `${before.x + 120}px`);
    await expect(moved).toHaveCSS('top', `${before.y - 80}px`);
  });

  test('a note goes with its × or the Delete key and comes back with 되돌리기', async () => {
    const { win } = running();
    const kept = stickies(win).filter({ hasText: '행 수가 늘어난 이유는' });
    await kept.hover();
    await kept.getByRole('button', { name: '필기 지우기' }).click();
    await expect(kept).toHaveCount(0);
    await expect(toast(win)).toContainText('필기를 지웠어요');
    expect(savedNotes()).toHaveLength(2);
    await toast(win).getByRole('button', { name: '되돌리기' }).click();
    await expect(kept).toHaveCount(1);
    await expect.poll(() => savedNotes().length).toBe(3);

    await kept.focus();
    await win.keyboard.press('Delete');
    await expect(kept).toHaveCount(0);
    await expect.poll(() => savedNotes().length).toBe(2);
    await win.keyboard.press('Control+KeyZ');
    await expect(kept, 'Ctrl+Z puts it back').toHaveCount(1);
    await expect.poll(() => savedNotes().length).toBe(3);
    await win.keyboard.press('Control+KeyZ');
    await win.waitForTimeout(300);
    expect(savedNotes(), 'only once').toHaveLength(3);
    await toast(win).getByRole('button', { name: '되돌리기' }).click();
    expect(savedNotes(), 'nor from the toast after Ctrl+Z').toHaveLength(3);
  });

  test('the pinned card summary rates the card, and the next study panel drafts a question for GPT', async () => {
    const { win } = running();
    const { card } = MOCK_CARD;
    await expect(pinned(win)).toContainText(
      '경험으로 남기면 이 대화로 카드를 만들어요',
    );
    await makeButton(win).click();
    const summary = pinned(win);
    await expect(
      summary.getByRole('heading', { name: card.title }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(summary).toContainText(card.summary);
    await expect(summary).toContainText(card.interview_line);
    await expect(summary).toContainText(
      'SQLD 길 1번째 칸 · 질문 2개 · 필기 3개',
    );
    const useful = summary.getByRole('button', { name: '쓸 만해요' });
    await expect(useful).toHaveAttribute('aria-pressed', 'false');
    await expect(activeTab(win)).toContainText(card.title);
    await expect(activeTab(win)).toContainText('필기 3개 · 오늘');
    // the summary's arrival glow fades first, so the shot shows the page at rest
    await win.waitForTimeout(2_000);
    await shot(win, 'night-notes-page');

    await useful.click();
    await expect(useful).toHaveAttribute('aria-pressed', 'true');
    await expect(win.locator('.exp', { hasText: card.title })).toContainText(
      '오늘 · 쓸 만해요',
    );

    await win.getByRole('button', { name: '다음 공부 정하기' }).click();
    const next = win.getByRole('region', { name: '다음 공부 정하기' });
    for (const r of card.recommended_next) {
      await expect(next).toContainText(r.title);
      await expect(next).toContainText(r.reason);
    }
    await shot(win, 'night-notes-next');
    await next.getByRole('button', { name: 'GPT와 상의해서 정하기' }).click();
    const input = win.getByLabel('메시지');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue(
      new RegExp(
        `^다음에 뭘 공부하면 좋을지 내 필기를 보고 같이 정해 줘\\.\\n추천 후보: ① ${card.recommended_next[0].title}`,
      ),
    );
    await expect(input).toHaveValue(/\n내가 필기한 부분: “/);
    await input.fill('');

    await roadmapTab(win).click();
    await expect(win.locator('.statbar')).toContainText('1/1');
    await win.locator('.exp', { hasText: card.title }).click();
    await expect(activeTab(win)).toContainText(card.title);
    await expect(win.locator('.msg-user')).toHaveCount(2);
  });

  test('nodes and tabs open pages, and the chat follows the page in front', async () => {
    const { win } = running();
    const { card } = MOCK_CARD;
    await win.getByRole('button', { name: '새로운 대화 시작' }).click();
    await expect(
      activeTab(win),
      'a new conversation has its own tab',
    ).toContainText('새 페이지');
    await expect(activeTab(win)).toContainText('필기 0개 · 첫 답 전');
    await expect(win.locator('.board-empty')).toContainText(
      '첫 답을 받으면 여기에 필기할 수 있어요',
    );
    await expect(win.getByLabel('메시지')).toBeFocused();
    await expect(win.locator('.msg-user')).toHaveCount(0);
    const other = 'GROUP BY가 궁금해요';
    await sendAndWait(win, other);
    await expect(activeTab(win), 'the tab carries on once saved').toContainText(
      other,
    );
    await expect(win.locator('.board-empty')).toContainText(
      '아직 필기가 없어요',
    );
    await roadmapTab(win).click();
    await expect(win.locator('.tile', { hasText: other })).toContainText(
      '필기 0개',
    );
    await expect(win.locator('.tile', { hasText: card.title })).toContainText(
      '필기 3개',
    );
    await win.locator('.middle').evaluate((el) => el.scrollTo(0, 0));
    await shot(win, 'night-notes-roadmap');

    await win.locator('.tile', { hasText: other }).click();
    await expect(activeTab(win)).toContainText(other);
    await expect(win.locator('.msg-user')).toHaveCount(1);
    await expect(pinned(win)).toContainText(
      '경험으로 남기면 이 대화로 카드를 만들어요',
    );
    await expect(win.locator('.board-empty')).toContainText(
      '아직 필기가 없어요',
    );

    await pageTab(win, card.title).locator('.tab-main').click();
    await expect(win.locator('.msg-user')).toHaveCount(2);
    await expect(stickies(win)).toHaveCount(3);

    await win.getByRole('button', { name: '뒤로' }).click();
    await expect(activeTab(win)).toContainText(other);
    await expect(win.locator('.msg-user')).toHaveCount(1);
    await win.keyboard.press('Alt+ArrowLeft');
    await expect(roadmapTab(win)).toHaveAttribute('aria-current', 'page');
    await expect(
      win.locator('.msg-user'),
      'the roadmap leaves the chat as it was',
    ).toHaveCount(1);
    await win.keyboard.press('Alt+ArrowRight');
    await expect(activeTab(win)).toContainText(other);
    await win.getByRole('button', { name: '앞으로' }).click();
    await expect(activeTab(win)).toContainText(card.title);
    await expect(win.locator('.msg-user')).toHaveCount(2);

    await pageTab(win, other)
      .getByRole('button', { name: /탭 닫기/ })
      .click();
    await expect(pageTab(win, other)).toHaveCount(0);
    await expect(
      activeTab(win),
      'closing a tab behind leaves the page in front',
    ).toContainText(card.title);
    await pageTab(win, card.title)
      .getByRole('button', { name: /탭 닫기/ })
      .click();
    await expect(roadmapTab(win)).toHaveAttribute('aria-current', 'page');
    await win.getByRole('button', { name: '뒤로' }).click();
    await expect(
      pageTab(win, card.title),
      'going back reopens a closed tab',
    ).toBeVisible();
    await expect(activeTab(win)).toContainText(card.title);
  });

  test('words dropped on the roadmap land on the page of the conversation beside it', async () => {
    const { win } = running();
    await roadmapTab(win).click();
    await expect(win.locator('.msg-user')).toHaveCount(2);
    const road = await box(win.locator('.roadmap-view'));
    const to = {
      x: Math.round(road.x + road.width / 2),
      y: Math.round(road.y + road.height / 2),
    };
    const words = '결과가 어떻게 달라지는지';
    const drag = await startDrag(win, win.locator('.msg-ai').nth(1), words, to);
    expect(drag.started).toBe(true);
    await expect(win.locator('.droptag')).toContainText(
      '놓으면 필기 페이지가 열려요',
    );
    await finishDrag(win, to);
    await expect(activeTab(win)).toContainText(MOCK_CARD.card.title);
    await expect(stickies(win).filter({ hasText: words })).toHaveCount(1);
    await expect(toast(win)).toHaveText('Q2 답에서 필기를 남겼어요');
    expect(savedNotes()).toHaveLength(4);
  });

  test('a sentence marked in the chat leads to its note', async () => {
    const { win } = running();
    await roadmapTab(win).click();
    await expect.poll(() => marked(win)).toBe(4);
    const words = '왼쪽 행을 모두 남기고';
    const at = await win
      .locator('.msg-ai')
      .nth(0)
      .evaluate((el, w) => {
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          const i = n.textContent?.indexOf(w) ?? -1;
          if (i < 0) continue;
          const range = document.createRange();
          range.setStart(n, i + 2);
          range.setEnd(n, i + 3);
          const r = range.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        }
        throw new Error(`no "${w}"`);
      }, words);
    await win.mouse.click(at.x, at.y);
    await expect(activeTab(win)).toContainText(MOCK_CARD.card.title);
    await expect(stickies(win).filter({ hasText: words })).toHaveClass(
      /\bflash\b/,
    );
  });
});
