// A stand-in for the Responses API on 127.0.0.1: e2e tests and `npm run dev:mock` point the app at it.
// Messages containing a trigger tag (see TRIGGERS) steer it: errors for the banners, a slow stream, a tool call.
import { randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';

export const MOCK_TOKEN = 'mock-access-token';
export const MOCK_MODEL = 'gpt-mock';
export const MOCK_MODEL_ALT = 'gpt-mock-mini';
export const MOCK_TOOL_QUERY = 'JOIN';

export const TRIGGERS = {
  network: '#네트워크오류',
  tooLong: '#너무김',
  relogin: '#재로그인',
  plan: '#플랜',
  slow: '#느리게',
  noLearning: '#학습없음',
  tool: '#도구',
  toolRefused: '#도구거부',
} as const;

// Chat answers stream one 6-character delta every `delay` ms and card answers every `cardDelay` ms;
// chat and card answers wait `holdMs` before completing.
export type Pace = { delay: number; cardDelay: number; holdMs: number };

export type MockServer = {
  url: string;
  requests: Array<Record<string, unknown>>;
  pace: Pace;
  close(): Promise<void>;
};

type Item = Record<string, unknown> & { type: string };
type Body = Record<string, unknown> & { model?: string; input: Item[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Reasoning is only valid for the model that wrote it, as with the real encrypted_content.
const sealed = (model: string) => `enc:${model}`;

function lastUserText(input: Item[]): string {
  for (let i = input.length - 1; i >= 0; i--) {
    const item = input[i];
    if (item.type === 'message' && item.role === 'user') {
      const content = item.content as Array<{ text?: string }>;
      return content.map((c) => c.text ?? '').join('');
    }
  }
  return '';
}

function chatAnswer(text: string, turn: number): string {
  const topic = text.replace(/#\S+/g, '').trim().slice(0, 40) || '이 주제';
  if (turn === 1) {
    return [
      `좋아요. **${topic}**부터 차근차근 볼게요.`,
      '',
      '### 핵심 정리',
      '1. `INNER JOIN`은 양쪽에 짝이 있는 행만 남겨요.',
      '2. `LEFT JOIN`은 왼쪽 행을 모두 남기고, 짝이 없으면 오른쪽 열을 `NULL`로 채워요.',
      '',
      '```sql',
      'SELECT e.name, d.name',
      'FROM emp e LEFT JOIN dept d ON d.id = e.dept_id;',
      '```',
      '',
      '자세한 설명은 [공식 문서](https://example.com/join)를 참고하세요. 직접 한 번 돌려 보고 결과 행 수를 알려 줄래요?',
    ].join('\n');
  }
  return [
    `확인했어요. 말한 내용(“${topic}”)을 보면 개념을 잘 잡았어요.`,
    '',
    '- 행 수가 늘어난 이유는 오른쪽 테이블에 같은 키가 여러 개 있어서예요.',
    '- 다음에는 `ON`과 `WHERE`에 조건을 둘 때 결과가 어떻게 달라지는지 비교해 보면 좋아요.',
  ].join('\n');
}

function toolAnswer(output: string): string {
  try {
    const { total, cards } = JSON.parse(output) as {
      total: number;
      cards: Array<{ title: string }>;
    };
    return [
      `내 경험 카드에서 ${total}장을 찾았어요.`,
      '',
      ...cards.map((c) => `- ${c.title}`),
    ].join('\n');
  } catch {
    return `도구 결과를 읽지 못했어요: ${output.slice(0, 80)}`;
  }
}

export const MOCK_CARD = {
  has_learning: true,
  card: {
    title: 'LEFT JOIN의 NULL 행을 직접 확인했다',
    summary:
      'INNER JOIN과 LEFT JOIN을 같은 테이블로 돌려 결과 행 수 차이를 비교했다.',
    interview_line:
      '조인 결과가 예상과 달라 작은 테이블로 직접 재현하고 원인을 설명할 수 있게 됐습니다.',
    star: {
      situation: 'SQLD 문제에서 LEFT JOIN 결과 행 수가 헷갈렸다.',
      task: '왜 NULL이 채워진 행이 생기는지 설명할 수 있어야 했다.',
      action:
        'emp와 dept 테이블로 두 조인을 직접 실행해 결과를 비교했다. 테스트 키 sk-mock-1234567890abcdefghij 는 지워야 한다.',
      result: null,
    },
    concepts: ['INNER JOIN', 'LEFT JOIN', 'NULL'],
    next_steps: 'ON 조건과 WHERE 조건을 바꿔 가며 결과 행 수를 비교한다.',
    recommended_next: [
      {
        title: 'ON과 WHERE 조건 차이',
        reason: '대화 끝에서 조건을 어디에 둘지 헷갈린다고 했어요.',
      },
      {
        title: '중복 키와 행 수 증가',
        reason: '오른쪽 테이블의 중복 키 때문에 행이 늘어난 걸 봤어요.',
      },
    ],
  },
};

// Rejects what the real endpoint rejects, so an input the app builds wrongly fails here too.
function invalidInput(body: Body): { code: string; param: string } | null {
  const outputs = new Set(
    body.input
      .filter((i) => i.type === 'function_call_output')
      .map((i) => String(i.call_id)),
  );
  const calls = new Set<string>();
  for (const [i, item] of body.input.entries()) {
    const extra = Object.keys(item).find((k) => k.startsWith('x_'));
    if (extra)
      return { code: 'unknown_parameter', param: `input[${i}].${extra}` };
    if (item.type === 'message' && item.role === 'system')
      return { code: 'invalid_value', param: `input[${i}].role` };
    if (
      item.type === 'reasoning' &&
      item.encrypted_content !== sealed(String(body.model))
    )
      return { code: 'invalid_encrypted_content', param: `input[${i}]` };
    if (item.type === 'function_call') {
      if (!outputs.has(String(item.call_id)))
        return { code: 'invalid_request_error', param: `input[${i}]` };
      calls.add(String(item.call_id));
    }
    if (
      item.type === 'function_call_output' &&
      !calls.has(String(item.call_id))
    )
      return { code: 'invalid_request_error', param: `input[${i}]` };
  }
  return null;
}

type Offered = { name: string; namespace?: string; param: string };

// Tools arrive grouped in a namespace, as an additional_tools input item, or as plain functions.
function offeredTool(body: Body): Offered | null {
  const tools = (Array.isArray(body.tools) ? body.tools : []) as Item[];
  for (const [i, tool] of tools.entries()) {
    if (tool.type === 'namespace') {
      const fn = (tool.tools as Item[] | undefined)?.find(
        (t) => t.type === 'function',
      );
      if (fn)
        return {
          name: String(fn.name),
          namespace: String(tool.name),
          param: `tools[${i}]`,
        };
    }
    if (tool.type === 'function')
      return { name: String(tool.name), param: `tools[${i}]` };
  }
  for (const [i, item] of body.input.entries()) {
    if (item.type !== 'additional_tools') continue;
    const fn = (item.tools as Item[] | undefined)?.find(
      (t) => t.type === 'function',
    );
    if (fn) return { name: String(fn.name), param: `input[${i}]` };
  }
  return null;
}

function outputsSinceLastUser(input: Item[]): string[] {
  const last = input.findLastIndex(
    (i) => i.type === 'message' && i.role === 'user',
  );
  return input
    .slice(last + 1)
    .filter((i) => i.type === 'function_call_output')
    .map((i) => String(i.output));
}

function send(res: ServerResponse, event: Record<string, unknown>) {
  res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

function begin(res: ServerResponse, model: string) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
  });
  const id = `resp_${Date.now()}`;
  send(res, {
    type: 'response.created',
    response: { id, status: 'in_progress' },
  });
  const reasoning = {
    id: `rs_${Date.now()}`,
    type: 'reasoning',
    summary: [],
    encrypted_content: sealed(model),
  };
  send(res, {
    type: 'response.output_item.done',
    output_index: 0,
    item: reasoning,
  });
  return { id, reasoning };
}

function complete(res: ServerResponse, id: string, output: unknown[]) {
  send(res, {
    type: 'response.completed',
    response: { id, status: 'completed', output },
  });
  res.end();
}

async function stream(
  res: ServerResponse,
  text: string,
  opts: { model: string; delay: number; holdMs?: number; cutAfter?: number },
) {
  const { id, reasoning } = begin(res, opts.model);
  const msgId = `msg_${Date.now()}`;
  send(res, {
    type: 'response.output_item.added',
    output_index: 1,
    item: {
      id: msgId,
      type: 'message',
      role: 'assistant',
      status: 'in_progress',
      content: [],
    },
  });
  const chunks = text.match(/[\s\S]{1,6}/g) ?? [];
  for (let i = 0; i < chunks.length; i++) {
    if (opts.cutAfter !== undefined && i >= opts.cutAfter) {
      res.destroy();
      return;
    }
    send(res, {
      type: 'response.output_text.delta',
      item_id: msgId,
      output_index: 1,
      content_index: 0,
      delta: chunks[i],
    });
    if (opts.delay) await sleep(opts.delay);
    if (res.destroyed) return;
  }
  if (opts.holdMs) await sleep(opts.holdMs);
  if (res.destroyed) return;
  const item = {
    id: msgId,
    type: 'message',
    role: 'assistant',
    status: 'completed',
    content: [{ type: 'output_text', text, annotations: [] }],
  };
  send(res, {
    type: 'response.output_text.done',
    item_id: msgId,
    output_index: 1,
    content_index: 0,
    text,
  });
  send(res, { type: 'response.output_item.done', output_index: 1, item });
  complete(res, id, [reasoning, item]);
}

function callTool(res: ServerResponse, model: string, tool: Offered) {
  const { id, reasoning } = begin(res, model);
  const args = JSON.stringify({ query: MOCK_TOOL_QUERY });
  const item = {
    id: `fc_${Date.now()}`,
    type: 'function_call',
    call_id: `call_${randomUUID().slice(0, 8)}`,
    name: tool.name,
    ...(tool.namespace ? { namespace: tool.namespace } : {}),
    arguments: '',
  };
  send(res, {
    type: 'response.output_item.added',
    output_index: 1,
    item: { ...item, status: 'in_progress' },
  });
  for (const delta of [args.slice(0, 9), args.slice(9)])
    send(res, {
      type: 'response.function_call_arguments.delta',
      item_id: item.id,
      output_index: 1,
      delta,
    });
  send(res, {
    type: 'response.function_call_arguments.done',
    item_id: item.id,
    output_index: 1,
    arguments: args,
  });
  const done = { ...item, status: 'completed', arguments: args };
  send(res, { type: 'response.output_item.done', output_index: 1, item: done });
  complete(res, id, [reasoning, done]);
}

function json(res: ServerResponse, status: number, body: unknown) {
  res
    .writeHead(status, { 'content-type': 'application/json' })
    .end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

export async function startMockOpenAI(
  opts: { port?: number; delay?: number; cardDelay?: number } = {},
): Promise<MockServer> {
  const requests: Array<Record<string, unknown>> = [];
  const pace: Pace = {
    delay: opts.delay ?? 15,
    cardDelay: opts.cardDelay ?? 0,
    holdMs: 0,
  };
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (req.headers.authorization !== `Bearer ${MOCK_TOKEN}`) {
      json(res, 401, { error: { code: 'invalid_token' } });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/v1/models') {
      json(res, 200, {
        models: [
          { slug: 'hidden-model', display_name: 'Hidden', visibility: 'hide' },
          { slug: MOCK_MODEL, display_name: 'Mock', visibility: 'list' },
          {
            slug: MOCK_MODEL_ALT,
            display_name: 'Mock mini',
            visibility: 'list',
          },
        ],
      });
      return;
    }
    if (req.method !== 'POST' || url.pathname !== '/v1/responses') {
      json(res, 404, { error: { code: 'not_found' } });
      return;
    }
    const body = JSON.parse(await readBody(req)) as Body;
    requests.push(body);
    body.input ??= [];
    const model = String(body.model);
    const invalid = invalidInput(body);
    if (invalid) {
      json(res, 400, { error: { ...invalid, message: 'Invalid input.' } });
      return;
    }
    const input = body.input;
    const isCard =
      (body.text as { format?: { name?: string } } | undefined)?.format
        ?.name === 'experience_card';
    const userText = lastUserText(input);
    const all = input.map((i) => JSON.stringify(i)).join('\n');

    if (isCard) {
      const out = all.includes(TRIGGERS.noLearning)
        ? { has_learning: false, card: null }
        : MOCK_CARD;
      await stream(res, JSON.stringify(out), {
        model,
        delay: pace.cardDelay,
        holdMs: pace.holdMs,
      });
      return;
    }
    if (userText.includes(TRIGGERS.tooLong)) {
      json(res, 400, {
        error: {
          code: 'context_length_exceeded',
          message: 'Your input exceeds the context window.',
        },
      });
      return;
    }
    if (userText.includes(TRIGGERS.relogin)) {
      json(res, 401, { error: { code: 'invalid_token' } });
      return;
    }
    if (userText.includes(TRIGGERS.plan)) {
      json(res, 403, {
        error: { code: 'subscription_sharing_user_not_eligible' },
      });
      return;
    }
    const tool = offeredTool(body);
    if (tool && userText.includes(TRIGGERS.toolRefused)) {
      json(res, 400, {
        error: {
          code: 'subscription_sharing_unsupported_capability',
          message: 'This capability is not available with a plan token.',
          param: tool.param,
        },
      });
      return;
    }
    if (tool && userText.includes(TRIGGERS.tool)) {
      const outputs = outputsSinceLastUser(input);
      if (outputs.length === 0) callTool(res, model, tool);
      else
        await stream(res, toolAnswer(outputs[0]), {
          model,
          delay: pace.delay,
          holdMs: pace.holdMs,
        });
      return;
    }
    const turn = input.filter(
      (i) => i.type === 'message' && i.role === 'user',
    ).length;
    const answer = chatAnswer(userText, turn);
    if (userText.includes(TRIGGERS.network)) {
      await stream(res, answer, { model, delay: 30, cutAfter: 4 });
      return;
    }
    const slow = userText.includes(TRIGGERS.slow);
    await stream(res, answer, {
      model,
      delay: slow ? 250 : pace.delay,
      holdMs: pace.holdMs,
    });
  });
  await new Promise<void>((resolve) =>
    server.listen(opts.port ?? 0, '127.0.0.1', resolve),
  );
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/v1`,
    requests,
    pace,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
