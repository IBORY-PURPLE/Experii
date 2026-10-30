import { generateKeyPairSync, sign } from 'node:crypto';
import type { Jwk } from '../../src/main/idtoken';

const part = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

// A throwaway RSA key made at test time, so no key material lives in the repository.
export function signer(kid = 'test-key') {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const jwk: Jwk = {
    ...(publicKey.export({ format: 'jwk' }) as Jwk),
    kid,
    alg: 'RS256',
    use: 'sig',
  };
  return {
    jwk,
    token(claims: object, header: object = {}) {
      const head = part({ alg: 'RS256', kid, typ: 'JWT', ...header });
      const body = part(claims);
      const signature = sign(
        'sha256',
        Buffer.from(`${head}.${body}`),
        privateKey,
      ).toString('base64url');
      return `${head}.${body}.${signature}`;
    },
  };
}
