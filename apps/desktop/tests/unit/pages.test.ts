import { describe, expect, it } from 'vitest';
import {
  COLUMN_LEFT,
  COLUMN_TOP,
  columnSpot,
  toWorld,
  zoomAt,
  MAX_ZOOM,
  MIN_ZOOM,
} from '../../src/renderer/canvas';
import { questionNumbers, readDrop } from '../../src/renderer/collect';
import { consultDraft } from '../../src/renderer/NotePage';
import {
  MAX_TABS,
  activePlace,
  canBack,
  canForward,
  closeTab,
  keepOnly,
  readSaved,
  startPages,
  step,
  visit,
  type Pages,
} from '../../src/renderer/pages';
import type { LockedNode, Note } from '../../src/shared/ipc';

const page = (id: string) => ({ kind: 'page' as const, id });
const roadmap = { kind: 'roadmap' as const };
const where = (s: Pages) => {
  const p = activePlace(s);
  return p.kind === 'page' ? p.id : 'roadmap';
};

describe('tabs and history', () => {
  it('starts on the roadmap with the tabs from before, once each', () => {
    const s = startPages(['a', 'b', 'a']);
    expect(s.tabs).toEqual(['a', 'b']);
    expect(where(s)).toBe('roadmap');
    expect(canBack(s) || canForward(s)).toBe(false);
  });

  it('opens a tab right after the one in front and does not stack the same place twice', () => {
    let s = visit(startPages(['x']), page('a'));
    expect(s.tabs).toEqual(['a', 'x']);
    s = visit(s, page('b'));
    expect(s.tabs).toEqual(['a', 'b', 'x']);
    s = visit(s, page('b'));
    expect(s.history.map((p) => (p.kind === 'page' ? p.id : 'r'))).toEqual([
      'r',
      'a',
      'b',
    ]);
  });

  it('goes back and forward, reopening a closed tab, and drops the forward history on a new visit', () => {
    let s = visit(visit(startPages(), page('a')), page('b'));
    s = step(s, -1);
    expect(where(s)).toBe('a');
    expect(canForward(s)).toBe(true);
    s = closeTab(s, 'b');
    s = step(s, 1);
    expect(where(s)).toBe('b');
    expect(s.tabs).toContain('b');
    s = step(step(s, -1), -1);
    expect(where(s)).toBe('roadmap');
    expect(step(s, -1)).toBe(s);
    s = visit(s, page('c'));
    expect(canForward(s)).toBe(false);
    expect(s.history).toEqual([roadmap, page('c')]);
  });

  it('shows the right neighbour of a closed tab, else the left one, else the roadmap', () => {
    let s = visit(visit(visit(startPages(), page('a')), page('b')), page('c'));
    expect(s.tabs).toEqual(['a', 'b', 'c']);
    s = visit(s, page('b'));
    s = closeTab(s, 'b');
    expect(where(s)).toBe('c');
    s = closeTab(s, 'c');
    expect(where(s)).toBe('a');
    s = closeTab(s, 'a');
    expect(where(s)).toBe('roadmap');
    expect(s.tabs).toEqual([]);
  });

  it('closing a tab behind leaves the one in front alone', () => {
    let s = visit(visit(startPages(), page('a')), page('b'));
    s = closeTab(s, 'a');
    expect(where(s)).toBe('b');
    expect(s.tabs).toEqual(['b']);
  });

  it(`keeps ${MAX_TABS} tabs, closing the one not seen for longest`, () => {
    let s = startPages();
    for (const id of 'abcdefgh') s = visit(s, page(id));
    s = visit(s, page('a'));
    s = visit(s, page('i'));
    expect(s.tabs).toHaveLength(MAX_TABS);
    expect(s.tabs).not.toContain('b');
    expect(s.tabs).toContain('a');
    expect(where(s)).toBe('i');
  });

  it('keeps fifty steps of history', () => {
    let s = startPages();
    for (let i = 0; i < 60; i++) s = visit(s, page(`p${i % 2}`));
    expect(s.history).toHaveLength(50);
    expect(s.at).toBe(49);
  });

  it('forgets pages whose conversation is gone', () => {
    let s = visit(
      visit(visit(startPages(['gone']), page('a')), page('gone')),
      page('b'),
    );
    s = step(s, -1);
    const kept = keepOnly(s, new Set(['a', 'b']));
    expect(kept.tabs).toEqual(['a', 'b']);
    expect(kept.history).toEqual([roadmap, page('a'), page('b')]);
    expect(where(kept)).toBe('a');
    expect(keepOnly(kept, new Set(['a', 'b']))).toBe(kept);
  });

  it('reads saved tabs and views, skipping what does not fit', () => {
    expect(readSaved('{nope')).toEqual({ tabs: {}, views: {} });
    expect(readSaved(null)).toEqual({ tabs: {}, views: {} });
    expect(
      readSaved(
        JSON.stringify({
          tabs: { s: ['a', 3, 'b'], t: 'x' },
          views: {
            a: { x: 10, y: -5, z: 1.5 },
            b: { x: 1, y: 2, z: 0 },
            c: { x: 'n', y: 0, z: 1 },
          },
        }),
      ),
    ).toEqual({
      tabs: { s: ['a', 'b'] },
      views: { a: { x: 10, y: -5, z: 1.5 } },
    });
  });
});

describe('canvas geometry', () => {
  it('maps the canvas to the page and zooms around the pointer', () => {
    const v = { x: 100, y: 50, z: 2 };
    expect(toWorld(v, { x: 300, y: 250 })).toEqual({ x: 100, y: 100 });
    const zoomed = zoomAt(v, { x: 300, y: 250 }, 0.5);
    expect(zoomed.z).toBe(1);
    expect(toWorld(zoomed, { x: 300, y: 250 })).toEqual({ x: 100, y: 100 });
    expect(zoomAt(v, { x: 0, y: 0 }, 100).z).toBe(MAX_ZOOM);
    expect(zoomAt(v, { x: 0, y: 0 }, 0.001).z).toBe(MIN_ZOOM);
  });

  it('lines notes up by question, each under the last one in its column', () => {
    expect(columnSpot(1, [])).toEqual({ x: COLUMN_LEFT, y: COLUMN_TOP });
    expect(columnSpot(3, [])).toEqual({
      x: COLUMN_LEFT + 2 * 288,
      y: COLUMN_TOP,
    });
    const notes = [
      { x: COLUMN_LEFT, y: COLUMN_TOP, h: 100 },
      { x: COLUMN_LEFT + 30, y: 300, h: 80.4 },
      { x: COLUMN_LEFT + 288, y: 500, h: 100 },
      { x: 0, y: 900, h: 100 },
    ];
    expect(columnSpot(1, notes)).toEqual({ x: COLUMN_LEFT, y: 396 });
    expect(columnSpot(2, notes)).toEqual({ x: COLUMN_LEFT + 288, y: 616 });
    expect(columnSpot(0, notes), 'a question number below 1 is Q1').toEqual(
      columnSpot(1, notes),
    );
  });
});

describe('picked words', () => {
  it('numbers each answer by the questions before it, tool rounds included', () => {
    const m = (role: 'user' | 'assistant') => ({ role, text: '' });
    expect(
      questionNumbers([
        m('user'),
        m('assistant'),
        m('assistant'),
        m('user'),
        m('assistant'),
      ]),
    ).toEqual([1, 1, 1, 2, 2]);
  });

  it('reads only a whole note payload from a drop', () => {
    const data = (value: string) =>
      ({ getData: () => value }) as unknown as DataTransfer;
    const pick = { conversationId: 'c', seq: 4, q: 2, text: '글' };
    expect(readDrop(data(JSON.stringify(pick)))).toEqual(pick);
    for (const bad of [
      '',
      '{',
      JSON.stringify({ ...pick, seq: '4' }),
      JSON.stringify({ ...pick, text: '' }),
    ])
      expect(readDrop(data(bad))).toBeNull();
    expect(readDrop(null)).toBeNull();
  });
});

describe('the draft for deciding the next study with GPT', () => {
  const lockedNode = (title: string): LockedNode => ({
    kind: 'locked',
    id: title,
    title,
    reason: '',
  });
  const note = (text: string, createdAt: number) =>
    ({ text, createdAt }) as Note;

  it('names the candidates and the latest five notes, each cut to a line', () => {
    const draft = consultDraft(
      [
        lockedNode('외부 조인과 NULL 함수'),
        lockedNode('집합 연산자'),
        lockedNode('셋째'),
      ],
      [
        note('가장 오래된 필기', 1),
        ...[2, 3, 4, 5].map((n) => note(`필기 ${n}`, n)),
        note(`긴\n필기 ${'가'.repeat(80)}`, 6),
      ],
    );
    expect(draft.split('\n')).toEqual([
      '다음에 뭘 공부하면 좋을지 내 필기를 보고 같이 정해 줘.',
      '추천 후보: ① 외부 조인과 NULL 함수 ② 집합 연산자',
      `내가 필기한 부분: “필기 2”, “필기 3”, “필기 4”, “필기 5”, “긴 필기 ${'가'.repeat(55)}…”`,
    ]);
  });

  it('is the first line alone with nothing to add', () => {
    expect(consultDraft([], [])).toBe(
      '다음에 뭘 공부하면 좋을지 내 필기를 보고 같이 정해 줘.',
    );
  });
});
