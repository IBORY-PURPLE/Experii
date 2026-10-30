import { describe, expect, it } from 'vitest';
import {
  REQUIRED_SCOPE,
  authorizeUrl,
  exchangeCode,
  issuedClientId,
  refreshTokens,
  revokeToken,
  singleFlight,
  startLoopback,
  tokensFrom,
  type TokenResponse,
} from '../../src/main/auth';
import { createPkce } from '../../src/main/pkce';

const hit = (port: number, path: string) =>
  fetch(`http://127.0.0.1:${port}${path}`).then(async (r) => ({
    status: r.status,
    body: await r.text(),
  }));

// Records each request's form body so a test can read back what the endpoint received.
function recorder(respond: () => Response) {
  const calls: Array<{ url: string; form: Record<string, string> }> = [];
  const fetchImpl = async (url: string, init: RequestInit) => {
    calls.push({
      url,
      form: Object.fromEntries(new URLSearchParams(String(init.body ?? ''))),
    });
    return respond();
  };
  return { calls, fetchImpl };
}

const query = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe('authorizeUrl', () => {
  it('registers through dynamic_agent_client with the app name and a nonce', () => {
    const pkce = createPkce();
    const url = authorizeUrl({
      port: 1455,
      pkce,
      hostId: 'urn:uuid:x',
      returning: null,
    });
    expect(
      url.startsWith('https://auth.openai.com/api/accounts/authorize?'),
    ).toBe(true);
    const q = query(url);
    expect(q).toMatchObject({
      client_id: 'dynamic_agent_client',
      agent_name_hint: 'Experii',
      ext_agent_host_id: 'urn:uuid:x',
      response_type: 'code',
      redirect_uri: 'http://127.0.0.1:1455/auth/callback',
      resource: 'https://api.openai.com/v1',
      code_challenge: pkce.challenge,
      code_challenge_method: 'S256',
      state: pkce.state,
      nonce: pkce.nonce,
    });
    expect(q.scope.split(' ')).toContain(REQUIRED_SCOPE);
    expect(q).not.toHaveProperty('id_token_hint');
    expect(q).not.toHaveProperty('login_hint');
  });

  it('reauthorizes with the issued client and the account hints, without the app name', () => {
    const q = query(
      authorizeUrl({
        port: 50000,
        pkce: createPkce(),
        hostId: 'urn:uuid:x',
        returning: {
          clientId: 'oaiapp_1',
          idTokenHint: 'id.token.hint',
          loginHint: 'me@example.com',
        },
      }),
    );
    expect(q).toMatchObject({
      client_id: 'oaiapp_1',
      id_token_hint: 'id.token.hint',
      login_hint: 'me@example.com',
      redirect_uri: 'http://127.0.0.1:50000/auth/callback',
    });
    expect(q).not.toHaveProperty('agent_name_hint');
  });

  it('leaves out hints it does not have', () => {
    const q = query(
      authorizeUrl({
        port: 1455,
        pkce: createPkce(),
        hostId: 'urn:uuid:x',
        returning: { clientId: 'oaiapp_1', idTokenHint: null, loginHint: null },
      }),
    );
    expect(q).not.toHaveProperty('id_token_hint');
    expect(q).not.toHaveProperty('login_hint');
  });
});

describe('issuedClientId', () => {
  it('takes the issued id from a registration callback', () => {
    expect(issuedClientId(null, 'oaiapp_1')).toBe('oaiapp_1');
  });

  it('treats a registration callback without an issued id as incomplete', () => {
    for (const fromCallback of [null, 'dynamic_agent_client'])
      expect(() => issuedClientId(null, fromCallback)).toThrow(
        expect.objectContaining({ code: 'registration_incomplete' }),
      );
  });

  it('keeps the saved id on reauthorization and rejects a different one', () => {
    const returning = { clientId: 'oaiapp_1' };
    expect(issuedClientId(returning, null)).toBe('oaiapp_1');
    expect(issuedClientId(returning, 'oaiapp_1')).toBe('oaiapp_1');
    expect(() => issuedClientId(returning, 'oaiapp_2')).toThrow(
      expect.objectContaining({ code: 'client_mismatch' }),
    );
  });
});

describe('startLoopback', () => {
  it('resolves the code and issued client id without echoing the query', async () => {
    const loop = await startLoopback('s1', { preferredPort: 0 });
    const res = await hit(
      loop.port,
      '/auth/callback?state=s1&code=abc&client_id=oaiapp_1&x=%3Cscript%3E',
    );
    expect(res.status).toBe(200);
    expect(res.body).not.toContain('script');
    await expect(loop.callback).resolves.toEqual({
      code: 'abc',
      clientId: 'oaiapp_1',
    });
  });

  it('answers 404 on other paths and keeps waiting', async () => {
    const loop = await startLoopback('s1', { preferredPort: 0 });
    expect((await hit(loop.port, '/other')).status).toBe(404);
    await hit(loop.port, '/auth/callback?state=s1&code=ok');
    await expect(loop.callback).resolves.toEqual({
      code: 'ok',
      clientId: null,
    });
  });

  it('fails on a state mismatch or an error parameter', async () => {
    const a = await startLoopback('s1', { preferredPort: 0 });
    await hit(a.port, '/auth/callback?state=bad&code=abc');
    await expect(a.callback).rejects.toMatchObject({ code: 'state_mismatch' });
    const b = await startLoopback('s1', { preferredPort: 0 });
    await hit(b.port, '/auth/callback?state=s1&error=access_denied');
    await expect(b.callback).rejects.toMatchObject({ code: 'denied' });
  });

  it('times out and falls back to a free port when the preferred one is taken', async () => {
    const first = await startLoopback('s1', { preferredPort: 0 });
    const second = await startLoopback('s2', {
      preferredPort: first.port,
      timeoutMs: 30,
    });
    expect(second.port).not.toBe(first.port);
    await expect(second.callback).rejects.toMatchObject({ code: 'timeout' });
    first.close();
  });
});

const tokenBody = (overrides: Partial<TokenResponse> = {}) => ({
  access_token: 'a',
  refresh_token: 'r',
  id_token: 'i',
  expires_in: 3600,
  scope: `openid ${REQUIRED_SCOPE}`,
  ...overrides,
});

describe('exchangeCode', () => {
  const opts = { code: 'c', verifier: 'v', port: 1455, clientId: 'oaiapp_1' };

  it('posts the issued client, verifier, redirect URI and resource', async () => {
    const { calls, fetchImpl } = recorder(() => Response.json(tokenBody()));
    await exchangeCode(fetchImpl, opts);
    expect(calls).toEqual([
      {
        url: 'https://auth.openai.com/api/accounts/oauth/token',
        form: {
          grant_type: 'authorization_code',
          client_id: 'oaiapp_1',
          code: 'c',
          code_verifier: 'v',
          redirect_uri: 'http://127.0.0.1:1455/auth/callback',
          resource: 'https://api.openai.com/v1',
        },
      },
    ]);
  });

  it('fails on an error status or a response without an id token', async () => {
    const failing = recorder(
      () => new Response('{"error":"invalid_grant"}', { status: 400 }),
    );
    await expect(exchangeCode(failing.fetchImpl, opts)).rejects.toMatchObject({
      code: 'exchange_failed',
    });
    const partial = recorder(() =>
      Response.json(tokenBody({ id_token: undefined })),
    );
    await expect(exchangeCode(partial.fetchImpl, opts)).rejects.toMatchObject({
      code: 'exchange_failed',
    });
  });
});

describe('refreshTokens', () => {
  const opts = { refreshToken: 'r1', clientId: 'oaiapp_1' };

  it('posts the issued client, refresh token and resource without a scope', async () => {
    const { calls, fetchImpl } = recorder(() => Response.json(tokenBody()));
    expect(await refreshTokens(fetchImpl, opts)).toMatchObject({ ok: true });
    expect(calls[0].form).toEqual({
      grant_type: 'refresh_token',
      client_id: 'oaiapp_1',
      refresh_token: 'r1',
      resource: 'https://api.openai.com/v1',
    });
  });

  it('sorts failures into an expired session, an invalid client and a temporary error', async () => {
    const reason = async (respond: () => Response) => {
      const r = await refreshTokens(recorder(respond).fetchImpl, opts);
      return r.ok ? 'ok' : r.reason;
    };
    const status =
      (code: number, error = '') =>
      () =>
        new Response(error && JSON.stringify({ error }), { status: code });
    for (const error of [
      'invalid_grant',
      'refresh_token_reused',
      'refresh_token_expired',
    ])
      expect(await reason(status(400, error))).toBe('expired');
    expect(await reason(status(401, 'invalid_client'))).toBe('invalid_client');
    expect(await reason(status(503))).toBe('transient');
    expect(await reason(status(429))).toBe('transient');
    expect(
      await reason(() => {
        throw new TypeError('fetch failed');
      }),
    ).toBe('transient');
  });
});

describe('tokensFrom', () => {
  const prev = {
    scopes: [REQUIRED_SCOPE],
    id_token: 'id-1',
    email: 'me@example.com',
    refresh_token: 'r1',
  };

  it('keeps the previous scopes, id token and refresh token when a refresh leaves them out', () => {
    const body = { access_token: 'a2', expires_in: 60 } as TokenResponse;
    expect(tokensFrom(body, prev, 1000)).toEqual({
      access_token: 'a2',
      refresh_token: 'r1',
      id_token: 'id-1',
      expires_at: 61_000,
      scopes: [REQUIRED_SCOPE],
      email: 'me@example.com',
    });
  });

  it('takes the rotated refresh token and new values when present', () => {
    const t = tokensFrom(
      tokenBody({ refresh_token: 'r2', id_token: 'id-2', scope: 'openid' }),
      prev,
    );
    expect(t).toMatchObject({
      refresh_token: 'r2',
      id_token: 'id-2',
      scopes: ['openid'],
    });
  });
});

describe('revokeToken', () => {
  const opts = { refreshToken: 'r1', clientId: 'oaiapp_1' };

  it('posts the refresh token with its type hint and the issued client', async () => {
    const { calls, fetchImpl } = recorder(
      () => new Response(null, { status: 200 }),
    );
    expect(await revokeToken(fetchImpl, opts)).toBe(true);
    expect(calls).toEqual([
      {
        url: 'https://auth.openai.com/api/accounts/oauth/revoke',
        form: {
          token: 'r1',
          token_type_hint: 'refresh_token',
          client_id: 'oaiapp_1',
        },
      },
    ]);
  });

  it('tries a network error or 5xx once more, but not a 4xx', async () => {
    let calls = 0;
    const flaky = async () => {
      if (++calls === 1) throw new TypeError('fetch failed');
      return new Response(null, { status: 200 });
    };
    expect(await revokeToken(flaky, opts)).toBe(true);
    expect(calls).toBe(2);

    const down = recorder(() => new Response(null, { status: 503 }));
    expect(await revokeToken(down.fetchImpl, opts)).toBe(false);
    expect(down.calls).toHaveLength(2);

    const refused = recorder(() => new Response(null, { status: 400 }));
    expect(await revokeToken(refused.fetchImpl, opts)).toBe(false);
    expect(refused.calls).toHaveLength(1);
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
