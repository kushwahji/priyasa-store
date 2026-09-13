import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COOKIE = 'priyasa_session';
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function upstreamBase() {
  const value = process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL;
  if (!value) throw new Error('PRIYASA_API_BASE_URL is not configured.');
  return value.replace(/\/$/, '');
}

function safePath(value: string) {
  const path = value.replace(/^\/+/, '').replace(/\/+/g, '/');
  if (!path || path.includes('..') || path.includes('\\') || /^https?:/i.test(path)) return null;
  return path;
}

function tokenFrom(body: any) {
  return body?.access_token || body?.token || body?.data?.access_token || body?.data?.token || null;
}

function clearCookie(response: NextResponse) {
  response.cookies.set(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

async function proxy(request: NextRequest) {
  const path = safePath(request.nextUrl.searchParams.get('path') || '');
  if (!path) return NextResponse.json({ message: 'Invalid Priyasa API path.' }, { status: 400 });

  const method = request.method.toUpperCase();
  const target = `${upstreamBase()}/${path}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('cookie');
  headers.set('accept', 'application/json');

  const session = request.cookies.get(COOKIE)?.value;
  if (session) headers.set('authorization', `Bearer ${session}`);

  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
  if (MUTATING.has(method) && !headers.has('idempotency-key')) {
    headers.set('idempotency-key', crypto.randomUUID());
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, redirect: 'manual', cache: 'no-store' });
  } catch {
    return NextResponse.json({ message: 'Unable to reach PRIYASA Core.' }, { status: 502 });
  }

  const raw = await upstream.text();
  const out = new NextResponse(raw, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
  });

  if (path === 'auth/verify-otp' && upstream.ok) {
    try {
      const token = tokenFrom(JSON.parse(raw));
      if (typeof token === 'string' && token.length > 20) {
        out.cookies.set(COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    } catch {
      // Preserve the upstream response when it is not JSON.
    }
  }

  if (path === 'auth/logout' && (upstream.ok || upstream.status === 401)) clearCookie(out);
  if (upstream.status === 401) clearCookie(out);

  return out;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
