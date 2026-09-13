import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_session';
const TOKEN_COOKIE = 'priyasa_access';
const ALLOWED_HEADERS = ['accept', 'authorization', 'content-type', 'idempotency-key', 'x-correlation-id', 'x-request-id'];

function extractToken(body: any) {
  return body?.data?.access_token || body?.data?.token || body?.access_token || body?.token || null;
}

function stripToken(body: any) {
  if (!body || typeof body !== 'object') return { authenticated: true };
  const { access_token: _accessToken, token: _token, ...top } = body;
  if (top.data && typeof top.data === 'object') {
    const { access_token: _dataAccessToken, token: _dataToken, ...data } = top.data;
    return { ...top, authenticated: true, data: { ...data, authenticated: true } };
  }
  return { ...top, authenticated: true };
}

function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  response.cookies.set(TOKEN_COOKIE, '', {
    path: '/', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
  });
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!UPSTREAM) return NextResponse.json({ message: 'PRIYASA_API_BASE_URL is not configured', code: 'UPSTREAM_NOT_CONFIGURED' }, { status: 500 });

  const { path } = await context.params;
  if (!path?.length || path.some((part) => part === '.' || part === '..')) {
    return NextResponse.json({ message: 'Invalid API path' }, { status: 400 });
  }

  const target = `${UPSTREAM}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of ALLOWED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const cookieToken = request.cookies.get(TOKEN_COOKIE)?.value;
  if (cookieToken) headers.set('authorization', `Bearer ${cookieToken}`);

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' || method === 'DELETE' ? undefined : await request.arrayBuffer();

  try {
    const upstream = await fetch(target, {
      method, headers, body, cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(15000),
    });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    const text = await upstream.text();
    let payload: any = null;
    try { payload = text ? JSON.parse(text) : null; } catch { /* preserve non-JSON upstream body */ }
    const normalizedPath = `/${path.join('/')}`;
    const isVerify = upstream.ok && normalizedPath === '/auth/verify-otp';
    const output = isVerify ? JSON.stringify(stripToken(payload)) : text;

    const response = new NextResponse(output || null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: { 'content-type': contentType },
    });

    const correlationId = upstream.headers.get('x-correlation-id');
    if (correlationId) response.headers.set('x-correlation-id', correlationId);
    if (upstream.status === 401) clearSession(response);

    if (isVerify) {
      const accessToken = extractToken(payload);
      if (accessToken) {
        response.cookies.set(TOKEN_COOKIE, accessToken, {
          path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
        });
        response.cookies.set(SESSION_COOKIE, '1', {
          path: '/', httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
        });
      }
    }

    if (normalizedPath === '/auth/logout' && upstream.ok) clearSession(response);
    return response;
  } catch {
    return NextResponse.json({ message: 'PRIYASA Core is unavailable', code: 'UPSTREAM_UNAVAILABLE' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
