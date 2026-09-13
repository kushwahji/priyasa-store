import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE = 'priyasa_access';

/**
 * This is a browser-session hint only. PriyasaCore remains authoritative:
 * protected API calls through /api/priyasa are still checked with the bearer token,
 * and a 401 clears the HttpOnly cookie.
 */
export async function GET(request: NextRequest) {
  const authenticated = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);
  return NextResponse.json(
    { authenticated },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
