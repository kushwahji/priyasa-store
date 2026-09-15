import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'priyasa_core_session';

export async function GET(request: NextRequest) {
  const value = request.cookies.get(SESSION_COOKIE)?.value;
  return NextResponse.json({ authenticated: Boolean(value) }, { headers: { 'Cache-Control': 'no-store' } });
}

export const dynamic = 'force-dynamic';
