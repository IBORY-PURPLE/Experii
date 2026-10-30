import type { IpcMainInvokeEvent } from 'electron';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Store } from '../../src/main/db';
import { IpcError, guard } from '../../src/main/ipc';
import { NoteService } from '../../src/main/notes';
import { userMessage, type InputItem } from '../../src/main/responses';
import { channels, type Payload } from '../../src/shared/ipc';

let dir: string;
let store: Store;
let clock: number;
let pending: Set<string>;
let notes: NoteService;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'experii-notes-'));
  clock = 1_000;
  store = new Store(path.join(dir, 'experii.db'), () => ++clock);
  pending = new Set();
  notes = new NoteService(store, (id) => pending.has(id));
});

afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

const assistant = (text: string): InputItem => ({
  type: 'message',
  role: 'assistant',
  content: [{ type: 'output_text', text }],
});
const call: InputItem = {
  type: 'function_call',
  call_id: 'call_1',
  name: 'search_experience_cards',
  arguments: '{"query":"JOIN"}',
};

// Q1 gets a tool round: its answer comes in two messages. Q2 gets one.
// seq: 1 Q1, 2 answer before the tool, 3 call, 4 answer after it, 5 Q2, 6 its answer
function studied() {
  const s = store.createSubject('SQLD');
  const id = crypto.randomUUID();
  const conv = {
    id,
    subjectId: s.id,
    fromRecommendedNodeId: null,
    model: 'm',
    title: '대화',
  };
  store.saveTurn(conv, userMessage('LEFT JOIN이 뭐예요?'), [
    assistant('찾아볼게요'),
    call,
    assistant('LEFT JOIN은 왼쪽 행을 모두 남겨요.'),
  ]);
  store.saveTurn(conv, userMessage('ON과 WHERE는요?'), [
    assistant('ON은 조인할 때 거르고, WHERE는 조인 뒤에 걸러요.'),
  ]);
  return { subjectId: s.id, id };
}

const draft = (
  conversationId: string,
  over: Partial<Payload<'notes:create'>> = {},
): Payload<'notes:create'> => ({
  conversationId,
  text: 'ON은 조인할 때 거르고',
  kind: 'excerpt',
  sourceSeq: 6,
  x: 40,
  y: 80,
  ...over,
});

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return err instanceof IpcError ? err.code : String(err);
  }
  return 'no error';
};

describe('question numbers', () => {
  it('counts the questions before an answer, tool rounds included', () => {
    const { id } = studied();
    expect([2, 4, 6].map((seq) => store.questionNo(id, seq))).toEqual([
      1, 1, 2,
    ]);
  });

  it('is null for a question, a tool call or a seq that is not there', () => {
    const { id } = studied();
    expect([1, 3, 5, 7].map((seq) => store.questionNo(id, seq))).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });
});

describe('Store notes', () => {
  it('creates, lists in order, moves and deletes, returning the removed row', () => {
    const { id } = studied();
    const a = store.insertNote({
      conversationId: id,
      kind: 'excerpt',
      format: 'plain',
      text: '하나',
      sourceSeq: 2,
      questionNo: 1,
      x: 1,
      y: 2,
    });
    const b = store.insertNote({
      conversationId: id,
      kind: 'memo',
      format: 'plain',
      text: '내 메모',
      sourceSeq: null,
      questionNo: null,
      x: 3,
      y: 4,
    });
    expect(a).toMatchObject({ w: null, h: null, createdAt: a.updatedAt });
    expect(store.listNotes(id).map((n) => n.text)).toEqual(['하나', '내 메모']);

    const moved = store.updateNote(a.id, { x: 120.5, y: -40 })!;
    expect(moved).toMatchObject({ x: 120.5, y: -40, text: '하나' });
    expect(moved.updatedAt).toBeGreaterThan(a.updatedAt);
    expect(store.updateNote(b.id, { w: 300, h: null })).toMatchObject({
      w: 300,
      h: null,
    });

    expect(store.deleteNote(a.id)).toMatchObject({ id: a.id, x: 120.5 });
    expect(store.deleteNote(a.id)).toBeNull();
    expect(store.listNotes(id).map((n) => n.id)).toEqual([b.id]);
  });

  it('refuses text the table cannot hold', () => {
    const { id } = studied();
    const insert = (text: string) => () =>
      store.insertNote({
        conversationId: id,
        kind: 'memo',
        format: 'plain',
        text,
        sourceSeq: null,
        questionNo: null,
        x: 0,
        y: 0,
      });
    expect(insert('')).toThrow(/CHECK/);
    expect(insert('가'.repeat(4001))).toThrow(/CHECK/);
    expect(insert('가'.repeat(4000))).not.toThrow();
  });

  it('removes the notes with their conversation and counts them on the path', () => {
    const { subjectId, id } = studied();
    notes.create(draft(id));
    notes.create(draft(id, { text: 'WHERE는 조인 뒤에' }));
    const node = store.roadmap(subjectId)!.nodes[0];
    expect(node).toMatchObject({ kind: 'current', turns: 2, notes: 2 });

    store.db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    expect(store.listNotes(id)).toEqual([]);
    expect(store.db.prepare('SELECT COUNT(*) AS n FROM notes').get()).toEqual({
      n: 0,
    });
  });
});

describe('NoteService', () => {
  it('keeps an excerpt word for word with the question its answer belongs to', () => {
    const { id } = studied();
    const { note, duplicate } = notes.create(
      draft(id, {
        text: '  LEFT JOIN은\r\n왼쪽 행을  ',
        sourceSeq: 4,
        questionNo: 9,
      }),
    );
    expect(duplicate).toBe(false);
    expect(note).toMatchObject({
      conversationId: id,
      kind: 'excerpt',
      format: 'plain',
      text: 'LEFT JOIN은\n왼쪽 행을',
      sourceSeq: 4,
      questionNo: 1,
      x: 40,
      y: 80,
    });
    expect(notes.list(id)).toEqual([note]);
  });

  it('hands back the note already made from the same words of the same answer', () => {
    const { id } = studied();
    const first = notes.create(draft(id)).note;
    const again = notes.create(
      draft(id, { text: 'ON은  조인할 때\n거르고', x: 500 }),
    );
    expect(again).toEqual({ note: first, duplicate: true });
    expect(notes.create(draft(id, { text: 'ON은 조인할 때' })).duplicate).toBe(
      false,
    );
    expect(notes.create(draft(id, { sourceSeq: 4 })).duplicate).toBe(false);
    expect(notes.list(id)).toHaveLength(3);
  });

  it('refuses an excerpt whose source is not a saved answer', () => {
    const { id } = studied();
    for (const sourceSeq of [undefined, 1, 3, 99])
      expect(code(() => notes.create(draft(id, { sourceSeq })))).toBe(
        'invalid_source',
      );
    expect(notes.list(id)).toEqual([]);
  });

  it('refuses a conversation that is not saved yet, and one that does not exist', () => {
    const waiting = crypto.randomUUID();
    pending.add(waiting);
    expect(code(() => notes.create(draft(waiting)))).toBe('not_saved');
    expect(code(() => notes.list(waiting))).toBe('not_saved');
    expect(code(() => notes.create(draft(crypto.randomUUID())))).toBe(
      'not_found',
    );
  });

  it('lets a memo change its words but never an excerpt', () => {
    const { id } = studied();
    const excerpt = notes.create(draft(id)).note;
    const memo = notes.create(
      draft(id, { kind: 'memo', text: '내 생각', sourceSeq: 6 }),
    ).note;
    expect(memo).toMatchObject({
      kind: 'memo',
      sourceSeq: null,
      questionNo: null,
    });
    expect(notes.update({ id: memo.id, text: '고친\r\n생각 ' })).toMatchObject({
      text: '고친\n생각',
    });
    expect(code(() => notes.update({ id: excerpt.id, text: '바꾼 글' }))).toBe(
      'not_editable',
    );
    expect(notes.update({ id: excerpt.id, x: 7, y: 8 })).toMatchObject({
      x: 7,
      y: 8,
      text: excerpt.text,
    });
    expect(code(() => notes.update({ id: crypto.randomUUID(), x: 1 }))).toBe(
      'not_found',
    );
  });

  it('deletes and returns the note, then reports it gone', () => {
    const { id } = studied();
    const note = notes.create(draft(id)).note;
    expect(notes.delete(note.id)).toEqual(note);
    expect(code(() => notes.delete(note.id))).toBe('not_found');
  });
});

describe('notes channels', () => {
  const event = {} as IpcMainInvokeEvent;
  const uuid = '3f2b8a1e-9c4d-4e7a-8b1f-2d3c4e5f6a7b';
  const echo = <C extends 'notes:create' | 'notes:update' | 'notes:delete'>(
    channel: C,
  ) =>
    guard(
      channel,
      () => true,
      (payload) => payload,
    );

  it('trims the text, fills in the kind and takes 1 to 4000 characters', async () => {
    const create = echo('notes:create');
    expect(
      await create(event, { conversationId: uuid, text: ' 글 ', x: 1, y: 2 }),
    ).toEqual({
      ok: true,
      data: { conversationId: uuid, text: '글', kind: 'excerpt', x: 1, y: 2 },
    });
    expect(
      (
        await create(event, {
          conversationId: uuid,
          text: '가'.repeat(4000),
          x: 0,
          y: 0,
        })
      ).ok,
    ).toBe(true);
    for (const bad of [
      { text: '   ' },
      { text: '가'.repeat(4001) },
      { kind: 'refined' },
      { conversationId: 'not-a-uuid' },
      { sourceSeq: 0 },
      { sourceSeq: 1.5 },
      { x: Number.POSITIVE_INFINITY },
      { y: 2_000_000 },
      { x: undefined },
    ])
      expect(
        await create(event, {
          conversationId: uuid,
          text: '글',
          x: 0,
          y: 0,
          ...bad,
        }),
        JSON.stringify(bad),
      ).toEqual({ ok: false, code: 'invalid_payload' });
  });

  it('moves, sizes and deletes by id only', async () => {
    const update = echo('notes:update');
    expect(await update(event, { id: uuid, x: -3.5, w: null })).toEqual({
      ok: true,
      data: { id: uuid, x: -3.5, w: null },
    });
    for (const bad of [{ w: 0 }, { h: -1 }, { text: '' }, { id: 'x' }])
      expect(await update(event, { id: uuid, ...bad })).toEqual({
        ok: false,
        code: 'invalid_payload',
      });
    expect(await echo('notes:delete')(event, { id: 'x' })).toEqual({
      ok: false,
      code: 'invalid_payload',
    });
    expect(
      channels['notes:list'].safeParse({ conversationId: uuid }).success,
    ).toBe(true);
  });

  it('turns a refused note into its error code', async () => {
    const { id } = studied();
    const waiting = crypto.randomUUID();
    pending.add(waiting);
    const create = guard(
      'notes:create',
      () => true,
      (p) => notes.create(p),
    );
    expect(
      await create(event, { conversationId: waiting, text: '글', x: 0, y: 0 }),
    ).toEqual({
      ok: false,
      code: 'not_saved',
      message: '첫 답을 받은 뒤 필기할 수 있어요',
    });
    expect(
      await create(event, {
        conversationId: id,
        text: '글',
        sourceSeq: 5,
        x: 0,
        y: 0,
      }),
    ).toMatchObject({ ok: false, code: 'invalid_source' });
  });
});
