import { randomUUID } from 'node:crypto';
import type { AuthStatus, SignOutResult } from '../shared/ipc';
import {
  API_RESOURCE,
  AuthError,
  REQUIRED_SCOPE,
  authorizeUrl,
  exchangeCode,
  grantedScopes,
  issuedClientId,
  refreshTokens,
  revokeToken,
  singleFlight,
  startLoopback,
  tokensFrom,
} from './auth';
import type { Store } from './db';
import { jwksFrom, verifyIdToken } from './idtoken';
import { createPkce } from './pkce';
import { ResponsesError, type FetchLike, type Transport } from './responses';
import type { TokenStore, Tokens } from './tokens';

export type TestAccount = { baseUrl: string; token: string };

// The issued client and the account it belongs to outlive sign-out, so the next sign-in skips registration.
type Registration = { clientId: string; sub: string; email: string | null };

const REGISTRATION_KEYS = [
  'issued_client_id',
  'account_sub',
  'account_email',
] as const;

const REFRESH_MARGIN_MS = 60_000;

// Owns who is signed in and hands out the Transport the chat and card calls use.
export class Session {
  private model: string | null = null;
  private pending: AbortController | null = null;
  private jwks = jwksFrom((url, init) => this.fetchImpl(url, init));

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

  // newAccount registers a new client even when one is saved: the "다른 계정으로" path.
  signIn = singleFlight(async (newAccount = false): Promise<AuthStatus> => {
    const saved = this.registration();
    const returning = newAccount ? null : saved;
    const current = await this.tokens.load();
    const attempt = createPkce();
    this.pending = new AbortController();
    const loop = await startLoopback(attempt.state, {
      signal: this.pending.signal,
    });
    try {
      await this.openExternal(
        authorizeUrl({
          port: loop.port,
          pkce: attempt,
          hostId: this.hostId(),
          returning: returning && {
            clientId: returning.clientId,
            idTokenHint: current?.id_token,
            loginHint: returning.email,
          },
        }),
      );
      const callback = await loop.callback;
      const clientId = issuedClientId(returning, callback.clientId);
      const body = await exchangeCode(this.fetchImpl, {
        code: callback.code,
        verifier: attempt.verifier,
        port: loop.port,
        clientId,
      });
      const claims = await verifyIdToken(body.id_token, {
        clientId,
        nonce: attempt.nonce,
        jwks: this.jwks,
      }).catch(() => {
        throw new AuthError('id_token_invalid');
      });
      if (returning && claims.sub !== returning.sub)
        throw new AuthError('account_mismatch');
      if (!grantedScopes(body).includes(REQUIRED_SCOPE))
        throw new AuthError('not_eligible_plan');
      if (current && saved && saved.clientId !== clientId)
        await revokeToken(this.fetchImpl, {
          refreshToken: current.refresh_token,
          clientId: saved.clientId,
        });
      this.saveRegistration({ clientId, sub: claims.sub, email: claims.email });
      await this.tokens.save(
        tokensFrom(body, { scopes: [], id_token: null, email: claims.email }),
      );
      this.model = null;
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

  async signOut(): Promise<SignOutResult> {
    const current = await this.tokens.load();
    const saved = this.registration();
    const revoked =
      current && saved
        ? await revokeToken(this.fetchImpl, {
            refreshToken: current.refresh_token,
            clientId: saved.clientId,
          })
        : !current;
    await this.tokens.clear();
    this.model = null;
    this.onChange();
    return { revoked };
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
      baseUrl: API_RESOURCE,
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

  // A temporary failure keeps the tokens; an unusable refresh token ends the session (and invalid_client the registration).
  private refresh = singleFlight(async (): Promise<Tokens | null> => {
    const current = await this.tokens.load();
    const saved = this.registration();
    if (!current || !saved) return null;
    const result = await refreshTokens(this.fetchImpl, {
      refreshToken: current.refresh_token,
      clientId: saved.clientId,
    });
    if (result.ok) {
      const next = tokensFrom(result.body, current);
      await this.tokens.save(next);
      return next;
    }
    if (result.reason === 'transient') throw new ResponsesError('network');
    if (result.reason === 'invalid_client') this.clearRegistration();
    await this.tokens.clear();
    this.model = null;
    this.onChange();
    return null;
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
    } catch (err) {
      if (err instanceof ResponsesError) throw err;
      throw new ResponsesError('network');
    }
    if (res.status === 401) throw new ResponsesError('unauthorized');
    if (!res.ok)
      throw new ResponsesError('server', `models HTTP ${res.status}`);
    const body = (await res.json()) as {
      models?: Array<{ slug?: string; visibility?: string }>;
    };
    const first = (body.models ?? []).find(
      (m) => m.visibility === 'list' && m.slug,
    );
    if (!first?.slug) throw new ResponsesError('server', 'no models');
    this.model = first.slug;
    return first.slug;
  }

  private registration(): Registration | null {
    const clientId = this.store.getSetting('issued_client_id');
    const sub = this.store.getSetting('account_sub');
    return clientId && sub
      ? { clientId, sub, email: this.store.getSetting('account_email') }
      : null;
  }

  private saveRegistration(r: Registration) {
    this.store.setSetting('issued_client_id', r.clientId);
    this.store.setSetting('account_sub', r.sub);
    if (r.email) this.store.setSetting('account_email', r.email);
    else this.store.deleteSetting('account_email');
  }

  private clearRegistration() {
    for (const key of REGISTRATION_KEYS) this.store.deleteSetting(key);
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
