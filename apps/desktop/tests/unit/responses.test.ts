import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_BODY_KEYS,
  ResponsesError,
  buildInput,
  buildRequestBody,
  runTurn,
  streamResponse,
  tagModel,
  type ResponsesEvent,
  type Transport,
} from '../../src/main/responses';

const row = (seq: number, item: object) => ({
  seq,
  type: (item as { type: string }).type,
  item_json: JSON.stringify(item),
});

describe('buildInput', () => {
  it('orders by seq, drops ids and status, skips reasoning without encrypted content, appends the user turn', () => {
    const input = buildInput(
      [
        row(2, {
          id: 'msg_2',
          type: 'message',
          role: 'assistant',
          status: 'completed',
          content: [{ type: 'output_text', text: 'B' }],
        }),
        row(1, {
          id: 'msg_1',
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: 'A' }],
        }),
        row(3, { id: 'rs_1', type: 'reasoning', summary: [], x_model: 'm' }),
        row(4, {
          id: 'rs_2',
          type: 'reasoning',
          summary: [],
          encrypted_content: 'enc',
          x_model: 'm',
        }),
      ],
      'C',
      'm',
    );
    expect(input.map((i) => i.type)).toEqual([
      'message',
      'message',
      'reasoning',
      'message',
    ]);
    expect(input.every((i) => !('id' in i) && !('status' in i))).toBe(true);
    expect(input[2]).toEqual({
      type: 'reasoning',
      summary: [],
      encrypted_content: 'enc',
    });
    expect(input[3]).toEqual({
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: 'C' }],
    });
  });

  it('sends reasoning only to the model that wrote it', () => {
    const rows = [
      row(1, tagModel({ type: 'reasoning', encrypted_content: 'a' }, 'm1')),
      row(2, tagModel({ type: 'reasoning', encrypted_content: 'b' }, 'm2')),
      row(3, { type: 'reasoning', encrypted_content: 'untagged' }),
      row(
        4,
        tagModel({ type: 'function_call', call_id: 'c', name: 'f' }, 'm1'),
      ),
    ];
    expect(buildInput(rows, undefined, 'm2')).toEqual([
      { type: 'reasoning', encrypted_content: 'b' },
      { type: 'function_call', call_id: 'c', name: 'f' },
    ]);
    expect(buildInput(rows).map((i) => i.type)).toEqual(['function_call']);
  });
});

describe('buildRequestBody', () => {
  it('always sets store:false and stream:true and never forbidden keys', () => {
    const body = buildRequestBody({
      model: 'm',
      input: [],
      includeReasoning: true,
    });
    expect(body.store).toBe(false);
    expect(body.stream).toBe(true);
    expect(body.include).toEqual(['reasoning.encrypted_content']);
    for (const key of FORBIDDEN_BODY_KEYS) expect(key in body).toBe(false);
  });

  it('adds tools only when there are some', () => {
    expect(buildRequestBody({ model: 'm', input: [] })).not.toHaveProperty(
      'tools',
    );
    expect(
      buildRequestBody({ model: 'm', input: [], tools: [{ type: 'x' }] }).tools,
    ).toEqual([{ type: 'x' }]);
  });
});

async function* events(list: ResponsesEvent[]) {
  yield* list;
}

describe('runTurn', () => {
  it('collects deltas and output items until completed', async () => {
    const deltas: string[] = [];
    const result = await runTurn(
      events([
        { type: 'response.output_text.delta', delta: '안' },
        { type: 'response.output_text.delta', delta: '녕' },
        {
          type: 'response.output_item.done',
          item: { type: 'message', role: 'assistant', content: [] },
        },
        { type: 'response.completed', response: {} },
      ]),
      (d) => deltas.push(d),
    );
    expect(deltas.join('')).toBe('안녕');
    expect(result.outputItems).toHaveLength(1);
  });

  it('maps failed, incomplete and a truncated stream to error codes', async () => {
    const code = async (list: ResponsesEvent[]) =>
      runTurn(events(list), () => {}).catch((e: ResponsesError) => e.code);
    expect(
      await code([
        {
          type: 'response.failed',
          response: { error: { code: 'context_length_exceeded' } },
        },
      ]),
    ).toBe('context_too_long');
    expect(await code([{ type: 'response.incomplete', response: {} }])).toBe(
      'incomplete',
    );
    expect(
      await code([{ type: 'response.output_text.delta', delta: 'x' }]),
    ).toBe('network');
  });
});

describe('streamResponse', () => {
  const transport = (onUnauthorized: () => Promise<boolean>): Transport => ({
    baseUrl: 'http://mock/v1',
    headers: async () => ({ authorization: 'Bearer t' }),
    onUnauthorized,
    planLabel: 'chatgpt-plan',
  });
  const sse = (body: string, status = 200) =>
    new Response(status === 200 ? new Blob([body]).stream() : body, { status });

  it('retries once after a refresh on 401', async () => {
    let calls = 0;
    const fetchImpl = async () =>
      ++calls === 1
        ? sse('', 401)
        : sse('data: {"type":"response.completed"}\n\n');
    const out = [];
    for await (const ev of streamResponse(
      transport(async () => true),
      buildRequestBody({ model: 'm', input: [] }),
      new AbortController().signal,
      fetchImpl,
    ))
      out.push(ev);
    expect(calls).toBe(2);
    expect(out).toEqual([{ type: 'response.completed' }]);
  });

  it('maps HTTP status to codes', async () => {
    const code = async (status: number, text = '') => {
      const gen = streamResponse(
        transport(async () => false),
        buildRequestBody({ model: 'm', input: [] }),
        new AbortController().signal,
        async () => sse(text, status),
      );
      return gen.next().catch((e: ResponsesError) => e.code);
    };
    expect(await code(401)).toBe('unauthorized');
    expect(await code(429)).toBe('rate_limited');
    expect(
      await code(400, '{"error":{"code":"context_length_exceeded"}}'),
    ).toBe('context_too_long');
    expect(
      await code(
        403,
        '{"error":{"code":"subscription_sharing_user_not_eligible"}}',
      ),
    ).toBe('not_eligible_plan');
  });

  it('keeps the param of a refused capability, before and during the stream', async () => {
    const refused =
      '{"error":{"code":"subscription_sharing_unsupported_capability","param":"tools[0]"}}';
    const gen = streamResponse(
      transport(async () => false),
      buildRequestBody({ model: 'm', input: [] }),
      new AbortController().signal,
      async () => sse(refused, 400),
    );
    expect(await gen.next().catch((e: ResponsesError) => e)).toMatchObject({
      code: 'unsupported',
      param: 'tools[0]',
    });
    expect(
      await runTurn(
        events([
          {
            type: 'response.failed',
            response: {
              error: {
                code: 'subscription_sharing_unsupported_capability',
                param: 'reasoning',
              },
            },
          },
        ]),
        () => {},
      ).catch((e: ResponsesError) => e),
    ).toMatchObject({ code: 'unsupported', param: 'reasoning' });
  });

  it('reports network failure and cancellation', async () => {
    const ctl = new AbortController();
    const failing = async () => {
      throw new TypeError('fetch failed');
    };
    const gen = streamResponse(
      transport(async () => false),
      buildRequestBody({ model: 'm', input: [] }),
      ctl.signal,
      failing,
    );
    expect(await gen.next().catch((e: ResponsesError) => e.code)).toBe(
      'network',
    );
    ctl.abort();
    const gen2 = streamResponse(
      transport(async () => false),
      buildRequestBody({ model: 'm', input: [] }),
      ctl.signal,
      failing,
    );
    expect(await gen2.next().catch((e: ResponsesError) => e.code)).toBe(
      'cancelled',
    );
  });
});
