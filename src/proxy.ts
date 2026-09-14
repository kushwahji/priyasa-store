import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'priyasa_session';
const PROTECTED = ['/account', '/orders', '/cart', '/wishlist', '/addresses', '/checkout', '/support'];

function isProtected(pathname: string) {
  return PROTECTED.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

export function proxy(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) return NextResponse.next();
  if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();

  const login = new URL('/auth/login', request.url);
  login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/account/:path*', '/orders/:path*', '/cart/:path*', '/wishlist/:path*', '/addresses/:path*', '/checkout/:path*', '/support/:path*'],
};
