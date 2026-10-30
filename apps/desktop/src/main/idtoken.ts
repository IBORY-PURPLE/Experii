import { createPublicKey, verify, type JsonWebKey } from 'node:crypto';
import type { FetchLike } from './responses';

export const ISSUER = 'https://auth.openai.com';
export const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;
const CLOCK_SKEW_SEC = 60;

export type Jwk = JsonWebKey & { kid?: string };
export type JwksSource = (reload: boolean) => Promise<Jwk[]>;
export type IdClaims = { sub: string; email: string | null };

export class IdTokenError extends Error {}

// Keys are cached for the process and reloaded once when a token names an unknown kid (key rotation).
export function jwksFrom(fetchImpl: FetchLike): JwksSource {
  let keys: Jwk[] | null = null;
  return async (reload) => {
    if (keys && !reload) return keys;
    const res = await fetchImpl(JWKS_URL, { method: 'GET' });
    if (!res.ok) throw new IdTokenError(`jwks HTTP ${res.status}`);
    keys = ((await res.json()) as { keys?: Jwk[] }).keys ?? [];
    return keys;
  };
}

function decodePart(part: string): Record<string, unknown> {
  const value: unknown = JSON.parse(Buffer.from(part, 'base64url').toString());
  if (!value || typeof value !== 'object')
    throw new IdTokenError('malformed token');
  return value as Record<string, unknown>;
}

// OpenAI publishes RS256 keys only, so node:crypto verifies the signature without a JWT library.
export async function verifyIdToken(
  idToken: string,
  opts: { clientId: string; nonce: string; jwks: JwksSource; now?: number },
): Promise<IdClaims> {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new IdTokenError('malformed token');
  const [h, p, s] = parts;
  const header = decodePart(h);
  const claims = decodePart(p);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string')
    throw new IdTokenError('unsupported header');
  const find = (keys: Jwk[]) =>
    keys.find((k) => k.kid === header.kid && k.kty === 'RSA');
  const jwk = find(await opts.jwks(false)) ?? find(await opts.jwks(true));
  if (!jwk) throw new IdTokenError('unknown key');
  const signed = verify(
    'sha256',
    Buffer.from(`${h}.${p}`),
    createPublicKey({ key: jwk, format: 'jwk' }),
    Buffer.from(s, 'base64url'),
  );
  if (!signed) throw new IdTokenError('bad signature');

  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== ISSUER) throw new IdTokenError('issuer');
  if (!aud.includes(opts.clientId)) throw new IdTokenError('audience');
  if (typeof claims.exp !== 'number' || claims.exp + CLOCK_SKEW_SEC < now)
    throw new IdTokenError('expired');
  if (claims.nonce !== opts.nonce) throw new IdTokenError('nonce');
  if (typeof claims.sub !== 'string' || !claims.sub)
    throw new IdTokenError('subject');
  return {
    sub: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : null,
  };
}
