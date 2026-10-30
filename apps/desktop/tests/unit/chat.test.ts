import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { ChatEvent } from '../../src/shared/ipc';
import { ChatService } from '../../src/main/chat';
import { Store } from '../../src/main/db';
import { StreamRegistry } from '../../src/main/ipc';
import type { Transport } from '../../src/main/responses';
import {
  MOCK_TOKEN,
  TRIGGERS,
  startMockOpenAI,
  type MockServer,
} from '../e2e/mock-openai';

let mock: MockServer;
let dir: string;
let store: Store;
let chat: ChatService;

beforeAll(async () => {
  mock = await startMockOpenAI({ delay: 0 });
});
afterAll(() => mock.close());

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'experii-chat-'));
  store = new Store(path.join(dir, 'experii.db'));
  const transport: Transport = {
    baseUrl: mock.url,
    headers: async () => ({ authorization: `Bearer ${MOCK_TOKEN}` }),
    onUnauthorized: async () => false,
    planLabel: 'chatgpt-plan',
  };
  chat = new ChatService(
    store,
    { transport: async () => transport, resolveModel: async () => 'gpt-mock' },
    new StreamRegistry(),
    fetch,
  );
  mock.requests.length = 0;
});
afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

function turn(id: string, text: string): Promise<ChatEvent[]> {
  return new Promise((resolve) => {
    const events: ChatEvent[] = [];
    chat.send(id, crypto.randomUUID(), text, (ev) => {
      events.push(ev);
      if (ev.type !== 'delta') resolve(events);
    });
  });
}

describe('ChatService', () => {
  it('creates the conversation on the first saved turn and replays full history after', async () => {
    const s = store.createSubject('SQLD');
    const view = chat.open(s.id);
    expect(store.getConversationRow(view.id)).toBeNull();

    const first = await turn(view.id, 'LEFT JOIN이 헷갈려요');
    expect(first.at(-1)?.type).toBe('done');
    expect(first.filter((e) => e.type === 'delta').length).toBeGreaterThan(1);
    expect(store.getConversationRow(view.id)?.title).toBe(
      'LEFT JOIN이 헷갈려요',
    );

    await turn(view.id, '행이 3개 나왔어요');
    const body = mock.requests.at(-1)!;
    expect(body.store).toBe(false);
    expect(body.stream).toBe(true);
    expect('previous_response_id' in body).toBe(false);
    const input = body.input as Array<{
      type: string;
      role?: string;
      id?: string;
    }>;
    expect(input.filter((i) => i.role === 'user')).toHaveLength(2);
    expect(input.filter((i) => i.type === 'reasoning')).toHaveLength(1);
    expect(input.every((i) => i.id === undefined)).toBe(true);
    expect(chat.get(view.id).messages.map((m) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ]);
  });

  it('saves nothing when the stream breaks, and maps the error', async () => {
    const s = store.createSubject('SQLD');
    const view = chat.open(s.id);
    const events = await turn(view.id, `질문 ${TRIGGERS.network}`);
    expect(events.at(-1)).toMatchObject({ type: 'error', code: 'network' });
    expect(store.getConversationRow(view.id)).toBeNull();

    const tooLong = await turn(view.id, `질문 ${TRIGGERS.tooLong}`);
    expect(tooLong.at(-1)).toMatchObject({
      type: 'error',
      code: 'context_too_long',
    });
    const plan = await turn(view.id, `질문 ${TRIGGERS.plan}`);
    expect(plan.at(-1)).toMatchObject({
      type: 'error',
      code: 'not_eligible_plan',
    });
  });

  it('puts a draft on a conversation opened from a recommended node', () => {
    const s = store.createSubject('SQLD');
    const view = chat.open(s.id);
    store.saveTurn(
      {
        id: view.id,
        subjectId: s.id,
        fromRecommendedNodeId: null,
        model: 'm',
        title: 't',
      },
      {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: 'q' }],
      },
      [],
    );
    store.upsertCard(
      view.id,
      {
        title: 't',
        summary: 's',
        interview_line: 'i',
        star: { situation: 's', task: 't', action: 'a', result: null },
        concepts: [],
        next_steps: 'n',
        recommended_next: [
          { title: 'ON과 WHERE', reason: '헷갈린다고 했어요.' },
        ],
      },
      {},
      'm',
      'v',
    );
    const locked = store.roadmap(s.id)!.nodes.find((n) => n.kind === 'locked')!;
    const next = chat.open(
      s.id,
      locked.kind === 'locked' ? locked.id : undefined,
    );
    expect(next.draft).toContain('ON과 WHERE');
  });
});
