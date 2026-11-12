import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { INVITE_COOKIE, VISITOR_COOKIE, isValidInvite, isVisitorId } from '../invite';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

// proxy.ts already turned away browsers without an invite; this repeats the check where the data is touched.
export async function requireVisitor(): Promise<string> {
  const jar = await cookies();
  const visitor = jar.get(VISITOR_COOKIE)?.value;
  if (!isValidInvite(jar.get(INVITE_COOKIE)?.value) || !isVisitorId(visitor))
    throw new HttpError(401, 'invite_required');
  return visitor;
}

export function fail(error: unknown): NextResponse {
  if (error instanceof HttpError)
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: 'server_error' }, { status: 500 });
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireId(value: string): string {
  if (!UUID_RE.test(value)) throw new HttpError(404, 'not_found');
  return value;
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, 'bad_json');
  }
}

export const finite = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.max(-1e6, Math.min(1e6, n)) : fallback;
};
