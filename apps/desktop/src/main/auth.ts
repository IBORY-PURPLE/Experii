import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Pkce } from './pkce';
import type { Tokens } from './tokens';

export const AUTH_BASE = 'https://auth.openai.com';
export const API_RESOURCE = 'https://api.openai.com/v1';
export const CLIENT_ID = 'dynamic_agent_client';
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

export type AuthErrorCode =
  | 'cancelled'
  | 'timeout'
  | 'state_mismatch'
  | 'denied'
  | 'not_eligible_plan'
  | 'exchange_failed';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string = code,
  ) {
    super(message);
  }
}

export function authorizeUrl(opts: {
  port: number;
  pkce: Pkce;
  clientId: string;
  hostId: string;
}): string {
  const url = new URL('/api/accounts/authorize', AUTH_BASE);
  const params = {
    client_id: opts.clientId,
    response_type: 'code',
    redirect_uri: redirectUri(opts.port),
    scope: SCOPES.join(' '),
    resource: API_RESOURCE,
    code_challenge: opts.pkce.challenge,
    code_challenge_method: 'S256',
    state: opts.pkce.state,
    ext_agent_host_id: opts.hostId,
  };
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

export const redirectUri = (port: number) =>
  `http://127.0.0.1:${port}/auth/callback`;

const PAGE = (title: string, body: string) =>
  `<!doctype html><html lang="ko"><meta charset="utf-8"><title>Experii</title>` +
  `<body style="font-family:system-ui;padding:48px;color:#1a2233"><h1 style="font-size:22px">${title}</h1><p>${body}</p></body></html>`;

// Fixed pages only: nothing from the query string is echoed back to the browser.
const DONE_PAGE = PAGE('로그인했어요', '이 창을 닫고 Experii로 돌아가 주세요.');
const FAIL_PAGE = PAGE(
  '로그인하지 못했어요',
  '이 창을 닫고 Experii에서 다시 시도해 주세요.',
);

export type Loopback = {
  port: number;
  code: Promise<string>;
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
  let settle!: { resolve(code: string): void; reject(err: AuthError): void };
  const code = new Promise<string>((resolve, reject) => {
    settle = { resolve, reject };
  });
  code.catch(() => {});
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (url.pathname !== '/auth/callback') {
      res.writeHead(404).end();
      return;
    }
    const ok =
      url.searchParams.get('state') === state &&
      !url.searchParams.get('error') &&
      !!url.searchParams.get('code');
    res
      .writeHead(ok ? 200 : 400, { 'content-type': 'text/html; charset=utf-8' })
      .end(ok ? DONE_PAGE : FAIL_PAGE);
    if (url.searchParams.get('error')) finish(new AuthError('denied'));
    else if (url.searchParams.get('state') !== state)
      finish(new AuthError('state_mismatch'));
    else if (!url.searchParams.get('code')) finish(new AuthError('denied'));
    else finish(url.searchParams.get('code')!);
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
  function finish(result: string | AuthError) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onAbort);
    server.close();
    if (typeof result === 'string') settle.resolve(result);
    else settle.reject(result);
  }
  return { port, code, close: () => finish(new AuthError('cancelled')) };
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
};

function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split('.')[1], 'base64url').toString(),
    ) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
}

export function tokensFromResponse(
  body: TokenResponse,
  now = Date.now(),
): Tokens {
  const scopes = (body.scope ?? '').split(/\s+/).filter(Boolean);
  if (!scopes.includes(REQUIRED_SCOPE))
    throw new AuthError('not_eligible_plan');
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: now + body.expires_in * 1000,
    scopes,
    email: emailFromIdToken(body.id_token),
  };
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export async function exchangeCode(
  fetchImpl: FetchLike,
  opts: { code: string; verifier: string; port: number; clientId: string },
): Promise<Tokens> {
  const res = await fetchImpl(`${AUTH_BASE}/api/accounts/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: opts.code,
      redirect_uri: redirectUri(opts.port),
      client_id: opts.clientId,
      code_verifier: opts.verifier,
    }).toString(),
  });
  if (!res.ok) throw new AuthError('exchange_failed', `HTTP ${res.status}`);
  return tokensFromResponse((await res.json()) as TokenResponse);
}

export async function refreshTokens(
  fetchImpl: FetchLike,
  opts: { refreshToken: string; clientId: string },
): Promise<Tokens | 'invalid_grant'> {
  const res = await fetchImpl(`${AUTH_BASE}/api/accounts/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: opts.refreshToken,
      client_id: opts.clientId,
    }).toString(),
  });
  if (res.status === 400 || res.status === 401) {
    const text = await res.text().catch(() => '');
    if (/invalid_grant/.test(text)) return 'invalid_grant';
  }
  if (!res.ok) throw new AuthError('exchange_failed', `HTTP ${res.status}`);
  return tokensFromResponse((await res.json()) as TokenResponse);
}

// Concurrent callers share one in-flight promise: one browser tab per sign-in, one refresh per expiry.
export function singleFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let running: Promise<T> | null = null;
  return () => {
    running ??= fn().finally(() => {
      running = null;
    });
    return running;
  };
}
