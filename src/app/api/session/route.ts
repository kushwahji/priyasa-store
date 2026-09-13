import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'priyasa_access_token';

/**
 * Deliberately a cookie-presence check. PriyasaCore's documented Store
 * contract does not expose /auth/me or /storefront/session, so the Store
 * must not invent a session-validation API. Protected API calls remain
 * authoritative; the BFF clears the cookie when Core returns 401.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return NextResponse.json(
    { authenticated: Boolean(token) },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
