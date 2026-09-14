import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'priyasa_session';

/**
 * Lightweight optimistic session gate for protected storefront routes.
 * PriyasaCore remains authoritative; API 401 responses still clear the
 * HttpOnly session cookie in the Store BFF.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = request.cookies.get(SESSION_COOKIE)?.value;

  if (session) return NextResponse.next();

  const login = new URL('/auth/login', request.url);
  login.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/account/:path*',
    '/orders/:path*',
    '/cart/:path*',
    '/wishlist/:path*',
    '/addresses/:path*',
    '/checkout/:path*',
    '/support/:path*',
  ],
};
