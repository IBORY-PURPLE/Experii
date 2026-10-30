import { randomUUID } from 'node:crypto';
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
  vi,
} from 'vitest';
import { CardService } from '../../src/main/cards';
import { Store } from '../../src/main/db';
import { StreamRegistry } from '../../src/main/ipc';
import { REDACTED } from '../../src/main/redact';
import {
  userMessage,
  type FetchLike,
  type RequestBody,
  type Transport,
} from '../../src/main/responses';
import { PROMPT_VERSION, cardJsonSchema } from '../../src/shared/card';
import type { CardEvent } from '../../src/shared/ipc';
import {
  MOCK_CARD,
  MOCK_TOKEN,
  TRIGGERS,
  startMockOpenAI,
  type MockServer,
} from '../e2e/mock-openai';

type Msg = { type: string; role?: string; content?: Array<{ text?: string }> };

let mock: MockServer;
let dir: string;
let store: Store;
let subjectId: string;
let streams: StreamRegistry;

beforeAll(async () => {
  mock = await startMockOpenAI({ delay: 0 });
});
afterAll(() => mock.close());

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'experii-cards-'));
  store = new Store(path.join(dir, 'experii.db'));
  subjectId = store.createSubject('SQLD').id;
  streams = new StreamRegistry();
  mock.requests.length = 0;
  mock.pace.holdMs = 0;
});
afterEach(() => {
  vi.restoreAllMocks();
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

function service(fetchImpl: FetchLike = fetch, timeoutMs?: number) {
  const transport: Transport = {
    baseUrl: mock.url,
    headers: async () => ({ authorization: `Bearer ${MOCK_TOKEN}` }),
    onUnauthorized: async () => false,
    planLabel: 'chatgpt-plan',
  };
  return new CardService(
    store,
    { transport: async () => transport, resolveModel: async () => 'gpt-mock' },
    streams,
    fetchImpl,
    timeoutMs,
  );
}

function conversation(turns: Array<[string, string]>): string {
  const id = randomUUID();
  for (const [question, answer] of turns) {
    store.saveTurn(
      {
        id,
        subjectId,
        fromRecommendedNodeId: null,
        model: 'gpt-mock',
        title: question,
      },
      userMessage(question),
      [
        { id: 'rs_1', type: 'reasoning', summary: [] },
        {
          id: 'msg_1',
          type: 'message',
          role: 'assistant',
          status: 'completed',
          content: [{ type: 'output_text', text: answer }],
        },
      ],
    );
  }
  return id;
}

const text = (m: Msg) => (m.content ?? []).map((c) => c.text ?? '').join('');
const users = (body: RequestBody) =>
  (body.input as Msg[]).filter((m) => m.role === 'user').map(text);

function scripted(reply: (n: number) => Response) {
  const bodies: RequestBody[] = [];
  const fetchImpl: FetchLike = async (_url, init) => {
    bodies.push(JSON.parse(String(init.body)) as RequestBody);
    return reply(bodies.length);
  };
  return { fetchImpl, bodies };
}

function answer(output: string): Response {
  const item = {
    type: 'message',
    role: 'assistant',
    content: [{ type: 'output_text', text: output }],
  };
  const events = [
    { type: 'response.output_text.delta', delta: output },
    { type: 'response.output_item.done', item },
    { type: 'response.completed', response: {} },
  ];
  return new Response(
    new Blob(events.map((e) => `data: ${JSON.stringify(e)}\n\n`)).stream(),
  );
}

const overflow = () =>
  new Response('{"error":{"code":"context_length_exceeded"}}', {
    status: 400,
  });

const refused = (param: string) =>
  new Response(
    JSON.stringify({
      error: { code: 'subscription_sharing_unsupported_capability', param },
    }),
    { status: 400 },
  );

describe('CardService', () => {
  it('sends the message items with the card instructions last and stores a redacted card', async () => {
    const id = conversation([
      ['LEFT JOIN이 헷갈려요', '설명'],
      ['행이 3개 나왔어요', '확인'],
    ]);
    const before = store.items(id);

    const result = await service().generate(id);

    expect(result).toEqual({
      kind: 'card',
      cardId: expect.any(String),
      redactions: { openai_key: 1 },
    });
    const body = mock.requests.at(-1)!;
    expect(body.store).toBe(false);
    expect(body.stream).toBe(true);
    expect('previous_response_id' in body).toBe(false);
    expect(body.text).toEqual({
      format: {
        type: 'json_schema',
        name: 'experience_card',
        strict: true,
        schema: cardJsonSchema(),
      },
    });
    expect(body.reasoning).toEqual({ effort: 'low' });
    const input = body.input as Msg[];
    expect(input.map((m) => [m.type, m.role])).toEqual([
      ['message', 'user'],
      ['message', 'assistant'],
      ['message', 'user'],
      ['message', 'assistant'],
      ['message', 'developer'],
    ]);
    expect(text(input[4])).toContain(PROMPT_VERSION);
    expect(text(input[4])).toContain('"SQLD"');
    expect(store.items(id), 'the card exchange is not saved').toEqual(before);

    const card = store.getCard(result.kind === 'card' ? result.cardId : '')!;
    expect(card.star.action).toContain(REDACTED);
    expect(card.star.action).not.toContain('sk-mock');
    expect(card.title).toBe(MOCK_CARD.card.title);
    expect(card.promptVersion).toBe(PROMPT_VERSION);
    expect(store.roadmap(subjectId)!.nodes.map((n) => n.kind)).toEqual([
      'done',
      'locked',
      'locked',
    ]);
  });

  it('returns no_learning and saves no card', async () => {
    const id = conversation([[`${TRIGGERS.noLearning} 안녕`, '안녕하세요']]);
    const events: CardEvent[] = [];
    expect(await service().generate(id, (e) => events.push(e))).toEqual({
      kind: 'no_learning',
    });
    expect(store.cardIdForConversation(id)).toBeNull();
    expect(
      events,
      'no progress for a conversation with nothing learned',
    ).toEqual([]);
  });

  it('sends title, summary and interview_line as progress before the card is done', async () => {
    const id = conversation([['LEFT JOIN이 헷갈려요', '설명']]);
    mock.pace.holdMs = 300;
    let done = false;
    const events: Array<CardEvent & { done: boolean }> = [];
    const result = await service()
      .generate(id, (e) => events.push({ ...e, done }))
      .finally(() => (done = true));

    const { card } = MOCK_CARD;
    expect(events).toEqual([
      {
        conversationId: id,
        type: 'progress',
        field: 'title',
        text: card.title,
        done: false,
      },
      {
        conversationId: id,
        type: 'progress',
        field: 'summary',
        text: card.summary,
        done: false,
      },
      {
        conversationId: id,
        type: 'progress',
        field: 'interview_line',
        text: card.interview_line,
        done: false,
      },
    ]);
    const saved = store.getCard(result.kind === 'card' ? result.cardId : '')!;
    expect(events.map((e) => e.text)).toEqual([
      saved.title,
      saved.summary,
      saved.interview_line,
    ]);
  });

  it('trims and redacts progress text the way the saved card is', async () => {
    const id = conversation([['키를 넣었어요', '지우세요']]);
    const secret = `sk-${'a1'.repeat(12)}`;
    const leaky = JSON.stringify({
      has_learning: true,
      card: { ...MOCK_CARD.card, title: `  ${secret} 키를 지웠다 ` },
    });
    const events: CardEvent[] = [];
    const result = await service(
      scripted(() => answer(leaky)).fetchImpl,
    ).generate(id, (e) => events.push(e));
    const saved = store.getCard(result.kind === 'card' ? result.cardId : '')!;
    expect(events[0]).toMatchObject({
      field: 'title',
      text: `${REDACTED} 키를 지웠다`,
    });
    expect(events[0].text).toBe(saved.title);
  });

  it('retries once when the output breaks the schema, then reports invalid', async () => {
    const id = conversation([['질문', '답']]);
    const good = JSON.stringify(MOCK_CARD);
    const once = scripted((n) => answer(n === 1 ? '{"has_learning":' : good));
    expect(await service(once.fetchImpl).generate(id)).toMatchObject({
      kind: 'card',
    });
    expect(once.bodies).toHaveLength(2);

    const id2 = conversation([['질문 2', '답 2']]);
    const tooLongTitle = JSON.stringify({
      has_learning: true,
      card: { ...MOCK_CARD.card, title: '가'.repeat(61) },
    });
    const twice = scripted(() => answer(tooLongTitle));
    expect(await service(twice.fetchImpl).generate(id2)).toEqual({
      kind: 'invalid',
    });
    expect(twice.bodies).toHaveLength(2);
    expect(store.cardIdForConversation(id2)).toBeNull();
  });

  it('drops the oldest turns while the context overflows, then gives up as too_long', async () => {
    const id = conversation([
      ['1번', 'a'],
      ['2번', 'b'],
      ['3번', 'c'],
      ['4번', 'd'],
    ]);
    const fits = scripted((n) =>
      n < 3 ? overflow() : answer(JSON.stringify(MOCK_CARD)),
    );
    expect(await service(fits.fetchImpl).generate(id)).toMatchObject({
      kind: 'card',
    });
    expect(fits.bodies.map(users)).toEqual([
      ['1번', '2번', '3번', '4번'],
      ['2번', '3번', '4번'],
      ['4번'],
    ]);

    const never = scripted(() => overflow());
    const id2 = conversation([
      ['가', 'a'],
      ['나', 'b'],
    ]);
    expect(await service(never.fetchImpl).generate(id2)).toEqual({
      kind: 'too_long',
    });
    expect(never.bodies.map(users)).toEqual([['가', '나'], ['나']]);
  });

  it('stops on cancel or timeout and saves nothing', async () => {
    const id = conversation([['질문', '답']]);
    mock.pace.holdMs = 2_000;
    const cards = service();
    const pending = cards.generate(id);
    await expect.poll(() => mock.requests.length).toBe(1);
    cards.cancel(id);
    await expect(pending).rejects.toMatchObject({ code: 'cancelled' });

    await expect(service(fetch, 100).generate(id)).rejects.toMatchObject({
      code: 'timeout',
    });
    expect(store.cardIdForConversation(id)).toBeNull();
  });

  it('drops reasoning at once when the plan token refuses it, and remembers that', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const good = answer(JSON.stringify(MOCK_CARD));
    const first = scripted((n) =>
      n === 1 ? refused('reasoning.effort') : good,
    );
    expect(
      await service(first.fetchImpl).generate(conversation([['질문', '답']])),
    ).toMatchObject({ kind: 'card' });
    expect(first.bodies.map((b) => b.reasoning)).toEqual([
      { effort: 'low' },
      undefined,
    ]);
    expect(first.bodies[1]).not.toHaveProperty('reasoning');
    expect(first.bodies[1].input).toEqual(first.bodies[0].input);
    expect(store.getSetting('card_reasoning')).toBe('off');

    const later = scripted(() => answer(JSON.stringify(MOCK_CARD)));
    await service(later.fetchImpl).generate(conversation([['질문 2', '답 2']]));
    expect(later.bodies, 'no second refusal').toHaveLength(1);
    expect(later.bodies[0]).not.toHaveProperty('reasoning');
    expect(
      warn.mock.calls
        .map((args) =>
          String(args[0]).match(/^\[cards\] (\S+) .*reasoning=(\S+)/),
        )
        .filter(Boolean)
        .map((m) => [m![1], m![2]]),
    ).toEqual([
      ['unsupported', 'low'],
      ['ok', 'off'],
      ['ok', 'off'],
    ]);
  });

  it('does not resend when the refusal names something other than reasoning', async () => {
    const other = scripted(() => refused('text.format'));
    await expect(
      service(other.fetchImpl).generate(conversation([['질문', '답']])),
    ).rejects.toMatchObject({ code: 'unsupported' });
    expect(other.bodies).toHaveLength(1);
    expect(store.getSetting('card_reasoning')).toBeNull();
  });

  it('logs the timings, bytes and model of each request but no card or conversation text', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logged = () =>
      warn.mock.calls
        .map((args) => args.join(' '))
        .filter((line) => line.startsWith('[cards]'));
    const id = conversation([['LEFT JOIN이 헷갈려요', 'NULL로 채워져요']]);
    await service().generate(id);

    expect(logged()).toEqual([
      expect.stringMatching(
        /^\[cards\] ok model=gpt-mock reasoning=low first_event=\d+ms first_delta=\d+ms completed=\d+ms parsed=\d+ms bytes=\d+$/,
      ),
    ]);
    expect(Number(logged()[0].match(/bytes=(\d+)/)![1])).toBeGreaterThan(
      JSON.stringify(MOCK_CARD).length,
    );
    const { card } = MOCK_CARD;
    for (const content of [
      card.title,
      card.summary,
      card.interview_line,
      'LEFT JOIN',
      'NULL로',
      'SQLD',
      'sk-mock',
    ])
      expect(logged()[0]).not.toContain(content);

    warn.mockClear();
    const overflowing = scripted((n) =>
      n === 1 ? overflow() : answer('{"has_learning":'),
    );
    await service(overflowing.fetchImpl).generate(
      conversation([
        ['1번', 'a'],
        ['2번', 'b'],
      ]),
    );
    expect(logged().map((line) => line.split(' ').slice(0, 2))).toEqual([
      ['[cards]', 'context_too_long'],
      ['[cards]', 'invalid'],
      ['[cards]', 'invalid'],
    ]);
    expect(logged()[0]).toContain('first_event=- first_delta=-');
    expect(logged()[1]).toMatch(/completed=\d+ms parsed=- /);
  });

  it('refuses a conversation that is streaming, generating, or unknown', async () => {
    const id = conversation([['질문', '답']]);
    streams.start(id, randomUUID());
    await expect(service().generate(id)).rejects.toMatchObject({
      code: 'busy',
    });

    const id2 = conversation([['질문', '답']]);
    mock.pace.holdMs = 300;
    const cards = service();
    const first = cards.generate(id2);
    await expect(cards.generate(id2)).rejects.toMatchObject({ code: 'busy' });
    await first;

    await expect(service().generate(randomUUID())).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});
