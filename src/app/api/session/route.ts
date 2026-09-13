import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_access_token';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
  if (!UPSTREAM) return NextResponse.json({ authenticated: false, message: 'PRIYASA_API_BASE_URL is not configured.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });

  try {
    const upstream = await fetch(`${UPSTREAM}/storefront/session`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!upstream.ok) {
      const response = NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
      if (upstream.status === 401) response.cookies.set({ name: SESSION_COOKIE, value: '', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
      return response;
    }
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json({ authenticated: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ authenticated: false, message: 'Unable to reach PriyasaCore.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
