import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { CardBody, Redactions, StoredCard } from '../shared/card';
import type {
  ChatMessage,
  DoneNode,
  CurrentNode,
  LockedNode,
  Roadmap,
  Subject,
} from '../shared/ipc';
import { MIGRATIONS } from './migrations';
import { messageText, type InputItem, type StoredItem } from './responses';

type Row = Record<string, unknown>;

export class DuplicateSubjectError extends Error {}

export function migrate(
  db: DatabaseSync,
  file: string,
  migrations: string[] = MIGRATIONS,
) {
  const current = Number(
    (db.prepare('PRAGMA user_version').get() as Row).user_version,
  );
  if (current >= migrations.length) return;
  // WAL makes a plain file copy inconsistent, so the backup goes through VACUUM INTO.
  if (current > 0 && file !== ':memory:') {
    const backup = `${file}.bak-v${current}`;
    if (!existsSync(backup))
      db.exec(`VACUUM INTO '${backup.replaceAll("'", "''")}'`);
  }
  for (let v = current; v < migrations.length; v++) {
    tx(db, () => {
      db.exec(migrations[v]);
      db.exec(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

export function tx<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export type NewConversation = {
  id: string;
  subjectId: string;
  fromRecommendedNodeId: string | null;
  model: string;
  title: string;
};

export class Store {
  readonly db: DatabaseSync;

  constructor(
    readonly file: string,
    private now: () => number = Date.now,
  ) {
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA synchronous = NORMAL');
    migrate(this.db, file);
  }

  close() {
    this.db.close();
  }

  getSetting(key: string): string | null {
    const row = this.db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as Row | undefined;
    return row ? String(row.value) : null;
  }

  setSetting(key: string, value: string) {
    this.db
      .prepare(
        'INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      )
      .run(key, value);
  }

  listSubjects(): Subject[] {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.title, s.created_at, COUNT(c.id) AS card_count
         FROM subjects s
         LEFT JOIN conversations v ON v.subject_id = s.id
         LEFT JOIN experience_cards c ON c.conversation_id = v.id
         GROUP BY s.id ORDER BY s.created_at, s.rowid`,
      )
      .all() as Row[];
    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      cardCount: Number(r.card_count),
      createdAt: Number(r.created_at),
    }));
  }

  getSubject(id: string): Subject | null {
    return this.listSubjects().find((s) => s.id === id) ?? null;
  }

  createSubject(title: string): Subject {
    const id = randomUUID();
    const at = this.now();
    try {
      this.db
        .prepare(
          'INSERT INTO subjects(id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
        )
        .run(id, title, at, at);
    } catch (err) {
      if (/UNIQUE/.test(String(err))) throw new DuplicateSubjectError(title);
      throw err;
    }
    return { id, title, cardCount: 0, createdAt: at };
  }

  getRecommendedNode(
    id: string,
  ): { id: string; subjectId: string; title: string; reason: string } | null {
    const r = this.db
      .prepare(
        'SELECT id, subject_id, title, reason FROM recommended_nodes WHERE id = ?',
      )
      .get(id) as Row | undefined;
    return r
      ? {
          id: String(r.id),
          subjectId: String(r.subject_id),
          title: String(r.title),
          reason: String(r.reason),
        }
      : null;
  }

  getConversationRow(
    id: string,
  ): (NewConversation & { createdAt: number }) | null {
    const r = this.db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(id) as Row | undefined;
    if (!r) return null;
    return {
      id: String(r.id),
      subjectId: String(r.subject_id),
      fromRecommendedNodeId:
        r.from_recommended_node_id == null
          ? null
          : String(r.from_recommended_node_id),
      model: String(r.model),
      title: String(r.title),
      createdAt: Number(r.created_at),
    };
  }

  items(conversationId: string): StoredItem[] {
    return this.db
      .prepare(
        'SELECT seq, type, item_json FROM items WHERE conversation_id = ? ORDER BY seq',
      )
      .all(conversationId) as unknown as StoredItem[];
  }

  messages(conversationId: string): ChatMessage[] {
    const rows = this.db
      .prepare(
        `SELECT role, text FROM items WHERE conversation_id = ? AND type = 'message' ORDER BY seq`,
      )
      .all(conversationId) as Row[];
    return rows
      .filter((r) => r.role === 'user' || r.role === 'assistant')
      .map((r) => ({
        role: r.role as ChatMessage['role'],
        text: String(r.text ?? ''),
      }));
  }

  // The user item and every output item land together or not at all, so a cancelled stream leaves nothing.
  saveTurn(
    conv: NewConversation,
    userItem: InputItem,
    outputItems: InputItem[],
  ) {
    tx(this.db, () => {
      const at = this.now();
      const exists = this.db
        .prepare('SELECT 1 FROM conversations WHERE id = ?')
        .get(conv.id);
      if (!exists) {
        this.db
          .prepare(
            `INSERT INTO conversations(id, subject_id, from_recommended_node_id, model, title, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            conv.id,
            conv.subjectId,
            conv.fromRecommendedNodeId,
            conv.model,
            conv.title,
            at,
            at,
          );
      } else {
        this.db
          .prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
          .run(at, conv.id);
      }
      const max = this.db
        .prepare(
          'SELECT COALESCE(MAX(seq), 0) AS m FROM items WHERE conversation_id = ?',
        )
        .get(conv.id) as Row;
      let seq = Number(max.m);
      const insert = this.db.prepare(
        'INSERT INTO items(id, conversation_id, seq, type, role, text, item_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      );
      for (const item of [userItem, ...outputItems]) {
        const isMessage = item.type === 'message';
        insert.run(
          randomUUID(),
          conv.id,
          ++seq,
          item.type,
          isMessage ? String(item.role ?? '') : null,
          isMessage ? messageText(item) : null,
          JSON.stringify(item),
          at,
        );
      }
    });
  }

  latestConversationId(subjectId: string): string | null {
    const r = this.db
      .prepare(
        'SELECT id FROM conversations WHERE subject_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1',
      )
      .get(subjectId) as Row | undefined;
    return r ? String(r.id) : null;
  }

  cardIdForConversation(conversationId: string): string | null {
    const r = this.db
      .prepare('SELECT id FROM experience_cards WHERE conversation_id = ?')
      .get(conversationId) as Row | undefined;
    return r ? String(r.id) : null;
  }

  // Keeps the card id on regeneration, clears the rating, and swaps recommendations only for the subject's latest conversation.
  upsertCard(
    conversationId: string,
    body: CardBody,
    redactions: Redactions,
    model: string,
    promptVersion: string,
  ): string {
    return tx(this.db, () => {
      const conv = this.getConversationRow(conversationId);
      if (!conv) throw new Error('conversation not found');
      const at = this.now();
      this.db
        .prepare(
          `INSERT INTO experience_cards(id, conversation_id, title, summary, interview_line, star_situation, star_task,
             star_action, star_result, concepts_json, next_steps, useful, rated_at, redactions_json, model, prompt_version,
             created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?)
           ON CONFLICT(conversation_id) DO UPDATE SET
             title = excluded.title, summary = excluded.summary, interview_line = excluded.interview_line,
             star_situation = excluded.star_situation, star_task = excluded.star_task, star_action = excluded.star_action,
             star_result = excluded.star_result, concepts_json = excluded.concepts_json, next_steps = excluded.next_steps,
             useful = NULL, rated_at = NULL, redactions_json = excluded.redactions_json, model = excluded.model,
             prompt_version = excluded.prompt_version, updated_at = excluded.updated_at`,
        )
        .run(
          randomUUID(),
          conversationId,
          body.title,
          body.summary,
          body.interview_line,
          body.star.situation,
          body.star.task,
          body.star.action,
          body.star.result,
          JSON.stringify(body.concepts),
          body.next_steps,
          JSON.stringify(redactions),
          model,
          promptVersion,
          at,
          at,
        );
      const cardId = this.cardIdForConversation(conversationId)!;
      if (this.latestConversationId(conv.subjectId) === conversationId) {
        this.db
          .prepare('DELETE FROM recommended_nodes WHERE subject_id = ?')
          .run(conv.subjectId);
        const insert = this.db.prepare(
          'INSERT INTO recommended_nodes(id, subject_id, source_card_id, title, reason, rank) VALUES (?, ?, ?, ?, ?, ?)',
        );
        body.recommended_next.forEach((r, i) =>
          insert.run(
            randomUUID(),
            conv.subjectId,
            cardId,
            r.title,
            r.reason,
            i,
          ),
        );
      }
      return cardId;
    });
  }

  getCard(id: string): StoredCard | null {
    const r = this.db
      .prepare(
        `SELECT c.*, v.subject_id FROM experience_cards c JOIN conversations v ON v.id = c.conversation_id WHERE c.id = ?`,
      )
      .get(id) as Row | undefined;
    if (!r) return null;
    const recs = this.db
      .prepare(
        'SELECT title, reason FROM recommended_nodes WHERE source_card_id = ? ORDER BY rank',
      )
      .all(id) as Row[];
    return {
      id: String(r.id),
      conversationId: String(r.conversation_id),
      subjectId: String(r.subject_id),
      title: String(r.title),
      summary: String(r.summary),
      interview_line: String(r.interview_line),
      star: {
        situation: String(r.star_situation),
        task: String(r.star_task),
        action: String(r.star_action),
        result: r.star_result == null ? null : String(r.star_result),
      },
      concepts: JSON.parse(String(r.concepts_json)) as string[],
      next_steps: String(r.next_steps),
      recommended_next: recs.map((x) => ({
        title: String(x.title),
        reason: String(x.reason),
      })),
      useful: r.useful == null ? null : Number(r.useful) === 1,
      redactions: JSON.parse(String(r.redactions_json)) as Redactions,
      promptVersion: String(r.prompt_version),
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    };
  }

  rateCard(id: string, useful: boolean) {
    const res = this.db
      .prepare(
        'UPDATE experience_cards SET useful = ?, rated_at = ? WHERE id = ?',
      )
      .run(useful ? 1 : 0, this.now(), id);
    if (Number(res.changes) === 0) throw new Error('card not found');
  }

  roadmap(subjectId: string): Roadmap | null {
    const subject = this.getSubject(subjectId);
    if (!subject) return null;
    const convs = this.db
      .prepare(
        `SELECT v.id, v.title, v.created_at, c.id AS card_id, c.title AS card_title, c.summary, c.interview_line, c.useful,
           (SELECT COUNT(*) FROM items i WHERE i.conversation_id = v.id AND i.type = 'message' AND i.role = 'user') AS turns
         FROM conversations v LEFT JOIN experience_cards c ON c.conversation_id = v.id
         WHERE v.subject_id = ? ORDER BY v.created_at, v.rowid`,
      )
      .all(subjectId) as Row[];
    const done: DoneNode[] = [];
    const current: CurrentNode[] = [];
    for (const r of convs) {
      if (r.card_id != null) {
        done.push({
          kind: 'done',
          conversationId: String(r.id),
          cardId: String(r.card_id),
          title: String(r.card_title),
          summary: String(r.summary),
          interviewLine: String(r.interview_line),
          useful: r.useful == null ? null : Number(r.useful) === 1,
          createdAt: Number(r.created_at),
        });
      } else if (Number(r.turns) > 0) {
        current.push({
          kind: 'current',
          conversationId: String(r.id),
          title: String(r.title),
          turns: Number(r.turns),
          createdAt: Number(r.created_at),
        });
      }
    }
    const locked = (
      this.db
        .prepare(
          `SELECT id, title, reason FROM recommended_nodes
           WHERE subject_id = ? AND id NOT IN
             (SELECT from_recommended_node_id FROM conversations WHERE from_recommended_node_id IS NOT NULL)
           ORDER BY rank`,
        )
        .all(subjectId) as Row[]
    ).map((r): LockedNode => ({
      kind: 'locked',
      id: String(r.id),
      title: String(r.title),
      reason: String(r.reason),
    }));
    const rated = done.filter((d) => d.useful !== null).length;
    return {
      subject,
      stats: {
        cards: done.length,
        useful: done.filter((d) => d.useful === true).length,
        rated,
        unrated: done.length - rated,
      },
      nodes: [...done, ...current, ...locked],
    };
  }
}
