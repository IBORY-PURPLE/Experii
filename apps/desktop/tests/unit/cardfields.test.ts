import { describe, expect, it } from 'vitest';
import { CardFieldReader } from '../../src/main/cardfields';
import { MOCK_CARD } from '../e2e/mock-openai';

function read(chunks: string[]): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const reader = new CardFieldReader((field, text) => out.push([field, text]));
  for (const chunk of chunks) reader.push(chunk);
  return out;
}

function everySplit(json: string, expected: Array<[string, string]>) {
  expect(read([json])).toEqual(expected);
  expect(read([...json])).toEqual(expected);
  for (let i = 1; i < json.length; i++)
    expect(read([json.slice(0, i), json.slice(i)])).toEqual(expected);
}

const { card } = MOCK_CARD;
const fieldsOf = (c: {
  title: string;
  summary: string;
  interview_line: string;
}): Array<[string, string]> => [
  ['title', c.title],
  ['summary', c.summary],
  ['interview_line', c.interview_line],
];

describe('CardFieldReader', () => {
  it('reports title, summary and interview_line once each in Hangul, wherever the deltas split', () => {
    everySplit(JSON.stringify(MOCK_CARD), fieldsOf(card));
  });

  it('reports each field the moment its string closes', () => {
    const json = JSON.stringify(MOCK_CARD);
    const seen: string[] = [];
    const reader = new CardFieldReader((field) => seen.push(field));
    const afterTitle = json.indexOf('"', json.indexOf(card.title)) + 1;
    reader.push(json.slice(0, afterTitle - 1));
    expect(seen).toEqual([]);
    reader.push(json.slice(afterTitle - 1, afterTitle));
    expect(seen).toEqual(['title']);
    reader.push(json.slice(afterTitle, json.indexOf('"star"')));
    expect(seen).toEqual(['title', 'summary', 'interview_line']);
  });

  it('decodes escapes even when a delta ends inside one', () => {
    const tricky = {
      title: '"따옴표" \\ 역슬래시 / 슬래시',
      summary: '줄\n바꿈\t탭 café 😀',
      interview_line: '한 마디',
    };
    const json = JSON.stringify({
      has_learning: true,
      card: { ...card, ...tricky },
    })
      .replace('/', '\\/')
      .replace('é', '\\u00e9')
      .replace('😀', '\\ud83d\\ude00');
    expect(json).toContain('\\u00e9');
    everySplit(json, fieldsOf(tricky));
  });

  it('reports nothing when there is no learning', () => {
    everySplit(JSON.stringify({ has_learning: false, card: null }), []);
    expect(
      read([JSON.stringify({ has_learning: false, card })]),
      'a card that breaks the schema still shows nothing',
    ).toEqual([]);
  });

  it('holds fields that come before has_learning until it is known', () => {
    const late = (hasLearning: boolean) =>
      JSON.stringify({ card, has_learning: hasLearning });
    everySplit(late(true), fieldsOf(card));
    everySplit(late(false), []);
  });

  it('reads only the direct fields of card, not recommended_next or star', () => {
    const json = JSON.stringify({
      has_learning: true,
      card: {
        recommended_next: [{ title: '추천 제목', reason: '이유' }],
        star: { situation: 's', task: 't', action: 'a', result: null },
        concepts: ['JOIN', 'NULL'],
        title: '진짜 제목',
        summary: '요약',
        next_steps: '다음',
        interview_line: '한 마디',
      },
    });
    everySplit(json, [
      ['title', '진짜 제목'],
      ['summary', '요약'],
      ['interview_line', '한 마디'],
    ]);
  });

  it('keeps the first value of a repeated key and ignores the rest', () => {
    expect(
      read([
        '{"has_learning":true,"card":{"title":"첫 제목","title":"둘째 제목","summary":"요약"}}',
      ]),
    ).toEqual([
      ['title', '첫 제목'],
      ['summary', '요약'],
    ]);
  });

  it('stops quietly on output that is not JSON', () => {
    expect(read(['```json\n', JSON.stringify(MOCK_CARD), '\n```'])).toEqual([]);
    expect(read(['{"has_learning":true,"card":{"title":"a\\q"}}'])).toEqual([]);
    expect(read(['{"has_learning":true,"card":{"title":"ok"]}'])).toEqual([
      ['title', 'ok'],
    ]);
  });
});
