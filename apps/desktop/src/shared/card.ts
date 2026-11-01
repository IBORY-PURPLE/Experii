import { z } from 'zod';

// card-v1.1: same instructions as card-v1, generated with low reasoning effort, so H2 is measured apart.
export const PROMPT_VERSION = 'card-v1.1';

const text = (max: number) => z.string().trim().min(1).max(max);

export const recommendedNextSchema = z.object({
  title: text(40),
  reason: text(120),
});

export const cardBodySchema = z.object({
  title: text(60),
  summary: text(200),
  interview_line: text(200),
  star: z.object({
    situation: text(400),
    task: text(400),
    action: text(400),
    result: text(400).nullable(),
  }),
  concepts: z.array(text(40)).max(8),
  next_steps: text(400),
  recommended_next: z.array(recommendedNextSchema).min(1).max(2),
});

export const cardOutputSchema = z.discriminatedUnion('has_learning', [
  z.object({ has_learning: z.literal(false), card: z.null() }),
  z.object({ has_learning: z.literal(true), card: cardBodySchema }),
]);

export type CardBody = z.infer<typeof cardBodySchema>;
export type CardOutput = z.infer<typeof cardOutputSchema>;

// Strict structured output wants an object root, every key required and no length keywords,
// so the wire schema is the flat shape and the limits are enforced by cardOutputSchema afterwards.
export function cardJsonSchema(): Record<string, unknown> {
  const wire = z.object({
    has_learning: z.boolean(),
    card: cardBodySchema.nullable(),
  });
  return strictify(z.toJSONSchema(wire)) as Record<string, unknown>;
}

const DROPPED_KEYWORDS = new Set([
  '$schema',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
]);

function strictify(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strictify);
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (!DROPPED_KEYWORDS.has(key)) out[key] = strictify(value);
  }
  if (
    out.type === 'object' &&
    out.properties &&
    typeof out.properties === 'object'
  ) {
    out.required = Object.keys(out.properties);
    out.additionalProperties = false;
  }
  return out;
}

export type Redactions = Record<string, number>;

export const REDACTION_LABELS: Record<string, string> = {
  private_key: '개인키',
  bearer_token: 'Bearer 토큰',
  jwt: 'JWT',
  openai_key: 'API 키',
  github_token: 'GitHub 토큰',
  aws_key: 'AWS 키',
  google_key: 'Google API 키',
  slack_token: 'Slack 토큰',
  resident_id: '주민등록번호',
};

export type StoredCard = CardBody & {
  id: string;
  conversationId: string;
  subjectId: string;
  useful: boolean | null;
  redactions: Redactions;
  promptVersion: string;
  createdAt: number;
  updatedAt: number;
};
