import { describe, expect, it } from 'vitest';
import { SignupSchema, fromFormData, toFieldErrors, toRow } from '@/lib/signup-schema';

function form(entries: [string, string][]) {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
}

const valid: [string, string][] = [
  ['email', '  Student@Example.COM '],
  ['student_status', 'undergrad'],
  ['sqld_status', 'studying'],
  ['ai_subscriptions', 'chatgpt_paid'],
  ['ai_subscriptions', 'claude_paid'],
  ['consent', 'on'],
  ['hero_variant', 'h2'],
  ['utm_source', 'kakao'],
];

describe('SignupSchema', () => {
  it('정상 입력을 정규화한다', () => {
    const r = SignupSchema.safeParse(fromFormData(form(valid)));
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.email).toBe('student@example.com');
    expect(r.data.aiSubscriptions).toEqual(['chatgpt_paid', 'claude_paid']);
    expect(r.data.heroVariant).toBe('h2');
    expect(r.data.attribution.utm_source).toBe('kakao');
    expect(r.data.attribution.utm_medium).toBeNull();
  });

  it('필드별 오류를 돌려준다', () => {
    const r = SignupSchema.safeParse(fromFormData(form([['email', 'not-an-email']])));
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(toFieldErrors(r.error)).toEqual({
      email: true,
      student_status: true,
      sqld_status: true,
      ai_subscriptions: true,
      consent: true,
    });
  });

  it('none은 다른 구독과 함께 고를 수 없다', () => {
    const entries = valid.filter(([k]) => k !== 'ai_subscriptions');
    const r = SignupSchema.safeParse(
      fromFormData(form([...entries, ['ai_subscriptions', 'none'], ['ai_subscriptions', 'chatgpt_paid']])),
    );
    expect(r.success).toBe(false);
  });

  it('같은 구독을 두 번 보내면 거절한다', () => {
    const entries = valid.filter(([k]) => k !== 'ai_subscriptions');
    const r = SignupSchema.safeParse(
      fromFormData(form([...entries, ['ai_subscriptions', 'chatgpt_paid'], ['ai_subscriptions', 'chatgpt_paid']])),
    );
    expect(r.success).toBe(false);
  });

  it('알 수 없는 히어로 변형은 h1로 둔다', () => {
    const entries = valid.filter(([k]) => k !== 'hero_variant');
    const r = SignupSchema.safeParse(fromFormData(form([...entries, ['hero_variant', '<script>']])));
    expect(r.success && r.data.heroVariant).toBe('h1');
  });

  it('UTM 값은 100자에서 자른다', () => {
    const entries = valid.filter(([k]) => k !== 'utm_source');
    const r = SignupSchema.safeParse(fromFormData(form([...entries, ['utm_source', 'x'.repeat(300)]])));
    expect(r.success && r.data.attribution.utm_source?.length).toBe(100);
  });

  it('행으로 바꿀 때 동의 버전을 넣는다', () => {
    const r = SignupSchema.safeParse(fromFormData(form(valid)));
    if (!r.success) throw new Error('expected valid');
    const row = toRow(r.data, 'privacy-test');
    expect(row).toMatchObject({
      email: 'student@example.com',
      student_status: 'undergrad',
      sqld_status: 'studying',
      consent_version: 'privacy-test',
      hero_variant: 'h2',
      utm_source: 'kakao',
      referrer_host: null,
    });
  });
});
