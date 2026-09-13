import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');
const TOKEN_COOKIE = 'priyasa_access';

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
    return NextResponse.json({ authenticated: upstream.ok }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ authenticated: false, unavailable: true }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
