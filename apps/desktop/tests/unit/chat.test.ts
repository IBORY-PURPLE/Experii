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
import type { ChatEvent, ToolEvent } from '../../src/shared/ipc';
import { ChatService } from '../../src/main/chat';
import { CONTEXT_VERSION } from '../../src/main/context';
import { Store } from '../../src/main/db';
import { IpcError, StreamRegistry } from '../../src/main/ipc';
import {
  userMessage,
  type FetchLike,
  type RequestBody,
  type Transport,
} from '../../src/main/responses';
import {
  MOCK_MODEL,
  MOCK_MODEL_ALT,
  MOCK_TOKEN,
  TRIGGERS,
  startMockOpenAI,
  type MockServer,
} from '../e2e/mock-openai';
import { cardBody } from './fixtures';

type Item = Record<string, unknown> & { type: string; role?: string };

let mock: MockServer;
let dir: string;
let store: Store;
let chat: ChatService;

beforeAll(async () => {
  mock = await startMockOpenAI({ delay: 0 });
});
afterAll(() => mock.close());

function service(fetchImpl: FetchLike) {
  const transport: Transport = {
    baseUrl: mock.url,
    headers: async () => ({ authorization: `Bearer ${MOCK_TOKEN}` }),
    onUnauthorized: async () => false,
    planLabel: 'chatgpt-plan',
  };
  return new ChatService(
    store,
    { transport: async () => transport, resolveModel: async () => MOCK_MODEL },
    new StreamRegistry(),
    fetchImpl,
  );
}

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'experii-chat-'));
  store = new Store(path.join(dir, 'experii.db'));
  chat = service(fetch);
  mock.requests.length = 0;
});
afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

function turn(
  id: string,
  text: string,
  tools: ToolEvent[] = [],
  svc = chat,
): Promise<ChatEvent[]> {
  return new Promise((resolve) => {
    const events: ChatEvent[] = [];
    svc.send(
      id,
      crypto.randomUUID(),
      text,
      (ev) => {
        events.push(ev);
        if (ev.type !== 'delta') resolve(events);
      },
      (ev) => tools.push(ev),
    );
  });
}

const answerText = (events: ChatEvent[]) =>
  events
    .filter((e) => e.type === 'delta')
    .map((e) => e.text)
    .join('');

function savedCard(subjectId: string, title: string) {
  const id = crypto.randomUUID();
  store.saveTurn(
    { id, subjectId, fromRecommendedNodeId: null, model: MOCK_MODEL, title },
    userMessage('질문'),
    [],
  );
  store.upsertCard(id, cardBody({ title }), {}, MOCK_MODEL, 'v');
}

// Which form the tools went out in: a namespace, an additional_tools item, plain functions, or none.
function form(body: Record<string, unknown>): string {
  const tools = body.tools as Array<{ type: string }> | undefined;
  if (tools?.[0]?.type === 'namespace') return 'namespace';
  if (tools?.[0]?.type === 'function') return 'flat';
  return (body.input as Item[]).some((i) => i.type === 'additional_tools')
    ? 'additional_tools'
    : 'off';
}

const contextOf = (body: Record<string, unknown>) =>
  ((body.input as Item[])[0].content as Array<{ text: string }>)[0].text;

function scripted(reply: (n: number) => Response) {
  const bodies: RequestBody[] = [];
  const fetchImpl: FetchLike = async (_url, init) => {
    bodies.push(JSON.parse(String(init.body)) as RequestBody);
    return reply(bodies.length);
  };
  return { fetchImpl, bodies };
}

const sse = (events: object[]) =>
  new Response(
    new Blob(events.map((e) => `data: ${JSON.stringify(e)}\n\n`)).stream(),
  );

const answer = (text: string) =>
  sse([
    { type: 'response.output_text.delta', delta: text },
    {
      type: 'response.output_item.done',
      item: {
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text }],
      },
    },
    { type: 'response.completed', response: {} },
  ]);

const toolCall = (callId: string) =>
  sse([
    {
      type: 'response.output_item.done',
      item: {
        type: 'function_call',
        call_id: callId,
        name: 'search_experience_cards',
        arguments: '{"query":"JOIN"}',
      },
    },
    { type: 'response.completed', response: {} },
  ]);

const refusal = (param: string) =>
  new Response(
    JSON.stringify({
      error: { code: 'subscription_sharing_unsupported_capability', param },
    }),
    { status: 400 },
  );

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

  it('puts the app context first on every request and never saves it', async () => {
    const s = store.createSubject('SQLD');
    const view = chat.open(s.id);
    await turn(view.id, 'LEFT JOIN이 헷갈려요');
    await turn(view.id, '행이 3개 나왔어요');
    expect(mock.requests).toHaveLength(2);
    for (const body of mock.requests) {
      const [first] = body.input as Array<{
        role?: string;
        content: Array<{ text: string }>;
      }>;
      expect(first.role).toBe('developer');
      const lines = first.content[0].text.split('\n');
      expect(lines).toContain('지금 과목: SQLD');
      expect(lines.at(-1)).toBe(`맥락 버전: ${CONTEXT_VERSION}`);
    }
    const roles = store
      .items(view.id)
      .map((i) => (JSON.parse(i.item_json) as { role?: string }).role);
    expect(roles).not.toContain('developer');
  });

  it('sends the next request with the chosen model and makes it the default', async () => {
    const s = store.createSubject('SQLD');
    const view = chat.open(s.id);
    expect(view.model).toBeNull();
    chat.setModel(view.id, MOCK_MODEL_ALT);
    expect(chat.get(view.id).model).toBe(MOCK_MODEL_ALT);
    await turn(view.id, 'LEFT JOIN이 헷갈려요');
    expect(mock.requests.at(-1)!.model).toBe(MOCK_MODEL_ALT);
    expect(store.getConversationRow(view.id)!.model).toBe(MOCK_MODEL_ALT);

    chat.setModel(view.id, MOCK_MODEL);
    const events = await turn(view.id, '행이 3개 나왔어요');
    expect(
      events.at(-1)?.type,
      'the mock refuses another model’s reasoning',
    ).toBe('done');
    const body = mock.requests.at(-1)!;
    expect(body.model).toBe(MOCK_MODEL);
    expect((body.input as Item[]).some((i) => i.type === 'reasoning')).toBe(
      false,
    );
    expect(chat.get(view.id).model).toBe(MOCK_MODEL);
    expect(store.getSetting('default_model')).toBe(MOCK_MODEL);
    expect(chat.open(s.id).model).toBe(MOCK_MODEL);
    const reasoning = store
      .items(view.id)
      .map((i) => JSON.parse(i.item_json) as Item)
      .filter((i) => i.type === 'reasoning');
    expect(reasoning.map((i) => i.x_model)).toEqual([
      MOCK_MODEL_ALT,
      MOCK_MODEL,
    ]);

    expect(() => chat.setModel(crypto.randomUUID(), MOCK_MODEL)).toThrow(
      IpcError,
    );
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

describe('ChatService tools', () => {
  it('runs a tool call, answers from its output, and saves the whole turn at once', async () => {
    const s = store.createSubject('SQLD');
    savedCard(s.id, 'LEFT JOIN 결과를 직접 비교했다');
    const view = chat.open(s.id);
    const tools: ToolEvent[] = [];
    const events = await turn(
      view.id,
      `${TRIGGERS.tool} 내 카드에서 JOIN 찾아줘`,
      tools,
    );
    expect(events.at(-1)?.type).toBe('done');
    expect(answerText(events)).toContain('1장');
    expect(answerText(events)).toContain('LEFT JOIN 결과를 직접 비교했다');
    expect(
      tools.map((t) => [t.status, t.name, t.label, t.query, t.count]),
    ).toEqual([
      [
        'running',
        'search_experience_cards',
        '내 경험 카드 검색',
        'JOIN',
        undefined,
      ],
      ['done', 'search_experience_cards', '내 경험 카드 검색', 'JOIN', 1],
    ]);
    expect(tools[1]).toMatchObject({
      conversationId: view.id,
      callId: tools[0].callId,
    });

    expect(mock.requests).toHaveLength(2);
    expect(mock.requests.map(form)).toEqual(['namespace', 'namespace']);
    expect(contextOf(mock.requests[0])).toContain('search_experience_cards');
    const input = mock.requests[1].input as Item[];
    const call = input.find((i) => i.type === 'function_call')!;
    const output = input.find((i) => i.type === 'function_call_output')!;
    expect(call).toMatchObject({
      call_id: tools[0].callId,
      name: 'search_experience_cards',
      namespace: 'experii',
    });
    expect(call).not.toHaveProperty('id');
    expect(output.call_id).toBe(call.call_id);
    expect(input.indexOf(call)).toBeLessThan(input.indexOf(output));
    expect(JSON.parse(String(output.output))).toMatchObject({
      total: 1,
      cards: [{ subject: 'SQLD', title: 'LEFT JOIN 결과를 직접 비교했다' }],
    });

    expect(store.items(view.id).map((i) => i.type)).toEqual([
      'message',
      'reasoning',
      'function_call',
      'function_call_output',
      'reasoning',
      'message',
    ]);
    expect(store.getSetting('tools_mode')).toBe('namespace');
    const reopened = chat.get(view.id);
    expect(reopened.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(reopened.toolCalls).toEqual([
      {
        afterMessage: 0,
        name: 'search_experience_cards',
        label: '내 경험 카드 검색',
        query: 'JOIN',
        count: 1,
      },
    ]);
  });

  it('resends a saved call with its output after a restart', async () => {
    const s = store.createSubject('SQLD');
    savedCard(s.id, 'LEFT JOIN 결과를 직접 비교했다');
    const view = chat.open(s.id);
    await turn(view.id, `${TRIGGERS.tool} JOIN 찾아줘`);
    mock.requests.length = 0;
    const events = await turn(view.id, '고마워요', [], service(fetch));
    expect(events.at(-1)?.type, 'the mock refuses an unpaired call').toBe(
      'done',
    );
    expect(
      (mock.requests[0].input as Item[]).map((i) => [i.type, i.role]),
    ).toEqual([
      ['message', 'developer'],
      ['message', 'user'],
      ['reasoning', undefined],
      ['function_call', undefined],
      ['function_call_output', undefined],
      ['reasoning', undefined],
      ['message', 'assistant'],
      ['message', 'user'],
    ]);
  });

  it('drops refused tool forms one by one within the send and remembers the one that worked', async () => {
    const s = store.createSubject('SQLD');
    const view = chat.open(s.id);
    const events = await turn(view.id, `${TRIGGERS.toolRefused} 카드 찾아줘`);
    expect(events.at(-1)?.type).toBe('done');
    expect(mock.requests.map(form)).toEqual([
      'namespace',
      'additional_tools',
      'flat',
      'off',
    ]);
    expect(contextOf(mock.requests[3])).toContain(
      '쓸 수 있는 도구: 지금은 없다',
    );
    expect(store.getSetting('tools_mode')).toBe('off');

    await turn(view.id, '다음 질문');
    expect(mock.requests).toHaveLength(5);
    expect(form(mock.requests[4])).toBe('off');
  });

  it('keeps using the first form that worked', async () => {
    const s = store.createSubject('SQLD');
    const { fetchImpl, bodies } = scripted((n) =>
      n === 1 ? refusal('tools[0]') : answer('네'),
    );
    const svc = service(fetchImpl);
    const view = svc.open(s.id);
    expect((await turn(view.id, '질문', [], svc)).at(-1)?.type).toBe('done');
    expect(store.getSetting('tools_mode')).toBe('additional_tools');
    const extra = (bodies[1].input as Item[]).findIndex(
      (i) => i.type === 'additional_tools',
    );
    expect(extra, 'right after the app context').toBe(1);
    await turn(view.id, '두 번째', [], svc);
    expect(bodies.map(form)).toEqual([
      'namespace',
      'additional_tools',
      'additional_tools',
    ]);
  });

  it('does not retry a refusal of something other than the tools', async () => {
    const s = store.createSubject('SQLD');
    const { fetchImpl, bodies } = scripted(() => refusal('reasoning'));
    const svc = service(fetchImpl);
    const view = svc.open(s.id);
    const events = await turn(view.id, '질문', [], svc);
    expect(events.at(-1)).toMatchObject({ type: 'error', code: 'unsupported' });
    expect(bodies).toHaveLength(1);
    expect(store.getSetting('tools_mode')).toBeNull();
  });

  it('gives up with tool_limit after three rounds of calls and saves nothing', async () => {
    const s = store.createSubject('SQLD');
    const { fetchImpl, bodies } = scripted((n) => toolCall(`call_${n}`));
    const svc = service(fetchImpl);
    const view = svc.open(s.id);
    const tools: ToolEvent[] = [];
    const events = await turn(view.id, '계속 찾아줘', tools, svc);
    expect(events.at(-1)).toMatchObject({ type: 'error', code: 'tool_limit' });
    expect(bodies).toHaveLength(4);
    expect(tools.filter((t) => t.status === 'done')).toHaveLength(3);
    expect(
      (bodies[3].input as Item[])
        .filter((i) => i.type === 'function_call_output')
        .map((i) => i.call_id),
    ).toEqual(['call_1', 'call_2', 'call_3']);
    expect(store.getConversationRow(view.id)).toBeNull();
  });

  it('sends no tools while tools_enabled is 0 and keeps the remembered form', async () => {
    store.setSetting('tools_enabled', '0');
    store.setSetting('tools_mode', 'flat');
    const s = store.createSubject('SQLD');
    const view = chat.open(s.id);
    const tools: ToolEvent[] = [];
    const events = await turn(view.id, `${TRIGGERS.tool} 찾아줘`, tools);
    expect(events.at(-1)?.type).toBe('done');
    expect(mock.requests.map(form)).toEqual(['off']);
    expect(tools).toEqual([]);
    expect(store.getSetting('tools_mode')).toBe('flat');
  });
});
