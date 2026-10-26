import { describe, expect, it } from 'vitest';
import * as landing from '@/content/landing';
import * as loop from '@/content/loop';

const BANNED = [
  '면접 준비 끝', '합격 보장', '확연한 차이', // PRD 7장
  '최고', '1위', '유일', // PRD 7장 단정·비교
  '보장', '무조건', '100%', // [제안] 성과 보장으로 읽히는 표현
];

const COMPETITORS = /\b(TIO|티오|자소설닷컴|jasoseol)\b/i;

function strings(value: unknown, path: string, out: { path: string; text: string }[] = []) {
  if (typeof value === 'string') out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) strings(v, `${path}.${k}`, out);
  return out;
}

const all = [...strings(landing, 'landing'), ...strings(loop, 'loop')];

describe('content-guard', () => {
  it('문구가 비어 있지 않다', () => {
    expect(all.length).toBeGreaterThan(50);
  });

  it.each(BANNED)('금지 표현 "%s"이 없다', (word) => {
    expect(all.filter((s) => s.text.includes(word)).map((s) => s.path)).toEqual([]);
  });

  it('경쟁사 실명이 없다', () => {
    expect(all.filter((s) => COMPETITORS.test(s.text)).map((s) => s.path)).toEqual([]);
  });

  it('Claude는 사전 신청 폼의 구독 질문에만 나온다 (TSD D1)', () => {
    const hits = all.filter((s) => s.text.includes('Claude')).map((s) => s.path);
    expect(hits).toEqual(['landing.signup.options.aiSubscriptions[1].label']);
  });

  it('측정 전 숫자 "3분"을 쓰지 않는다 (TSD 6.3)', () => {
    expect(all.filter((s) => s.text.includes('3분')).map((s) => s.path)).toEqual([]);
  });
});
