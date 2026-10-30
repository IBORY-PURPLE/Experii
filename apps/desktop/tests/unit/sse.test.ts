import { describe, expect, it } from 'vitest';
import { SseParser, parseSse } from '../../src/main/sse';

const enc = new TextEncoder();

describe('SseParser', () => {
  it('parses events and multi-line data', () => {
    const p = new SseParser();
    const out = p.push(
      enc.encode('event: a\ndata: 1\ndata: 2\n\n: comment\ndata: x\n\n'),
    );
    expect(out).toEqual([
      { event: 'a', data: '1\n2' },
      { event: 'message', data: 'x' },
    ]);
  });

  it('handles CRLF split across chunks', () => {
    const p = new SseParser();
    expect(p.push(enc.encode('data: a\r'))).toEqual([]);
    expect(p.push(enc.encode('\n\r\n'))).toEqual([
      { event: 'message', data: 'a' },
    ]);
  });

  it('keeps Hangul intact when a multibyte character is split between chunks', () => {
    const bytes = enc.encode('data: {"delta":"조인"}\n\n');
    const cut = bytes.indexOf(0xec) + 1;
    const p = new SseParser();
    const out = [...p.push(bytes.slice(0, cut)), ...p.push(bytes.slice(cut))];
    expect(out).toEqual([{ event: 'message', data: '{"delta":"조인"}' }]);
  });

  it('flushes a final event without a trailing blank line', async () => {
    async function* body() {
      yield enc.encode('data: last');
    }
    const out = [];
    for await (const m of parseSse(body())) out.push(m);
    expect(out).toEqual([{ event: 'message', data: 'last' }]);
  });
});
