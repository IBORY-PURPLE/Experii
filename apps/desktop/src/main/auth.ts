import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Pkce } from './pkce';
import type { FetchLike } from './responses';
import type { Tokens } from './tokens';

export const AUTH_BASE = 'https://auth.openai.com';
export const TOKEN_URL = `${AUTH_BASE}/api/accounts/oauth/token`;
export const REVOKE_URL = `${AUTH_BASE}/api/accounts/oauth/revoke`;
export const API_RESOURCE = 'https://api.openai.com/v1';
export const CLIENT_ID = 'dynamic_agent_client';
export const AGENT_NAME = 'Experii';
export const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'resource.invoke',
  'chatgpt.tokens.use.direct',
];
export const REQUIRED_SCOPE = 'chatgpt.tokens.use.direct';
export const PREFERRED_PORT = 1455;
export const SIGN_IN_TIMEOUT_MS = 5 * 60_000;
const REVOKE_TIMEOUT_MS = 5_000;

export type AuthErrorCode =
  | 'cancelled'
  | 'timeout'
  | 'state_mismatch'
  | 'denied'
  | 'not_eligible_plan'
  | 'exchange_failed'
  | 'registration_incomplete'
  | 'client_mismatch'
  | 'id_token_invalid'
  | 'account_mismatch';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string = code,
  ) {
    super(message);
  }
}

// A returning sign-in reuses the issued client; without one the request registers through dynamic_agent_client.
export type Returning = {
  clientId: string;
  idTokenHint?: string | null;
  loginHint?: string | null;
};

export function authorizeUrl(opts: {
  port: number;
  pkce: Pkce;
  hostId: string;
  returning: Returning | null;
}): string {
  const url = new URL('/api/accounts/authorize', AUTH_BASE);
  const { returning } = opts;
  const params: Record<string, string | null | undefined> = {
    client_id: returning?.clientId ?? CLIENT_ID,
    agent_name_hint: returning ? null : AGENT_NAME,
    id_token_hint: returning?.idTokenHint,
    login_hint: returning?.loginHint,
    ext_agent_host_id: opts.hostId,
    response_type: 'code',
    redirect_uri: redirectUri(opts.port),
    scope: SCOPES.join(' '),
    resource: API_RESOURCE,
    code_challenge: opts.pkce.challenge,
    code_challenge_method: 'S256',
    state: opts.pkce.state,
    nonce: opts.pkce.nonce,
  };
  for (const [k, v] of Object.entries(params))
    if (v) url.searchParams.set(k, v);
  return url.toString();
}

export const redirectUri = (port: number) =>
  `http://127.0.0.1:${port}/auth/callback`;

// The callback names the issued client on registration; on reauthorization it may be absent but must never differ.
export function issuedClientId(
  returning: Returning | null,
  fromCallback: string | null,
): string {
  if (returning) {
    if (fromCallback && fromCallback !== returning.clientId)
      throw new AuthError('client_mismatch');
    return returning.clientId;
  }
  if (!fromCallback || fromCallback === CLIENT_ID)
    throw new AuthError('registration_incomplete');
  return fromCallback;
}

const PAGE = (title: string, body: string) =>
  `<!doctype html><html lang="ko"><meta charset="utf-8"><title>Experii</title>` +
  `<body style="margin:0;padding:48px;background:#f8f9f9;color:#1a2233;font:14px/1.5 'Pretendard Variable',Pretendard,'Segoe UI','Malgun Gothic',system-ui,sans-serif;word-break:keep-all">` +
  `<h1 style="margin:0 0 8px;font-size:20px;font-weight:600">${title}</h1><p style="margin:0;color:#444b59">${body}</p></body></html>`;

// Fixed pages only: nothing from the query string is echoed back to the browser.
const DONE_PAGE = PAGE('로그인했어요', '이 창을 닫고 Experii로 돌아가 주세요.');
const FAIL_PAGE = PAGE(
  '로그인하지 못했어요',
  '이 창을 닫고 Experii에서 다시 시도해 주세요.',
);

export type Callback = { code: string; clientId: string | null };

export type Loopback = {
  port: number;
  callback: Promise<Callback>;
  close(): void;
};

async function listen(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve((server.address() as AddressInfo).port);
    });
  });
}

// Tries the preferred port and falls back to any free port on every listen error,
// since Hyper-V reserved ranges surface as EACCES rather than EADDRINUSE.
export async function startLoopback(
  state: string,
  opts: {
    preferredPort?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {},
): Promise<Loopback> {
  let settle!: {
    resolve(value: Callback): void;
    reject(err: AuthError): void;
  };
  const callback = new Promise<Callback>((resolve, reject) => {
    settle = { resolve, reject };
  });
  callback.catch(() => {});
  // Connection: close stops a browser from sending the next attempt's callback down this closed server's kept-alive socket.
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (url.pathname !== '/auth/callback') {
      res.writeHead(404, { connection: 'close' }).end();
      return;
    }
    const q = url.searchParams;
    const stateOk = q.get('state') === state;
    const code = q.get('code');
    const ok = stateOk && !q.get('error') && !!code;
    res
      .writeHead(ok ? 200 : 400, {
        'content-type': 'text/html; charset=utf-8',
        connection: 'close',
      })
      .end(ok ? DONE_PAGE : FAIL_PAGE);
    if (!stateOk) finish(new AuthError('state_mismatch'));
    else if (q.get('error')) finish(new AuthError('denied', q.get('error')!));
    else if (!code) finish(new AuthError('denied'));
    else finish({ code, clientId: q.get('client_id') });
  });
  let port: number;
  try {
    port = await listen(server, opts.preferredPort ?? PREFERRED_PORT);
  } catch {
    port = await listen(server, 0);
  }
  const timer = setTimeout(
    () => finish(new AuthError('timeout')),
    opts.timeoutMs ?? SIGN_IN_TIMEOUT_MS,
  );
  const onAbort = () => finish(new AuthError('cancelled'));
  opts.signal?.addEventListener('abort', onAbort);
  let done = false;
  function finish(result: Callback | AuthError) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onAbort);
    server.close();
    if (result instanceof AuthError) settle.reject(result);
    else settle.resolve(result);
  }
  return { port, callback, close: () => finish(new AuthError('cancelled')) };
}

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
};

export const grantedScopes = (body: { scope?: string }) =>
  (body.scope ?? '').split(/\s+/).filter(Boolean);

// A refresh response may leave out scope, id_token or even the refresh token; the previous values carry over.
export function tokensFrom(
  body: TokenResponse,
  prev: Pick<Tokens, 'scopes' | 'id_token' | 'email'> & {
    refresh_token?: string;
  },
  now = Date.now(),
): Tokens {
  const scopes = grantedScopes(body);
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? prev.refresh_token,
    expires_at: now + body.expires_in * 1000,
    scopes: scopes.length ? scopes : prev.scopes,
    id_token: body.id_token ?? prev.id_token,
    email: prev.email,
  };
}

const FORM = { 'content-type': 'application/x-www-form-urlencoded' };

function oauthError(text: string): string {
  try {
    const error = (JSON.parse(text) as { error?: unknown }).error;
    return typeof error === 'string' ? error : '';
  } catch {
    return '';
  }
}

export async function exchangeCode(
  fetchImpl: FetchLike,
  opts: { code: string; verifier: string; port: number; clientId: string },
): Promise<TokenResponse & { id_token: string }> {
  let res: Response;
  try {
    res = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: FORM,
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: opts.clientId,
        code: opts.code,
        code_verifier: opts.verifier,
        redirect_uri: redirectUri(opts.port),
        resource: API_RESOURCE,
      }).toString(),
    });
  } catch {
    throw new AuthError('exchange_failed', 'network');
  }
  if (!res.ok) throw new AuthError('exchange_failed', `HTTP ${res.status}`);
  const body = (await res.json()) as TokenResponse;
  if (!body.access_token || !body.refresh_token || !body.id_token)
    throw new AuthError('exchange_failed', 'incomplete token response');
  return body as TokenResponse & { id_token: string };
}

export type RefreshResult =
  | { ok: true; body: TokenResponse }
  | { ok: false; reason: 'expired' | 'invalid_client' | 'transient' };

// The docs name invalid_grant, invalid_refresh_token, token_expired, refresh_token_expired,
// refresh_token_invalidated and refresh_token_reused; any other 4xx leaves the token set just as unusable.
export async function refreshTokens(
  fetchImpl: FetchLike,
  opts: { refreshToken: string; clientId: string },
): Promise<RefreshResult> {
  let res: Response;
  try {
    res = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: FORM,
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: opts.clientId,
        refresh_token: opts.refreshToken,
        resource: API_RESOURCE,
      }).toString(),
    });
  } catch {
    return { ok: false, reason: 'transient' };
  }
  if (res.ok) return { ok: true, body: (await res.json()) as TokenResponse };
  if (res.status >= 500 || res.status === 429)
    return { ok: false, reason: 'transient' };
  const error = oauthError(await res.text().catch(() => ''));
  return {
    ok: false,
    reason: error === 'invalid_client' ? 'invalid_client' : 'expired',
  };
}

// Sign-out ends the renewable session; a network error or 5xx gets one more try before giving up.
export async function revokeToken(
  fetchImpl: FetchLike,
  opts: { refreshToken: string; clientId: string },
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchImpl(REVOKE_URL, {
        method: 'POST',
        headers: FORM,
        body: new URLSearchParams({
          token: opts.refreshToken,
          token_type_hint: 'refresh_token',
          client_id: opts.clientId,
        }).toString(),
        signal: AbortSignal.timeout(REVOKE_TIMEOUT_MS),
      });
      if (res.ok) return true;
      if (res.status < 500) return false;
    } catch {
      // network failure or timeout: retry once
    }
  }
  return false;
}

// Concurrent callers share one in-flight promise: one browser tab per sign-in, one refresh per expiry.
export function singleFlight<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  let running: Promise<T> | null = null;
  return (...args) => {
    running ??= fn(...args).finally(() => {
      running = null;
    });
    return running;
  };
}
