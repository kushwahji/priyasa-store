import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');
const TOKEN_COOKIE = 'priyasa_access';
const SESSION_COOKIE = 'priyasa_session';
const COOKIE_OPTIONS = { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 30 };

/** The Store does not own identity; PriyasaCore remains the authentication source of truth. */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token || !UPSTREAM) {
    return NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/storefront/cart`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const response = NextResponse.json(
      { authenticated: upstream.ok },
      { headers: { 'Cache-Control': 'no-store' } },
    );
    if (upstream.status === 401) {
      response.cookies.set(SESSION_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
      response.cookies.set(TOKEN_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
    }
    return response;
  } catch {
    return NextResponse.json(
      { authenticated: false, unavailable: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
