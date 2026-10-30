import {
  test,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Page,
} from '@playwright/test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { API_KEYS } from '../../src/shared/api';
import {
  MOCK_TOKEN,
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

const shot = (win: Page, name: string) =>
  win.screenshot({ path: path.join(shots, `${name}.png`) });

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

test('restores the conversation after a restart and resends the whole history', async () => {
  await current().app.close();
  run = await launch(userData);
  const { win } = run;
  const tile = win.locator('.tile', { hasText: '진행 중' });
  await expect(tile).toContainText('2턴 대화 중');
  await win.getByRole('button', { name: '새 대화' }).click();
  await expect(win.locator('.msg-user')).toHaveCount(0);

  await tile.click();
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
    ['user', 'LEFT JOIN이 헷갈려요'],
    ['assistant', expect.stringContaining('핵심 정리')],
    ['user', '행이 3개 나왔어요'],
    ['assistant', expect.stringContaining('확인했어요')],
    ['user', 'ON 조건으로 바꿔 볼게요'],
  ]);
  await expect(win.locator('.msg-ai')).toHaveCount(3);
});

test('a stream killed mid-way leaves no partial output after a restart', async () => {
  const { app, win } = current();
  const before = savedItems(userData);
  const prompt = `${TRIGGERS.slow} 조금 더 설명해 줘`;
  const input = win.getByLabel('메시지');
  await input.fill(prompt);
  await input.press('Enter');
  await expect(win.locator('.msg-ai[aria-live]')).toContainText('확인했어요');

  const proc = app.process();
  const exited = new Promise((resolve) => proc.once('exit', resolve));
  proc.kill('SIGKILL');
  await exited;
  run = null;
  expect(savedItems(userData), 'nothing from the killed turn').toEqual(before);

  run = await launch(userData);
  const { win: next } = run;
  await next.locator('.tile', { hasText: '진행 중' }).click();
  await expect(next.locator('.msg-user')).toHaveCount(3);
  await expect(next.locator('.msg-ai')).toHaveCount(3);
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
  await expect(win.locator('.msg-user')).toHaveCount(3);
  expect(savedItems(userData), 'nothing from the stopped turn').toEqual(before);
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
  await expect(win.locator('.msg-user')).toHaveCount(3);
  await shot(win, 'm2-banner-network');

  const long = `${TRIGGERS.tooLong} 지금까지 내용을 다시 정리해 줘`;
  await input.fill(long);
  await input.press('Enter');
  await expect(banner).toContainText('대화가 너무 길어요');
  await expect(banner.getByRole('button', { name: '새 대화' })).toBeVisible();
  await expect(input).toHaveValue(long);
  await shot(win, 'm2-banner-too-long');
});

test('the main screen fits a 1280 wide window', async () => {
  const { app, win } = current();
  await win.getByLabel('메시지').fill('');
  await win.locator('.tile', { hasText: '진행 중' }).click();
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setContentSize(1280, 800),
  );
  await expect.poll(() => win.evaluate(() => window.innerWidth)).toBe(1280);
  expect(
    await win.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    'no horizontal scroll',
  ).toBe(true);
  await shot(win, 'm2-main-1280');
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
