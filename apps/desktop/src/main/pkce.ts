import { createHash, randomBytes } from 'node:crypto';

const base64url = (buf: Buffer) => buf.toString('base64url');

export type Pkce = { verifier: string; challenge: string; state: string };

export function createPkce(): Pkce {
  const verifier = base64url(randomBytes(32));
  return {
    verifier,
    challenge: base64url(createHash('sha256').update(verifier).digest()),
    state: base64url(randomBytes(16)),
  };
}
