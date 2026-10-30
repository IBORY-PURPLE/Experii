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
  const banner = win.getByRole('alert');
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
    await expect(cardView(win)).toBeVisible();
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
    await expect(cardView(win), 'the card is still being made').toHaveCount(0);

    await expect(cardView(win)).toBeVisible({ timeout: 20_000 });
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
    await expect(cardView(win)).toBeVisible({ timeout: 20_000 });
    await win.keyboard.press('Control+Shift+KeyB');
    await expect(appRoot(win)).toHaveAttribute('data-chat', 'folded');

    await cardView(win).getByRole('button', { name: '접기' }).click();
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
      await expect
        .poll(() => win.evaluate(() => window.innerWidth))
        .toBe(width);
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
    expect(await duration()).toBe('0.22s');
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
