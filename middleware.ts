import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PREFIXES = [
  '/',
  '/pricing',
  '/login',
  '/register',
  '/api/auth',
  '/api/webhooks',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, next internal files, and favicons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Exact matches or public prefixes
  const isPublic =
    pathname === '/' ||
    pathname === '/pricing' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/debug');

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
