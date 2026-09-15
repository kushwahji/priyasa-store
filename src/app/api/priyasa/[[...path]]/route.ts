import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || 'https://api.priyasa.com/api/v1').replace(/\/$/, '');
const COOKIE = 'priyasa_core_session';
const PUBLIC_AUTH = new Set(['/auth/send-otp', '/auth/verify-otp', '/auth/resend-otp']);

function tokenFrom(body: any): string | null {
  return body?.access_token || body?.token || body?.data?.access_token || body?.data?.token || body?.data?.session?.access_token || null;
}

async function handler(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const upstreamPath = `/${path.join('/')}`;
  const target = `${UPSTREAM}${upstreamPath}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');

  const session = request.cookies.get(COOKIE)?.value;
  if (session && !headers.has('authorization')) headers.set('Authorization', `Bearer ${session}`);

  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) body = await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store' });
  } catch {
    return NextResponse.json({ message: 'Unable to reach PriyasaCore.' }, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') || 'application/json';
  const payload = await upstream.arrayBuffer();
  const response = new NextResponse(payload, { status: upstream.status, headers: { 'Content-Type': contentType } });

  if (upstreamPath === '/auth/verify-otp' && upstream.ok) {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(payload));
      const token = tokenFrom(parsed);
      if (token) {
        response.cookies.set(COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    } catch {}
  }

  if (upstreamPath === '/auth/logout') {
    response.cookies.set(COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  }

  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
