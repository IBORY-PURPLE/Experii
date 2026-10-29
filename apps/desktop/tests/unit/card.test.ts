import { describe, expect, it } from 'vitest';
import { cardJsonSchema, cardOutputSchema } from '../../src/shared/card';
import { cardBody } from './fixtures';

describe('cardOutputSchema', () => {
  it('accepts has_learning false with no card', () => {
    expect(
      cardOutputSchema.safeParse({ has_learning: false, card: null }).success,
    ).toBe(true);
  });

  it('rejects has_learning true without a card', () => {
    expect(
      cardOutputSchema.safeParse({ has_learning: true, card: null }).success,
    ).toBe(false);
  });

  it('accepts a full card with a null result', () => {
    const parsed = cardOutputSchema.parse({
      has_learning: true,
      card: cardBody(),
    });
    expect(parsed.has_learning && parsed.card.star.result).toBeNull();
  });

  it('enforces length limits at the boundary', () => {
    const ok = cardOutputSchema.safeParse({
      has_learning: true,
      card: cardBody({ title: 'ㄱ'.repeat(60) }),
    });
    const tooLong = cardOutputSchema.safeParse({
      has_learning: true,
      card: cardBody({ title: 'ㄱ'.repeat(61) }),
    });
    expect(ok.success).toBe(true);
    expect(tooLong.success).toBe(false);
  });

  it('needs one or two recommendations and at most eight concepts', () => {
    const rec = { title: '다음', reason: '이유' };
    expect(
      cardOutputSchema.safeParse({
        has_learning: true,
        card: cardBody({ recommended_next: [] }),
      }).success,
    ).toBe(false);
    expect(
      cardOutputSchema.safeParse({
        has_learning: true,
        card: cardBody({ recommended_next: [rec, rec, rec] }),
      }).success,
    ).toBe(false);
    expect(
      cardOutputSchema.safeParse({
        has_learning: true,
        card: cardBody({ concepts: Array(9).fill('개념') }),
      }).success,
    ).toBe(false);
  });
});

describe('cardJsonSchema', () => {
  it('is a strict object root with every key required and no length keywords', () => {
    const schema = cardJsonSchema();
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(['has_learning', 'card']);
    const text = JSON.stringify(schema);
    expect(text).not.toMatch(/maxLength|minLength|maxItems|minItems|\$schema/);
  });
});
