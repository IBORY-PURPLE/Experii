import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Data = Record<string, string | number>;
type Call = [string, Data | undefined];

let win: { umami?: { track: (name: string, data?: Data) => void } };

const load = async () => {
  vi.resetModules();
  return (await import('@/lib/analytics')).track;
};

const umamiLoads = () => {
  const calls: Call[] = [];
  win.umami = { track: (name, data) => void calls.push([name, data]) };
  return calls;
};

beforeEach(() => {
  vi.useFakeTimers();
  win = {};
  vi.stubGlobal('window', win);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('track', () => {
  it('sends right away once the analytics script is there', async () => {
    const track = await load();
    const calls = umamiLoads();
    track('cta_click', { location: 'hero' });
    expect(calls).toEqual([['cta_click', { location: 'hero' }]]);
  });

  it('keeps events made before the script loads and sends them once, in order', async () => {
    const track = await load();
    track('loop_step', { step: 1, topic: 'group' });
    track('cta_click', { location: 'how' });
    await vi.advanceTimersByTimeAsync(1500);
    const calls = umamiLoads();
    await vi.advanceTimersByTimeAsync(1000);
    track('loop_step', { step: 2, topic: 'join' });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toEqual([
      ['loop_step', { step: 1, topic: 'group' }],
      ['cta_click', { location: 'how' }],
      ['loop_step', { step: 2, topic: 'join' }],
    ]);
  });

  it('held events still go first when a new event comes right after the script appears', async () => {
    const track = await load();
    track('loop_step', { step: 1, topic: 'group' });
    const calls = umamiLoads();
    track('loop_step', { step: 2, topic: 'join' });
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toEqual([
      ['loop_step', { step: 1, topic: 'group' }],
      ['loop_step', { step: 2, topic: 'join' }],
    ]);
  });

  it('holds a bounded number of events and keeps the earliest', async () => {
    const track = await load();
    for (let i = 0; i < 1000; i++) track('loop_step', { step: i });
    const calls = umamiLoads();
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.length).toBeLessThan(1000);
    expect(calls[0]).toEqual(['loop_step', { step: 0 }]);
  });

  it('stops waiting when the script never loads (blocked or not configured)', async () => {
    const track = await load();
    track('loop_step', { step: 1 });
    await vi.advanceTimersByTimeAsync(120_000);
    expect(vi.getTimerCount()).toBe(0);
    const calls = umamiLoads();
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toEqual([]);
  });

  it('a throwing tracker does not break the page', async () => {
    const track = await load();
    win.umami = {
      track: () => {
        throw new Error('blocked');
      },
    };
    expect(() => track('form_start')).not.toThrow();
  });

  it('does nothing on the server', async () => {
    vi.unstubAllGlobals();
    const track = await load();
    expect(() => track('form_start')).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});
