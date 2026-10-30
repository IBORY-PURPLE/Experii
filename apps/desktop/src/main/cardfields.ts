import type { CardField } from '../shared/ipc';

const FIELDS = new Set<string>([
  'title',
  'summary',
  'interview_line',
] satisfies CardField[]);

const ESCAPES = new Map([
  ['"', '"'],
  ['\\', '\\'],
  ['/', '/'],
  ['b', '\b'],
  ['f', '\f'],
  ['n', '\n'],
  ['r', '\r'],
  ['t', '\t'],
]);

type Frame = { array: boolean; key: string | null; wantKey: boolean };
type Str = { key: boolean; text: string };

// Reads the card JSON while it streams and reports card.title, card.summary and card.interview_line once each, as soon
// as each string closes. A small scanner instead of a regex, because a delta can end anywhere, even inside an escape.
// Fields are held until has_learning is true, and only direct children of card count, not recommended_next[].title.
export class CardFieldReader {
  private stack: Frame[] = [];
  private str: Str | null = null;
  private escaped = false;
  private hex: string | null = null;
  private literal = '';
  private hasLearning: boolean | null = null;
  private held: Array<[CardField, string]> = [];
  private seen = new Set<string>();
  private broken = false;

  constructor(private onField: (field: CardField, text: string) => void) {}

  push(chunk: string) {
    for (const ch of chunk) {
      if (this.broken) return;
      if (this.str) this.inString(this.str, ch);
      else this.outside(ch);
    }
  }

  private inString(s: Str, ch: string) {
    if (this.hex !== null) {
      if (!/[\da-f]/i.test(ch)) return this.fail();
      this.hex += ch;
      if (this.hex.length < 4) return;
      s.text += String.fromCharCode(parseInt(this.hex, 16));
      this.hex = null;
    } else if (this.escaped) {
      this.escaped = false;
      const out = ESCAPES.get(ch);
      if (ch === 'u') this.hex = '';
      else if (out === undefined) this.fail();
      else s.text += out;
    } else if (ch === '\\') {
      this.escaped = true;
    } else if (ch !== '"') {
      s.text += ch;
    } else {
      this.str = null;
      const top = this.stack.at(-1);
      if (s.key && top) top.key = s.text;
      else this.value(s.text, true);
    }
  }

  private outside(ch: string) {
    if (this.literal) {
      if (/[\w.+-]/.test(ch)) {
        this.literal += ch;
        return;
      }
      this.value(this.literal, false);
      this.literal = '';
    }
    const top = this.stack.at(-1);
    if (ch === '{' || ch === '[') {
      this.stack.push({ array: ch === '[', key: null, wantKey: ch === '{' });
    } else if (ch === '}' || ch === ']') {
      if (top?.array !== (ch === ']')) return this.fail();
      this.stack.pop();
    } else if (ch === ':') {
      if (top) top.wantKey = false;
    } else if (ch === ',') {
      if (top && !top.array) {
        top.key = null;
        top.wantKey = true;
      }
    } else if (ch === '"') {
      this.str = { key: !!top && !top.array && top.wantKey, text: '' };
    } else if (/[-\dtfn]/.test(ch)) {
      this.literal = ch;
    } else if (!/\s/.test(ch)) {
      this.fail();
    }
  }

  private value(raw: string, isString: boolean) {
    const [root, card] = this.stack;
    if (this.stack.length === 1 && root.key === 'has_learning' && !isString) {
      this.learning(raw === 'true');
    } else if (
      isString &&
      this.stack.length === 2 &&
      root.key === 'card' &&
      !card.array &&
      card.key !== null &&
      FIELDS.has(card.key)
    ) {
      this.found(card.key as CardField, raw);
    }
  }

  private learning(value: boolean) {
    if (this.hasLearning !== null) return;
    this.hasLearning = value;
    if (value) for (const [field, text] of this.held) this.onField(field, text);
    this.held = [];
  }

  private found(field: CardField, text: string) {
    if (this.seen.has(field)) return;
    this.seen.add(field);
    if (this.hasLearning) this.onField(field, text);
    else if (this.hasLearning === null) this.held.push([field, text]);
  }

  private fail() {
    this.broken = true;
    this.held = [];
  }
}
