import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/account', '/orders', '/cart', '/wishlist', '/addresses', '/checkout'];

function isProtected(pathname: string) {
  return PROTECTED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) return NextResponse.next();
  if (request.cookies.get('priyasa_session')?.value) return NextResponse.next();

  const login = new URL('/auth/login', request.url);
  login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/account/:path*', '/orders/:path*', '/cart/:path*', '/wishlist/:path*', '/addresses/:path*', '/checkout/:path*'],
};
