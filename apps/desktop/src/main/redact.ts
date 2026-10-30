import type { Redactions } from '../shared/card';

export const REDACTED = '***REDACTED***';

// Order matters: wider shapes first so a Bearer header holding a JWT counts once, as a Bearer token.
const PATTERNS: Array<[string, RegExp]> = [
  [
    'private_key',
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  ],
  ['bearer_token', /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g],
  ['jwt', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g],
  ['openai_key', /\bsk-[A-Za-z0-9_-]{20,}/g],
  ['github_token', /\bgh[pousr]_[A-Za-z0-9]{36,}/g],
  ['aws_key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['google_key', /\bAIza[0-9A-Za-z_-]{35}/g],
  ['slack_token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/g],
  [
    'resident_id',
    /\b\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])-[1-4]\d{6}\b/g,
  ],
];

export function redactText(input: string, counts: Redactions = {}): string {
  let out = input;
  for (const [kind, pattern] of PATTERNS) {
    out = out.replace(pattern, () => {
      counts[kind] = (counts[kind] ?? 0) + 1;
      return REDACTED;
    });
  }
  return out;
}

export function redactDeep<T>(value: T): { value: T; redactions: Redactions } {
  const redactions: Redactions = {};
  const walk = (node: unknown): unknown => {
    if (typeof node === 'string') return redactText(node, redactions);
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      return Object.fromEntries(
        Object.entries(node).map(([k, v]) => [k, walk(v)]),
      );
    }
    return node;
  };
  return { value: walk(value) as T, redactions };
}
