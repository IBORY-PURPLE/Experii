import { describe, expect, it } from 'vitest';
import {
  ISSUER,
  IdTokenError,
  jwksFrom,
  verifyIdToken,
  type JwksSource,
} from '../../src/main/idtoken';
import { signer } from './jwt';

const key = signer();
const NOW = 1_800_000_000_000;
const nowSec = NOW / 1000;

const claims = (overrides: object = {}) => ({
  iss: ISSUER,
  aud: ['oaiapp_test'],
  sub: 'user-1',
  email: 'me@example.com',
  nonce: 'n1',
  iat: nowSec,
  exp: nowSec + 3600,
  ...overrides,
});

const jwks: JwksSource = async () => [key.jwk];

const check = (
  token: string,
  opts: { clientId?: string; nonce?: string; jwks?: JwksSource } = {},
) =>
  verifyIdToken(token, {
    clientId: 'oaiapp_test',
    nonce: 'n1',
    jwks,
    now: NOW,
    ...opts,
  });

describe('verifyIdToken', () => {
  it('accepts a signed token for this client and returns its subject and email', async () => {
    await expect(check(key.token(claims()))).resolves.toEqual({
      sub: 'user-1',
      email: 'me@example.com',
    });
    await expect(
      check(key.token(claims({ aud: 'oaiapp_test', email: undefined }))),
    ).resolves.toEqual({ sub: 'user-1', email: null });
  });

  it.each([
    ['issuer', { iss: 'https://example.com' }],
    ['audience', { aud: ['oaiapp_other'] }],
    ['expired', { exp: nowSec - 120 }],
    ['nonce', { nonce: 'other' }],
    ['subject', { sub: '' }],
  ])('rejects a wrong %s', async (reason, overrides) => {
    await expect(check(key.token(claims(overrides)))).rejects.toThrow(
      new IdTokenError(reason),
    );
  });

  it('rejects a token signed by another key or with a changed payload', async () => {
    await expect(check(signer().token(claims()))).rejects.toThrow(
      'bad signature',
    );
    const [h, , s] = key.token(claims()).split('.');
    const forged = Buffer.from(
      JSON.stringify(claims({ sub: 'someone-else' })),
    ).toString('base64url');
    await expect(check(`${h}.${forged}.${s}`)).rejects.toThrow('bad signature');
  });

  it('rejects headers other than RS256 with a key id', async () => {
    await expect(check(key.token(claims(), { alg: 'none' }))).rejects.toThrow(
      'unsupported header',
    );
    await expect(check(key.token(claims(), { alg: 'HS256' }))).rejects.toThrow(
      'unsupported header',
    );
    await expect(check('not-a-jwt')).rejects.toThrow('malformed token');
  });

  it('reloads the key set once for an unknown key id', async () => {
    const rotated = signer('rotated');
    const loads: boolean[] = [];
    const source: JwksSource = async (reload) => {
      loads.push(reload);
      return reload ? [key.jwk, rotated.jwk] : [key.jwk];
    };
    await expect(
      check(rotated.token(claims()), { jwks: source }),
    ).resolves.toMatchObject({ sub: 'user-1' });
    expect(loads).toEqual([false, true]);
    await expect(
      check(signer('unknown').token(claims()), { jwks }),
    ).rejects.toThrow('unknown key');
  });
});

describe('jwksFrom', () => {
  it('caches the key set and fetches again only on reload', async () => {
    let calls = 0;
    const source = jwksFrom(async () => {
      calls++;
      return Response.json({ keys: [key.jwk] });
    });
    expect(await source(false)).toEqual([key.jwk]);
    await source(false);
    expect(calls).toBe(1);
    await source(true);
    expect(calls).toBe(2);
  });
});
