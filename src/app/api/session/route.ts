import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'priyasa_access_token';

/**
 * Lightweight browser-session hint only. The access token is HttpOnly and is
 * never exposed to JavaScript. PriyasaCore remains authoritative: protected
 * API calls return 401 when a session is actually invalid or expired.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return NextResponse.json({ authenticated: Boolean(token) }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
