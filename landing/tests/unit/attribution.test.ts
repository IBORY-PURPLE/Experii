import { describe, expect, it } from 'vitest';
import { parseAttribution } from '@/lib/attribution';

describe('parseAttribution', () => {
  it('UTM 5종과 referrer 호스트만 남긴다', () => {
    const a = parseAttribution(
      '?utm_source=instagram&utm_medium=social&utm_campaign=waitlist-2026-11&utm_content=p1&utm_term=sqld&x=1',
      'https://www.everytime.kr/board/123?q=secret',
    );
    expect(a).toEqual({
      utm_source: 'instagram',
      utm_medium: 'social',
      utm_campaign: 'waitlist-2026-11',
      utm_content: 'p1',
      utm_term: 'sqld',
      referrer_host: 'www.everytime.kr',
    });
  });

  it('값이 없으면 빈 객체', () => {
    expect(parseAttribution('', '')).toEqual({});
  });

  it('긴 값은 자르고 깨진 referrer는 버린다', () => {
    const a = parseAttribution(`?utm_source=${'a'.repeat(150)}`, 'not a url');
    expect(a.utm_source).toHaveLength(100);
    expect(a.referrer_host).toBeUndefined();
  });
});
