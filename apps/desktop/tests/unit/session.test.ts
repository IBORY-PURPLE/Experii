import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REVOKE_URL, TOKEN_URL } from '../../src/main/auth';
import { Store } from '../../src/main/db';
import { ISSUER, JWKS_URL } from '../../src/main/idtoken';
import { Session } from '../../src/main/session';
import { TokenStore, type Vault } from '../../src/main/tokens';
import { signer } from './jwt';

const PLAN_SCOPE =
  'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';

const vault: Vault = {
  isAvailable: async () => true,
  encrypt: async (s) => Buffer.from(s).reverse(),
  decrypt: async (b) => ({
    result: Buffer.from(b).reverse().toString(),
    shouldReEncrypt: false,
  }),
};

// Plays the browser and OpenAI's auth endpoints: the "browser" follows the authorize URL straight to the loopback callback.
function fakeOpenAI() {
  const key = signer();
  const s = {
    authorizes: [] as Record<string, string>[],
    tokenCalls: [] as Record<string, string>[],
    revokes: [] as Record<string, string>[],
    account: { sub: 'user-1', email: 'me@example.com' },
    issue: 'oaiapp_1' as string | null,
    callbackClientId: undefined as string | undefined,
    scope: PLAN_SCOPE,
    nonce: undefined as string | undefined,
    revokeStatus: 200,
    modelCalls: 0,
    modelsStatus: 200,
    refresh: (): Response =>
      Response.json({
        access_token: 'access-r',
        refresh_token: 'refresh-r',
        expires_in: 3600,
      }),
    issued: 0,
  };
  const openExternal = async (url: string) => {
    const q = Object.fromEntries(new URL(url).searchParams);
    s.authorizes.push(q);
    const callback = new URL(q.redirect_uri);
    callback.searchParams.set('code', 'code-1');
    callback.searchParams.set('state', q.state);
    const clientId =
      s.callbackClientId ??
      (q.client_id === 'dynamic_agent_client' ? s.issue : null);
    if (clientId) callback.searchParams.set('client_id', clientId);
    void fetch(callback);
  };
  const fetchImpl = async (url: string, init: RequestInit) => {
    if (url === JWKS_URL) return Response.json({ keys: [key.jwk] });
    const form = Object.fromEntries(
      new URLSearchParams(String(init.body ?? '')),
    );
    if (url === REVOKE_URL) {
      s.revokes.push(form);
      return new Response(null, { status: s.revokeStatus });
    }
    if (url === TOKEN_URL) {
      s.tokenCalls.push(form);
      if (form.grant_type === 'refresh_token') return s.refresh();
      const now = Math.floor(Date.now() / 1000);
      s.issued++;
      return Response.json({
        access_token: `access-${s.issued}`,
        refresh_token: `refresh-${s.issued}`,
        expires_in: 3600,
        scope: s.scope,
        id_token: key.token({
          iss: ISSUER,
          aud: [form.client_id],
          sub: s.account.sub,
          email: s.account.email,
          nonce: s.nonce ?? s.authorizes.at(-1)!.nonce,
          iat: now,
          exp: now + 3600,
        }),
      });
    }
    if (url.endsWith('/models')) {
      s.modelCalls++;
      if (s.modelsStatus !== 200)
        return new Response('', { status: s.modelsStatus });
      return Response.json({
        models: [
          { slug: 'hidden', visibility: 'hide' },
          { slug: 'gpt-x', display_name: 'GPT X', visibility: 'list' },
          { slug: 'gpt-y', display_name: 'GPT Y', visibility: 'list' },
        ],
      });
    }
    throw new Error(`unexpected request ${url}`);
  };
  return { s, openExternal, fetchImpl };
}

let dir: string;
let store: Store;
let tokens: TokenStore;
let fake: ReturnType<typeof fakeOpenAI>;
let changes: number;
let session: Session;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'experii-session-'));
  store = new Store(path.join(dir, 'experii.db'));
  tokens = new TokenStore(path.join(dir, 'auth.bin'), vault);
  fake = fakeOpenAI();
  changes = 0;
  session = new Session(
    store,
    tokens,
    fake.fetchImpl,
    fake.openExternal,
    () => changes++,
    null,
  );
});

afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

const registration = () => ({
  clientId: store.getSetting('issued_client_id'),
  sub: store.getSetting('account_sub'),
  email: store.getSetting('account_email'),
});

describe('Session sign-in', () => {
  it('registers on the first sign-in and keeps the issued client, account and tokens', async () => {
    await expect(session.signIn()).resolves.toEqual({
      state: 'signed_in',
      email: 'me@example.com',
      plan: 'chatgpt-plan',
    });
    expect(fake.s.authorizes[0]).toMatchObject({
      client_id: 'dynamic_agent_client',
      agent_name_hint: 'Experii',
    });
    expect(fake.s.authorizes[0].nonce).toBeTruthy();
    expect(fake.s.tokenCalls[0]).toMatchObject({
      client_id: 'oaiapp_1',
      resource: 'https://api.openai.com/v1',
    });
    expect(registration()).toEqual({
      clientId: 'oaiapp_1',
      sub: 'user-1',
      email: 'me@example.com',
    });
    expect(await tokens.load()).toMatchObject({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      id_token: expect.any(String),
    });
    expect(changes).toBe(1);
  });

  it('treats a registration callback without an issued client id as incomplete', async () => {
    fake.s.issue = null;
    await expect(session.signIn()).rejects.toMatchObject({
      code: 'registration_incomplete',
    });
    expect(fake.s.tokenCalls).toHaveLength(0);
    expect(registration().clientId).toBeNull();
    expect(await tokens.load()).toBeNull();
  });

  it('signs in again after sign-out with the saved client, the email hint and no old id token', async () => {
    await session.signIn();
    await expect(session.signOut()).resolves.toEqual({ revoked: true });
    expect(fake.s.revokes).toEqual([
      {
        token: 'refresh-1',
        token_type_hint: 'refresh_token',
        client_id: 'oaiapp_1',
      },
    ]);
    expect(await tokens.load()).toBeNull();
    expect(registration().clientId).toBe('oaiapp_1');

    await session.signIn();
    const again = fake.s.authorizes[1];
    expect(again).toMatchObject({
      client_id: 'oaiapp_1',
      login_hint: 'me@example.com',
    });
    expect(again).not.toHaveProperty('agent_name_hint');
    expect(again).not.toHaveProperty('id_token_hint');
    expect(fake.s.tokenCalls[1].client_id).toBe('oaiapp_1');
    expect(registration().clientId).toBe('oaiapp_1');
  });

  it('sends the retained id token as a hint when signing in again while signed in', async () => {
    await session.signIn();
    const first = await tokens.load();
    await session.signIn();
    expect(fake.s.authorizes[1].id_token_hint).toBe(first!.id_token);
  });

  it('rejects a callback that names a different client and keeps the session', async () => {
    await session.signIn();
    fake.s.callbackClientId = 'oaiapp_2';
    await expect(session.signIn()).rejects.toMatchObject({
      code: 'client_mismatch',
    });
    expect(registration().clientId).toBe('oaiapp_1');
    expect((await tokens.load())?.access_token).toBe('access-1');
  });

  it('rejects a different account on reauthorization', async () => {
    await session.signIn();
    await session.signOut();
    fake.s.account = { sub: 'user-2', email: 'other@example.com' };
    await expect(session.signIn()).rejects.toMatchObject({
      code: 'account_mismatch',
    });
    expect(registration()).toMatchObject({
      clientId: 'oaiapp_1',
      sub: 'user-1',
    });
    expect(await tokens.load()).toBeNull();
  });

  it('rejects an id token that fails validation', async () => {
    fake.s.nonce = 'not-this-attempt';
    await expect(session.signIn()).rejects.toMatchObject({
      code: 'id_token_invalid',
    });
    expect(await tokens.load()).toBeNull();
  });

  it('saves nothing when the plan scope is missing', async () => {
    fake.s.scope = 'openid profile email';
    await expect(session.signIn()).rejects.toMatchObject({
      code: 'not_eligible_plan',
    });
    expect(registration().clientId).toBeNull();
    expect(await tokens.load()).toBeNull();
  });

  it('registers a new client for another account and revokes the old session', async () => {
    await session.signIn();
    fake.s.issue = 'oaiapp_2';
    fake.s.account = { sub: 'user-2', email: 'other@example.com' };
    await session.signIn(true);
    expect(fake.s.authorizes[1]).toMatchObject({
      client_id: 'dynamic_agent_client',
      agent_name_hint: 'Experii',
    });
    expect(fake.s.revokes).toEqual([
      expect.objectContaining({ token: 'refresh-1', client_id: 'oaiapp_1' }),
    ]);
    expect(registration()).toEqual({
      clientId: 'oaiapp_2',
      sub: 'user-2',
      email: 'other@example.com',
    });
  });
});

describe('Session tokens', () => {
  const expireSoon = async () => {
    const t = await tokens.load();
    await tokens.save({ ...t!, expires_at: Date.now() });
  };

  it('refreshes near expiry with the issued client and keeps what the response leaves out', async () => {
    await session.signIn();
    const before = await tokens.load();
    await expireSoon();
    const transport = await session.transport();
    const [a, b] = await Promise.all([
      transport.headers(),
      transport.headers(),
    ]);
    expect([a, b]).toEqual([
      { authorization: 'Bearer access-r' },
      { authorization: 'Bearer access-r' },
    ]);
    expect(fake.s.tokenCalls.slice(1)).toEqual([
      {
        grant_type: 'refresh_token',
        client_id: 'oaiapp_1',
        refresh_token: 'refresh-1',
        resource: 'https://api.openai.com/v1',
      },
    ]);
    expect(await tokens.load()).toMatchObject({
      refresh_token: 'refresh-r',
      scopes: before!.scopes,
      id_token: before!.id_token,
    });
  });

  it('ends the session on an unusable refresh token but keeps the registration', async () => {
    await session.signIn();
    await expireSoon();
    fake.s.refresh = () =>
      new Response('{"error":"refresh_token_expired"}', { status: 400 });
    const transport = await session.transport();
    await expect(transport.headers()).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(await tokens.load()).toBeNull();
    expect(registration().clientId).toBe('oaiapp_1');
    expect(changes).toBe(2);
  });

  it('drops the registration when the client is no longer valid', async () => {
    await session.signIn();
    await expireSoon();
    fake.s.refresh = () =>
      new Response('{"error":"invalid_client"}', { status: 401 });
    await expect((await session.transport()).headers()).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(registration().clientId).toBeNull();
  });

  it('keeps the tokens through a temporary refresh failure', async () => {
    await session.signIn();
    await expireSoon();
    fake.s.refresh = () => new Response('', { status: 503 });
    await expect((await session.transport()).headers()).rejects.toMatchObject({
      code: 'network',
    });
    expect((await tokens.load())?.refresh_token).toBe('refresh-1');
  });

  it('signs out locally and says so when the revoke is not confirmed', async () => {
    await session.signIn();
    fake.s.revokeStatus = 400;
    await expect(session.signOut()).resolves.toEqual({ revoked: false });
    expect(await tokens.load()).toBeNull();
    await expect(session.status()).resolves.toEqual({ state: 'signed_out' });
  });

  it('uses the first listed model slug', async () => {
    await session.signIn();
    const transport = await session.transport();
    expect(await session.resolveModel(transport)).toBe('gpt-x');
  });
});

describe('Session models', () => {
  const listed = [
    { slug: 'gpt-x', displayName: 'GPT X' },
    { slug: 'gpt-y', displayName: 'GPT Y' },
  ];

  it('lists the list models once per sign-in and keeps the last list', async () => {
    await session.signIn();
    expect(await session.listModels()).toEqual({
      models: listed,
      current: 'gpt-x',
    });
    await session.listModels();
    await session.resolveModel(await session.transport());
    expect(fake.s.modelCalls).toBe(1);
    expect(JSON.parse(store.getSetting('models_cache_json')!)).toEqual(listed);
    expect(session.modelName('gpt-y')).toBe('GPT Y');
    expect(session.modelName('gpt-z')).toBe('gpt-z');

    store.setSetting('default_model', 'gpt-y');
    expect((await session.listModels()).current).toBe('gpt-y');
    expect(await session.resolveModel(await session.transport())).toBe('gpt-y');
  });

  it('falls back to the saved list, then to the current model alone', async () => {
    await session.signIn();
    await session.listModels();
    const restarted = new Session(
      store,
      tokens,
      fake.fetchImpl,
      fake.openExternal,
      () => {},
      null,
    );
    fake.s.modelsStatus = 503;
    expect(await restarted.listModels()).toEqual({
      models: listed,
      current: 'gpt-x',
    });
    expect(restarted.modelName('gpt-x')).toBe('GPT X');

    store.deleteSetting('models_cache_json');
    expect(await restarted.listModels()).toEqual({ models: [], current: null });
    store.setSetting('default_model', 'gpt-y');
    expect(await restarted.listModels()).toEqual({
      models: [{ slug: 'gpt-y', displayName: 'gpt-y' }],
      current: 'gpt-y',
    });
  });

  it('forgets the list on sign-out and fetches it again after the next sign-in', async () => {
    await session.signIn();
    await session.listModels();
    await session.signOut();
    expect(store.getSetting('models_cache_json')).toBeNull();
    await session.signIn();
    await session.listModels();
    expect(fake.s.modelCalls).toBe(2);
  });
});
