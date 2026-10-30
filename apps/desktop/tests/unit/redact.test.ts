import { describe, expect, it } from 'vitest';
import { REDACTED, redactDeep, redactText } from '../../src/main/redact';
import { REDACTION_LABELS } from '../../src/shared/card';

const hits: Array<[string, string]> = [
  ['openai_key', 'key sk-proj-abcdefghijklmnopqrstuvwx1234'],
  ['github_token', 'ghp_' + 'a'.repeat(36)],
  ['aws_key', 'AKIAABCDEFGHIJKLMNOP'],
  ['google_key', 'AIza' + 'b'.repeat(35)],
  ['slack_token', 'xoxb-1234567890-abc'],
  [
    'private_key',
    '-----BEGIN RSA PRIVATE KEY-----\nMIIEow\n-----END RSA PRIVATE KEY-----',
  ],
  ['resident_id', '주민번호 900101-1234567'],
  ['bearer_token', 'Authorization: Bearer abcdefghijklmnop1234'],
  [
    'jwt',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
  ],
];

describe('redactText', () => {
  for (const [kind, sample] of hits) {
    it(`masks ${kind}`, () => {
      const counts: Record<string, number> = {};
      const out = redactText(sample, counts);
      expect(out).toContain(REDACTED);
      expect(counts).toEqual({ [kind]: 1 });
      expect(REDACTION_LABELS[kind], 'the card can name it').toBeTruthy();
    });
  }

  const clean = [
    'SELECT * FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE o.total > 1000',
    'const sk = risk - 1; function task_list() { return []; }',
    'base64: aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q=',
    'uuid 3f2b8a1e-9c4d-4e7a-8b1f-2d3c4e5f6a7b',
    '전화 010-1234-5678, 날짜 2026-10-30',
  ];
  for (const sample of clean) {
    it(`leaves ordinary text alone: ${sample.slice(0, 24)}`, () => {
      expect(redactText(sample)).toBe(sample);
    });
  }
});

describe('redactDeep', () => {
  it('walks nested strings and totals counts', () => {
    const { value, redactions } = redactDeep({
      a: 'sk-' + 'x'.repeat(24),
      b: ['AKIAABCDEFGHIJKLMNOP', 'ok'],
      n: 3,
    });
    expect(value).toEqual({ a: REDACTED, b: [REDACTED, 'ok'], n: 3 });
    expect(redactions).toEqual({ openai_key: 1, aws_key: 1 });
  });
});
