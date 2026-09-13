import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'priyasa_access_token';

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: Boolean(request.cookies.get(SESSION_COOKIE)?.value) });
}
