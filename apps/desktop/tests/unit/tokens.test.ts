import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { createPkce } from '../../src/main/pkce';
import { TokenStore, type Tokens, type Vault } from '../../src/main/tokens';

const tokens: Tokens = {
  access_token: 'acc-secret',
  refresh_token: 'ref-secret',
  id_token: null,
  expires_at: 1,
  scopes: ['a'],
  email: null,
};

const vault = (
  available: boolean,
  reEncrypt = false,
): Vault & { writes: number } => {
  const v = {
    writes: 0,
    isAvailable: async () => available,
    encrypt: async (s: string) => {
      v.writes++;
      return Buffer.from(
        Buffer.from(s).toString('base64').split('').reverse().join(''),
      );
    },
    decrypt: async (b: Buffer) => ({
      result: Buffer.from(
        b.toString().split('').reverse().join(''),
        'base64',
      ).toString(),
      shouldReEncrypt: reEncrypt,
    }),
  };
  return v;
};

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'experii-tok-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('TokenStore', () => {
  it('writes through a temp file, never in plain text, and reads back', async () => {
    const file = path.join(dir, 'auth.bin');
    await new TokenStore(file, vault(true)).save(tokens);
    expect(existsSync(`${file}.tmp`)).toBe(false);
    expect(readFileSync(file, 'utf8')).not.toContain('acc-secret');
    expect(await new TokenStore(file, vault(true)).load()).toEqual(tokens);
  });

  it('keeps tokens only in memory when encryption is unavailable', async () => {
    const file = path.join(dir, 'auth.bin');
    const store = new TokenStore(file, vault(false));
    await store.save(tokens);
    expect(existsSync(file)).toBe(false);
    expect(await store.load()).toEqual(tokens);
  });

  it('re-encrypts when the vault asks for it', async () => {
    const file = path.join(dir, 'auth.bin');
    await new TokenStore(file, vault(true)).save(tokens);
    const v = vault(true, true);
    await new TokenStore(file, v).load();
    expect(v.writes).toBe(1);
  });
});

describe('createPkce', () => {
  it('derives an S256 challenge from a fresh verifier', () => {
    const a = createPkce();
    const b = createPkce();
    expect(a.verifier).not.toBe(b.verifier);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.challenge).toBe(
      createHash('sha256').update(a.verifier).digest('base64url'),
    );
    expect(a.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
