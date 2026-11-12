import { afterEach, describe, expect, it } from 'vitest';
import { isValidInvite, isVisitorId } from '@/lib/invite';
import { redactText } from '@/lib/redact';
import { sniffImage } from '@/lib/sniff';

const ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ENV };
});

describe('invite codes', () => {
  it('lets nobody in when no codes are set', () => {
    delete process.env.INVITE_CODES;
    expect(isValidInvite('anything')).toBe(false);
  });

  it('accepts listed codes only, ignoring ones shorter than four characters', () => {
    process.env.INVITE_CODES = ' alpha-1 , abc, beta-22 ';
    expect(isValidInvite('alpha-1')).toBe(true);
    expect(isValidInvite('beta-22')).toBe(true);
    expect(isValidInvite('abc')).toBe(false);
    expect(isValidInvite('gamma')).toBe(false);
    expect(isValidInvite(null)).toBe(false);
  });

  it('knows a visitor id', () => {
    expect(isVisitorId(crypto.randomUUID())).toBe(true);
    expect(isVisitorId('not-a-uuid')).toBe(false);
  });
});

describe('sniffImage', () => {
  it('reads the type from the first bytes', () => {
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ');
    expect(sniffImage(webp)).toBe('image/webp');
    expect(sniffImage(new TextEncoder().encode('<svg xmlns="'))).toBeNull();
  });
});

describe('redactText', () => {
  it('masks secret shapes and counts them', () => {
    const github = ['gh', 'p_'].join('') + 'b'.repeat(36);
    const resident = ['900101', '1234567'].join('-');
    const { text, count } = redactText(`토큰 ${github}, 번호 ${resident}, 비밀번호: hunter22`);
    expect(text).not.toContain(github);
    expect(text).not.toContain(resident);
    expect(text).not.toContain('hunter22');
    expect(count).toBe(3);
  });

  it('leaves ordinary study notes alone', () => {
    const note = '1NF → 2NF → 3NF 순서로 정규화한다.';
    expect(redactText(note)).toEqual({ text: note, count: 0 });
  });
});
