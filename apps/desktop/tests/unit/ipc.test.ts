import type { IpcMainInvokeEvent } from 'electron';
import { describe, expect, it } from 'vitest';
import { IpcError, StreamRegistry, guard } from '../../src/main/ipc';

const event = {} as IpcMainInvokeEvent;
const uuid = '3f2b8a1e-9c4d-4e7a-8b1f-2d3c4e5f6a7b';

describe('guard', () => {
  it('refuses an untrusted sender before parsing', async () => {
    let ran = false;
    const h = guard(
      'subjects:list',
      () => false,
      () => (ran = true),
    );
    expect(await h(event, undefined)).toEqual({ ok: false, code: 'forbidden' });
    expect(ran).toBe(false);
  });

  it('refuses a payload that fails the schema', async () => {
    const h = guard(
      'subjects:create',
      () => true,
      () => 'x',
    );
    expect(await h(event, { title: '' })).toEqual({
      ok: false,
      code: 'invalid_payload',
    });
    expect(await h(event, { title: 'ㄱ'.repeat(41) })).toEqual({
      ok: false,
      code: 'invalid_payload',
    });
    expect(await h(event, { subjectId: 'not-a-uuid' })).toEqual({
      ok: false,
      code: 'invalid_payload',
    });
  });

  it('takes a model name of 1 to 80 characters', async () => {
    const h = guard(
      'conversations:setModel',
      () => true,
      ({ model }) => model,
    );
    expect(await h(event, { id: uuid, model: ' gpt-x ' })).toEqual({
      ok: true,
      data: 'gpt-x',
    });
    for (const model of ['', ' ', 'm'.repeat(81)])
      expect(await h(event, { id: uuid, model })).toMatchObject({
        ok: false,
        code: 'invalid_payload',
      });
  });

  it('passes parsed data and wraps IpcError codes', async () => {
    const ok = guard(
      'subjects:create',
      () => true,
      ({ title }) => title,
    );
    expect(await ok(event, { title: '  SQLD ' })).toEqual({
      ok: true,
      data: 'SQLD',
    });
    const fail = guard(
      'roadmap:get',
      () => true,
      () => {
        throw new IpcError('not_found');
      },
    );
    expect(await fail(event, { subjectId: uuid })).toMatchObject({
      ok: false,
      code: 'not_found',
    });
  });
});

describe('StreamRegistry', () => {
  it('refuses a second stream on the same conversation', () => {
    const r = new StreamRegistry();
    r.start('c1', 's1');
    expect(() => r.start('c1', 's2')).toThrow(IpcError);
    expect(() => r.start('c2', 's3')).not.toThrow();
    r.finish('s1');
    expect(() => r.start('c1', 's4')).not.toThrow();
  });

  it('aborts by stream id and all at once', () => {
    const r = new StreamRegistry();
    const a = r.start('c1', 's1');
    const b = r.start('c2', 's2');
    r.cancel('s1');
    expect(a.signal.aborted).toBe(true);
    expect(b.signal.aborted).toBe(false);
    r.cancelAll();
    expect(b.signal.aborted).toBe(true);
  });
});
