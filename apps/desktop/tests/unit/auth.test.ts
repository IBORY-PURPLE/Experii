import { describe, expect, it } from 'vitest';
import {
  AuthError,
  REQUIRED_SCOPE,
  authorizeUrl,
  singleFlight,
  startLoopback,
  tokensFromResponse,
} from '../../src/main/auth';
import { createPkce } from '../../src/main/pkce';

const hit = (port: number, path: string) =>
  fetch(`http://127.0.0.1:${port}${path}`).then(async (r) => ({
    status: r.status,
    body: await r.text(),
  }));

describe('authorizeUrl', () => {
  it('carries the SIWC parameters', () => {
    const pkce = createPkce();
    const url = new URL(
      authorizeUrl({
        port: 1455,
        pkce,
        clientId: 'dynamic_agent_client',
        hostId: 'urn:uuid:x',
      }),
    );
    expect(url.origin + url.pathname).toBe(
      'https://auth.openai.com/api/accounts/authorize',
    );
    const q = Object.fromEntries(url.searchParams);
    expect(q).toMatchObject({
      client_id: 'dynamic_agent_client',
      response_type: 'code',
      redirect_uri: 'http://127.0.0.1:1455/auth/callback',
      resource: 'https://api.openai.com/v1',
      code_challenge: pkce.challenge,
      code_challenge_method: 'S256',
      state: pkce.state,
      ext_agent_host_id: 'urn:uuid:x',
    });
    expect(q.scope.split(' ')).toContain(REQUIRED_SCOPE);
  });
});

describe('startLoopback', () => {
  it('resolves the code on a matching callback without echoing the query', async () => {
    const loop = await startLoopback('s1', { preferredPort: 0 });
    const res = await hit(
      loop.port,
      '/auth/callback?state=s1&code=abc&x=%3Cscript%3E',
    );
    expect(res.status).toBe(200);
    expect(res.body).not.toContain('script');
    await expect(loop.code).resolves.toBe('abc');
  });

  it('answers 404 on other paths and keeps waiting', async () => {
    const loop = await startLoopback('s1', { preferredPort: 0 });
    expect((await hit(loop.port, '/other')).status).toBe(404);
    await hit(loop.port, '/auth/callback?state=s1&code=ok');
    await expect(loop.code).resolves.toBe('ok');
  });

  it('fails on a state mismatch or an error parameter', async () => {
    const a = await startLoopback('s1', { preferredPort: 0 });
    await hit(a.port, '/auth/callback?state=bad&code=abc');
    await expect(a.code).rejects.toMatchObject({ code: 'state_mismatch' });
    const b = await startLoopback('s1', { preferredPort: 0 });
    await hit(b.port, '/auth/callback?state=s1&error=access_denied');
    await expect(b.code).rejects.toMatchObject({ code: 'denied' });
  });

  it('times out and falls back to a free port when the preferred one is taken', async () => {
    const first = await startLoopback('s1', { preferredPort: 0 });
    const second = await startLoopback('s2', {
      preferredPort: first.port,
      timeoutMs: 30,
    });
    expect(second.port).not.toBe(first.port);
    await expect(second.code).rejects.toMatchObject({ code: 'timeout' });
    first.close();
  });
});

describe('tokensFromResponse', () => {
  it('rejects a grant without the direct-token scope', () => {
    expect(() =>
      tokensFromResponse({
        access_token: 'a',
        refresh_token: 'r',
        expires_in: 60,
        scope: 'openid email',
      }),
    ).toThrow(AuthError);
  });

  it('reads expiry and email from the id token', () => {
    const idToken = `x.${Buffer.from(JSON.stringify({ email: 'me@x.com' })).toString('base64url')}.y`;
    const t = tokensFromResponse(
      {
        access_token: 'a',
        refresh_token: 'r',
        expires_in: 60,
        scope: `openid ${REQUIRED_SCOPE}`,
        id_token: idToken,
      },
      1000,
    );
    expect(t).toMatchObject({ expires_at: 61_000, email: 'me@x.com' });
  });
});

describe('singleFlight', () => {
  it('shares one in-flight call and allows a new one after it settles', async () => {
    let runs = 0;
    const f = singleFlight(async () => {
      runs++;
      await new Promise((r) => setTimeout(r, 10));
      return runs;
    });
    const [a, b] = await Promise.all([f(), f()]);
    expect([a, b, runs]).toEqual([1, 1, 1]);
    expect(await f()).toBe(2);
  });
});
