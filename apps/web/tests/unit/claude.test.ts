import { afterEach, describe, expect, it } from 'vitest';
import { adapterMode, generateNotesFromCapture, getAdapter } from '@/lib/claude';
import { alternate, createAnthropicAdapter } from '@/lib/claude/anthropic';
import { MOCK_NOTES, createMockAdapter } from '@/lib/claude/mock';
import { normalizeResult } from '@/lib/claude/normalize';
import { AdapterError, MAX_NOTES, type CaptureInput } from '@/lib/claude/types';

const image: CaptureInput = {
  data: new Uint8Array([1, 2, 3]),
  mediaType: 'image/png',
  width: 640,
  height: 400,
};

const block = (text: string, extra: Record<string, unknown> = {}) => ({
  text,
  kind: 'concept',
  source_region: 'top',
  confidence: 0.9,
  raw_excerpt: null,
  ...extra,
});

const ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ENV };
});

describe('normalizeResult', () => {
  it('keeps at most eight notes', () => {
    const out = normalizeResult({
      notes: Array.from({ length: 11 }, (_, i) => block(`필기 ${i}`)),
      reason: null,
      redacted: 0,
    });
    expect(out.notes).toHaveLength(MAX_NOTES);
  });

  it('gives an empty result a reason', () => {
    const out = normalizeResult({ notes: [], reason: null, redacted: 0 });
    expect(out.notes).toHaveLength(0);
    expect(out.reason).toBeTruthy();
  });

  it('clamps confidence and drops blank notes', () => {
    const out = normalizeResult({
      notes: [block('높음', { confidence: 3 }), block('낮음', { confidence: -1 }), block('   ')],
      reason: null,
      redacted: 0,
    });
    expect(out.notes.map((n) => n.confidence)).toEqual([1, 0]);
  });

  it('rejects an unknown kind', () => {
    expect(() =>
      normalizeResult({ notes: [block('x', { kind: 'essay' })], reason: null, redacted: 0 }),
    ).toThrow();
  });

  it('masks secrets the model missed and counts them', () => {
    // built at run time so no token-shaped string sits in the repository
    const key = ['s', 'k', '-'].join('') + 'a'.repeat(24);
    const out = normalizeResult({
      notes: [block(`키는 ${key} 이다`, { raw_excerpt: `API_KEY=${key}` })],
      reason: null,
      redacted: 1,
    });
    expect(out.notes[0].text).toContain('[redacted]');
    expect(out.notes[0].text).not.toContain(key);
    expect(out.notes[0].raw_excerpt).not.toContain(key);
    expect(out.redacted).toBe(3);
  });
});

describe('adapter choice', () => {
  it('uses the mock when nothing is set', () => {
    delete process.env.CLAUDE_ADAPTER;
    delete process.env.ANTHROPIC_API_KEY;
    expect(adapterMode()).toBe('mock');
    expect(getAdapter().name).toBe('mock');
  });

  it('stays on the mock when the switch is on but there is no key', () => {
    process.env.CLAUDE_ADAPTER = 'anthropic';
    delete process.env.ANTHROPIC_API_KEY;
    expect(adapterMode()).toBe('mock');
  });

  it('uses Claude only with both the switch and a key', () => {
    process.env.CLAUDE_ADAPTER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = 'test-key-not-real';
    delete process.env.CLAUDE_MODEL;
    const adapter = getAdapter();
    expect(adapter.name).toBe('anthropic');
    expect(adapter.model).toBe('claude-opus-5-5');
    process.env.CLAUDE_MODEL = 'claude-sonnet-5-5';
    expect(getAdapter().model).toBe('claude-sonnet-5-5');
  });
});

describe('mock adapter', () => {
  it('returns the demo notes in the shared shape', async () => {
    const out = await generateNotesFromCapture(image, { adapter: createMockAdapter({ delayMs: 0 }) });
    expect(out.adapter).toBe('mock');
    expect(out.notes).toHaveLength(MOCK_NOTES.notes.length);
    expect(out.notes[0].text).toContain('[데모 필기]');
  });

  it('fails on request', async () => {
    await expect(
      createMockAdapter({ delayMs: 0, scenario: 'fail' }).generateNotesFromCapture(image),
    ).rejects.toBeInstanceOf(AdapterError);
  });

  it('finds nothing in a tiny image', async () => {
    const out = await generateNotesFromCapture(
      { ...image, width: 24, height: 24 },
      { adapter: createMockAdapter({ delayMs: 0 }) },
    );
    expect(out.notes).toHaveLength(0);
    expect(out.reason).toBeTruthy();
  });

  it('streams a chat answer that names itself a demo', async () => {
    let text = '';
    for await (const part of createMockAdapter({ delayMs: 0 }).streamChat([
      { role: 'user', content: '정규화가 뭐야?' },
    ]))
      text += part;
    expect(text).toContain('데모 응답');
    expect(text).toContain('정규화가 뭐야?');
  });
});

describe('anthropic adapter (no network)', () => {
  const answer = {
    notes: [block('조인은 두 테이블을 키로 잇는다.')],
    reason: null,
    redacted: 0,
  };

  function fakeFetch(seen: Array<{ url: string; body: Record<string, unknown>; headers: Headers }>) {
    return (async (url: string | URL | Request, init?: RequestInit) => {
      seen.push({
        url: String(url),
        body: JSON.parse(String(init?.body)),
        headers: new Headers(init?.headers),
      });
      return new Response(
        JSON.stringify({
          id: 'msg_test',
          type: 'message',
          role: 'assistant',
          model: 'claude-opus-5-5',
          content: [{ type: 'text', text: JSON.stringify(answer) }],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 10 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;
  }

  it('sends the image with structured output and reads the notes back', async () => {
    const seen: Array<{ url: string; body: Record<string, unknown>; headers: Headers }> = [];
    const adapter = createAnthropicAdapter({
      apiKey: 'test-key-not-real',
      model: 'claude-opus-5-5',
      fetch: fakeFetch(seen),
    });
    const out = await adapter.generateNotesFromCapture({ ...image, topic: '데이터베이스' });
    expect(out.notes[0].text).toBe('조인은 두 테이블을 키로 잇는다.');
    const req = seen[0];
    expect(req.url).toContain('/v1/messages');
    expect(req.body.model).toBe('claude-opus-5-5');
    const content = (req.body.messages as Array<{ content: Array<Record<string, unknown>> }>)[0].content;
    expect(content[0]).toMatchObject({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: 'AQID' },
    });
    expect(String(content[1].text)).toContain('데이터베이스');
    expect((req.body.output_config as { format: { type: string } }).format.type).toBe('json_schema');
    expect(req.body.fallbacks).toBe('default');
    expect(req.headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01');
    expect(String(req.body.system)).toContain('사실만 쓴다');
  });

  it('leaves out the fallback on models that do not take it', async () => {
    const seen: Array<{ url: string; body: Record<string, unknown>; headers: Headers }> = [];
    const adapter = createAnthropicAdapter({
      apiKey: 'test-key-not-real',
      model: 'claude-sonnet-4-5',
      fetch: fakeFetch(seen),
    });
    await adapter.generateNotesFromCapture(image);
    expect(seen[0].body.fallbacks).toBeUndefined();
  });
});

describe('alternate', () => {
  it('starts with the user and joins turns of the same side', () => {
    expect(
      alternate([
        { role: 'assistant', content: '인사' },
        { role: 'user', content: 'a' },
        { role: 'user', content: 'b' },
        { role: 'assistant', content: 'c' },
      ]),
    ).toEqual([
      { role: 'user', content: 'a\n\nb' },
      { role: 'assistant', content: 'c' },
    ]);
  });
});
