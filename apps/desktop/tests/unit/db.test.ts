import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuplicateSubjectError, Store, migrate } from '../../src/main/db';
import { MIGRATIONS } from '../../src/main/migrations';
import { userMessage } from '../../src/main/responses';
import { cardBody } from './fixtures';

let dir: string;
let store: Store;
let clock: number;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'experii-db-'));
  clock = 1_000;
  store = new Store(path.join(dir, 'experii.db'), () => ++clock);
});

afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

const assistant = (text: string) => ({
  type: 'message',
  role: 'assistant',
  content: [{ type: 'output_text', text }],
});

function conversation(
  subjectId: string,
  fromRecommendedNodeId: string | null = null,
) {
  const id = crypto.randomUUID();
  store.saveTurn(
    { id, subjectId, fromRecommendedNodeId, model: 'm', title: '대화' },
    userMessage('질문'),
    [assistant('답')],
  );
  return id;
}

describe('migrate', () => {
  it('backs up with VACUUM INTO before applying a newer migration', () => {
    const file = path.join(dir, 'up.db');
    const db = new DatabaseSync(file);
    db.exec('PRAGMA journal_mode = WAL');
    migrate(db, file);
    db.exec(`INSERT INTO settings VALUES ('k', 'v')`);
    migrate(db, file, [...MIGRATIONS, 'CREATE TABLE extra (x)']);
    expect(existsSync(`${file}.bak-v1`)).toBe(true);
    const backup = new DatabaseSync(`${file}.bak-v1`);
    expect(backup.prepare('SELECT value FROM settings').get()).toEqual({
      value: 'v',
    });
    expect(
      Number(
        (db.prepare('PRAGMA user_version').get() as { user_version: number })
          .user_version,
      ),
    ).toBe(2);
    backup.close();
    db.close();
  });
});

describe('Store', () => {
  it('rejects duplicate subject titles case-insensitively', () => {
    store.createSubject('SQLD');
    expect(() => store.createSubject('sqld')).toThrow(DuplicateSubjectError);
  });

  it('saves a turn atomically and replays items in order', () => {
    const s = store.createSubject('SQLD');
    const id = conversation(s.id);
    store.saveTurn(
      {
        id,
        subjectId: s.id,
        fromRecommendedNodeId: null,
        model: 'm',
        title: '대화',
      },
      userMessage('둘'),
      [assistant('둘 답')],
    );
    expect(store.items(id).map((i) => i.seq)).toEqual([1, 2, 3, 4]);
    expect(store.messages(id).map((m) => m.text)).toEqual([
      '질문',
      '답',
      '둘',
      '둘 답',
    ]);
  });

  it('rolls back a turn when an insert fails', () => {
    const s = store.createSubject('SQLD');
    const id = crypto.randomUUID();
    const bad = {
      type: 'message',
      role: 'assistant',
      get content(): never {
        throw new Error('boom');
      },
    };
    expect(() =>
      store.saveTurn(
        {
          id,
          subjectId: s.id,
          fromRecommendedNodeId: null,
          model: 'm',
          title: '대화',
        },
        userMessage('q'),
        [bad as never],
      ),
    ).toThrow('boom');
    expect(store.getConversationRow(id)).toBeNull();
    expect(store.items(id)).toEqual([]);
  });

  it('keeps the card id and clears the rating on regeneration', () => {
    const s = store.createSubject('SQLD');
    const conv = conversation(s.id);
    const first = store.upsertCard(conv, cardBody(), {}, 'm', 'card-v1');
    store.rateCard(first, true);
    const second = store.upsertCard(
      conv,
      cardBody({ title: '새 제목' }),
      { openai_key: 1 },
      'm',
      'card-v1',
    );
    expect(second).toBe(first);
    const card = store.getCard(first)!;
    expect(card.title).toBe('새 제목');
    expect(card.useful).toBeNull();
    expect(card.redactions).toEqual({ openai_key: 1 });
  });

  it('replaces recommendations only when the card belongs to the latest conversation', () => {
    const s = store.createSubject('SQLD');
    const older = conversation(s.id);
    const latest = conversation(s.id);
    store.upsertCard(
      latest,
      cardBody({ recommended_next: [{ title: '최신 추천', reason: 'r' }] }),
      {},
      'm',
      'v',
    );
    store.upsertCard(
      older,
      cardBody({ recommended_next: [{ title: '옛 추천', reason: 'r' }] }),
      {},
      'm',
      'v',
    );
    const locked = store
      .roadmap(s.id)!
      .nodes.filter((n) => n.kind === 'locked');
    expect(locked.map((n) => n.title)).toEqual(['최신 추천']);
  });

  it('searches cards for every word, newest first, taking %, _ and \\ literally', () => {
    const sql = store.createSubject('SQLD');
    const net = store.createSubject('네트워크');
    store.upsertCard(conversation(sql.id), cardBody(), {}, 'm', 'v');
    store.upsertCard(
      conversation(sql.id),
      cardBody({
        title: '인덱스 100% 활용',
        summary: '조인 순서와 인덱스 a_b',
        concepts: ['INDEX'],
        next_steps: '실행 계획 보기',
      }),
      {},
      'm',
      'v',
    );
    store.upsertCard(
      conversation(net.id),
      cardBody({
        title: 'TCP와 JOIN 없는 세상',
        summary: 'SYN acb',
        concepts: ['TCP'],
        next_steps: 'UDP',
      }),
      {},
      'm',
      'v',
    );
    const titles = (query: string) =>
      store.searchCards(query).cards.map((c) => c.title);

    const join = store.searchCards('join');
    expect(join.total).toBe(2);
    expect(join.cards.map((c) => [c.subject, c.title])).toEqual([
      ['네트워크', 'TCP와 JOIN 없는 세상'],
      ['SQLD', cardBody().title],
    ]);
    expect(join.cards[1]).toMatchObject({
      summary: cardBody().summary,
      interview_line: cardBody().interview_line,
      concepts: cardBody().concepts,
      created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(titles('JOIN  LEFT')).toEqual([cardBody().title]);
    expect(titles('%')).toEqual(['인덱스 100% 활용']);
    expect(titles('a_b')).toEqual(['인덱스 100% 활용']);
    expect(titles('\\')).toEqual([]);

    const all = store.searchCards('  ', 2);
    expect(all.total).toBe(3);
    expect(all.cards.map((c) => c.title)).toEqual([
      'TCP와 JOIN 없는 세상',
      '인덱스 100% 활용',
    ]);
  });

  it('builds the roadmap: done, then in-progress, then unstarted locked nodes', () => {
    const s = store.createSubject('SQLD');
    const a = conversation(s.id);
    const b = conversation(s.id);
    store.upsertCard(
      b,
      cardBody({
        recommended_next: [
          { title: '추천 1', reason: 'r1' },
          { title: '추천 2', reason: 'r2' },
        ],
      }),
      {},
      'm',
      'v',
    );
    let map = store.roadmap(s.id)!;
    expect(map.nodes.map((n) => n.kind)).toEqual([
      'done',
      'current',
      'locked',
      'locked',
    ]);
    expect(map.nodes[1]).toMatchObject({
      kind: 'current',
      conversationId: a,
      turns: 1,
    });
    expect(map.stats).toEqual({ cards: 1, useful: 0, rated: 0, unrated: 1 });

    const rec = map.nodes.find(
      (n) => n.kind === 'locked' && n.title === '추천 1',
    )!;
    conversation(s.id, rec.kind === 'locked' ? rec.id : null);
    map = store.roadmap(s.id)!;
    expect(
      map.nodes.filter((n) => n.kind === 'locked').map((n) => n.title),
    ).toEqual(['추천 2']);
    expect(store.listSubjects()[0].cardCount).toBe(1);
  });
});
