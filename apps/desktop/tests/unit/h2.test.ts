import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { Store } from '../../src/main/db';
import { userMessage } from '../../src/main/responses';
import { cardBody } from './fixtures';

let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'experii-h2-'));
  file = path.join(dir, 'experii.db');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const h2 = () =>
  execFileSync(process.execPath, ['scripts/h2.mjs', `--db=${file}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

const digest = () =>
  createHash('sha256').update(readFileSync(file)).digest('hex');

it('reports the useful share per prompt version without writing the database', () => {
  const store = new Store(file);
  const subjectId = store.createSubject('SQLD').id;
  const card = (version: string, useful: boolean | null) => {
    const id = randomUUID();
    store.saveTurn(
      { id, subjectId, fromRecommendedNodeId: null, model: 'm', title: 't' },
      userMessage('질문'),
      [],
    );
    const cardId = store.upsertCard(id, cardBody(), {}, 'm', version);
    if (useful !== null) store.rateCard(cardId, useful);
  };
  card('card-v1', true);
  card('card-v1', false);
  card('card-v1', null);
  card('card-v2', true);
  store.close();
  const before = digest();

  const out = h2();

  expect(out).toContain(
    'card-v1: 카드 3장, 평가 2장, 쓸 만해요 1장, 50.0% (미달)',
  );
  expect(out).toContain(
    'card-v2: 카드 1장, 평가 1장, 쓸 만해요 1장, 100.0% (통과)',
  );
  expect(digest(), 'read-only').toBe(before);
});
