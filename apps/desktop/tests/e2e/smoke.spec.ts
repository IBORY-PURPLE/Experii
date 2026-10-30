import {
  test,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Page,
} from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { API_KEYS } from '../../src/shared/api';
import { PROMPT_VERSION } from '../../src/shared/card';
import {
  MOCK_CARD,
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

// Shots show the settled screen: transitions and fades run to their end, and no hover is left from the last click.
async function shot(win: Page, name: string) {
  await win.mouse.move(0, 0);
  await win.screenshot({
    path: path.join(shots, `${name}.png`),
    animations: 'disabled',
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
  await expect(
    win.getByRole('button', { name: '카드 만드는 중…' }),
  ).toBeDisabled();
  await expect(win.getByRole('status')).toContainText('경험 카드를 만드는 중…');
  await expect(win.locator('.chip.making')).toContainText('카드 만드는 중');
  await shot(win, 'm3-card-making');
  await win.getByRole('button', { name: '취소' }).click();
  await expect(makeButton(win)).toBeEnabled();
  await expect(win.locator('.tile', { hasText: '진행 중' })).toBeVisible();
  await expect(cardView(win)).toHaveCount(0);

  mock.pace.holdMs = 0;
  const before = savedItems(userData);
  await makeButton(win).click();
  const view = cardView(win);
  await expect(view).toBeVisible();

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
  await expect(lockedTiles(win)).toHaveText(
    card.recommended_next.map((r) => new RegExp(r.title)),
  );
  await expect(win.locator('.exp', { hasText: card.title })).toContainText(
    '오늘 · 평가 전',
  );
  await shot(win, 'm3-card-created');

  await view.getByRole('button', { name: '면접에 쓸 만해요' }).click();
  await expect(
    view.getByRole('button', { name: '면접에 쓸 만해요' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(win.locator('.statbar')).toContainText('1/1');
  await expect(win.locator('.exp', { hasText: card.title })).toContainText(
    '오늘 · 쓸 만해요',
  );
  await view.locator('.rate').scrollIntoViewIfNeeded();
  await shot(win, 'm3-card-rated');

  await view.getByRole('button', { name: '접기' }).click();
  await expect(doneTile(win)).toContainText('쓸 만해요');
  await expect(lockedTiles(win)).toHaveCount(2);
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
  await expect(cardView(win)).toBeVisible();
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
  const view = cardView(win);
  await expect(view).toBeVisible();
  await expect(win.locator('.msg-user')).toHaveCount(3);
  const node = win.locator('.node:has(article.card-view)');
  const id = await node.getAttribute('id');

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
  await expect(win.locator('.statbar')).toContainText('0/0');
  expect(await node.getAttribute('id'), 'same card id').toBe(id);
  await expect(
    view.getByRole('button', { name: '면접에 쓸 만해요' }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(
    lockedTiles(win),
    'not the latest conversation, so the recommendations stay',
  ).toHaveCount(1);

  await view.getByRole('button', { name: '아니에요' }).click();
  await expect(win.locator('.statbar')).toContainText('0/1');
});

test('a conversation with nothing learned does not become a card', async () => {
  const { win } = current();
  await cardView(win).getByRole('button', { name: '접기' }).click();
  await win.locator('.tile', { hasText: '진행 중' }).click();
  await sendAndWait(win, `${TRIGGERS.noLearning} 그냥 인사만 할게요`);
  await makeButton(win).click();
  const banner = win.getByRole('status');
  await expect(banner).toContainText('카드로 남길 학습 내용이 없어요');
  await shot(win, 'm3-no-learning');
  await banner.getByRole('button', { name: '계속 대화하기' }).click();
  await expect(banner).toBeHidden();
  await expect(win.getByLabel('메시지')).toBeFocused();
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
  await expect(cardView(win)).toBeVisible();
  await win.getByRole('button', { name: '새 대화' }).click();
  await expect(win.locator('.msg-user')).toHaveCount(0);
  await cardView(win).getByRole('button', { name: '대화 다시 열기' }).click();
  await expect(win.locator('.msg-user')).toHaveCount(3);
  await expect(win.getByLabel('메시지')).toBeFocused();
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
