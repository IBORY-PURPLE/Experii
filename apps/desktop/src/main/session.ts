import { randomUUID } from 'node:crypto';
import type { AuthStatus } from '../shared/ipc';
import {
  AuthError,
  CLIENT_ID,
  authorizeUrl,
  exchangeCode,
  refreshTokens,
  singleFlight,
  startLoopback,
  type FetchLike,
} from './auth';
import type { Store } from './db';
import { createPkce } from './pkce';
import { ResponsesError, type Transport } from './responses';
import type { TokenStore, Tokens } from './tokens';

export type TestAccount = { baseUrl: string; token: string };

const REFRESH_MARGIN_MS = 60_000;

// Owns who is signed in and hands out the Transport the chat and card calls use.
export class Session {
  private model: string | null = null;
  private pending: AbortController | null = null;

  constructor(
    private store: Store,
    private tokens: TokenStore,
    private fetchImpl: FetchLike,
    private openExternal: (url: string) => Promise<void>,
    private onChange: () => void,
    private test: TestAccount | null,
  ) {}

  async status(): Promise<AuthStatus> {
    if (this.test)
      return { state: 'signed_in', email: '테스트 계정', plan: 'chatgpt-plan' };
    const t = await this.tokens.load();
    return t
      ? { state: 'signed_in', email: t.email, plan: 'chatgpt-plan' }
      : { state: 'signed_out' };
  }

  signIn = singleFlight(async (): Promise<AuthStatus> => {
    const pkce = createPkce();
    this.pending = new AbortController();
    const loop = await startLoopback(pkce.state, {
      signal: this.pending.signal,
    });
    try {
      await this.openExternal(
        authorizeUrl({
          port: loop.port,
          pkce,
          clientId: this.clientId(),
          hostId: this.hostId(),
        }),
      );
      const code = await loop.code;
      const tokens = await exchangeCode(this.fetchImpl, {
        code,
        verifier: pkce.verifier,
        port: loop.port,
        clientId: this.clientId(),
      });
      await this.tokens.save(tokens);
      this.onChange();
      return this.status();
    } finally {
      loop.close();
      this.pending = null;
    }
  });

  cancelSignIn() {
    this.pending?.abort();
  }

  async signOut() {
    await this.tokens.clear();
    this.model = null;
    this.onChange();
  }

  async transport(): Promise<Transport> {
    if (this.test) {
      const { baseUrl, token } = this.test;
      return {
        baseUrl,
        headers: async () => ({ authorization: `Bearer ${token}` }),
        onUnauthorized: async () => false,
        planLabel: 'chatgpt-plan',
      };
    }
    if (!(await this.tokens.load())) throw new ResponsesError('unauthorized');
    return {
      baseUrl: 'https://api.openai.com/v1',
      headers: async () => {
        let t = await this.tokens.load();
        if (t && t.expires_at - Date.now() < REFRESH_MARGIN_MS)
          t = await this.refresh();
        if (!t) throw new ResponsesError('unauthorized');
        return { authorization: `Bearer ${t.access_token}` };
      },
      onUnauthorized: async () => !!(await this.refresh()),
      planLabel: 'chatgpt-plan',
    };
  }

  private refresh = singleFlight(async (): Promise<Tokens | null> => {
    const current = await this.tokens.load();
    if (!current) return null;
    const next = await refreshTokens(this.fetchImpl, {
      refreshToken: current.refresh_token,
      clientId: this.clientId(),
    }).catch((err) => {
      if (err instanceof AuthError) return null;
      throw err;
    });
    if (next === 'invalid_grant') {
      await this.signOut();
      return null;
    }
    if (next) await this.tokens.save(next);
    return next;
  });

  async resolveModel(transport: Transport): Promise<string> {
    const preferred = this.store.getSetting('default_model');
    if (preferred) return preferred;
    if (this.model) return this.model;
    let res: Response;
    try {
      res = await this.fetchImpl(`${transport.baseUrl}/models`, {
        headers: await transport.headers(),
      });
    } catch {
      throw new ResponsesError('network');
    }
    if (res.status === 401) throw new ResponsesError('unauthorized');
    if (!res.ok)
      throw new ResponsesError('server', `models HTTP ${res.status}`);
    const body = (await res.json()) as {
      data?: Array<{ id: string; visibility?: string }>;
    };
    const listed = (body.data ?? []).filter((m) => m.visibility === 'list');
    const first = (listed.length ? listed : (body.data ?? []))[0];
    if (!first) throw new ResponsesError('server', 'no models');
    this.model = first.id;
    return first.id;
  }

  private clientId() {
    return this.store.getSetting('issued_client_id') ?? CLIENT_ID;
  }

  private hostId() {
    let id = this.store.getSetting('ext_agent_host_id');
    if (!id) {
      id = `urn:uuid:${randomUUID()}`;
      this.store.setSetting('ext_agent_host_id', id);
    }
    return id;
  }
}
