import { NextResponse, type NextRequest } from 'next/server';
import {
  COOKIE_MAX_AGE,
  INVITE_COOKIE,
  VISITOR_COOKIE,
  isValidInvite,
  isVisitorId,
} from './lib/invite';

const cookieOptions = (request: NextRequest) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: request.nextUrl.protocol === 'https:',
  path: '/',
  maxAge: COOKIE_MAX_AGE,
});

const hostOf = (origin: string) => {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
};

// An invite link (/?invite=CODE) lets the browser in and gives it a visitor id; the API answers only browsers let in.
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const offered = searchParams.get('invite');

  if (offered !== null && !pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('invite');
    if (!isValidInvite(offered)) {
      url.searchParams.set('invite_error', '1');
      return NextResponse.redirect(url);
    }
    const response = NextResponse.redirect(url);
    response.cookies.set(INVITE_COOKIE, offered.trim(), cookieOptions(request));
    if (!isVisitorId(request.cookies.get(VISITOR_COOKIE)?.value))
      response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), cookieOptions(request));
    return response;
  }

  const invited = isValidInvite(request.cookies.get(INVITE_COOKIE)?.value);
  if (pathname.startsWith('/api/')) {
    if (!invited || !isVisitorId(request.cookies.get(VISITOR_COOKIE)?.value))
      return NextResponse.json({ error: 'invite_required' }, { status: 401 });
    // Changes come only from this site's own pages.
    const origin = request.headers.get('origin');
    if (request.method !== 'GET' && origin && hostOf(origin) !== request.nextUrl.host)
      return NextResponse.json({ error: 'bad_origin' }, { status: 403 });
    return NextResponse.next();
  }

  if (invited && !isVisitorId(request.cookies.get(VISITOR_COOKIE)?.value)) {
    const response = NextResponse.redirect(request.nextUrl.clone());
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), cookieOptions(request));
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)'],
};
