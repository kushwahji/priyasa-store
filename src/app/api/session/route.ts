import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: Boolean(request.cookies.get('priyasa_session')?.value) }, { headers: { 'Cache-Control': 'no-store' } });
}
