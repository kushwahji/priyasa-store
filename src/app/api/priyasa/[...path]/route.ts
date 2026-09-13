import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_access_token';
const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'content-length', 'host']);

function upstreamUrl(path: string[], request: NextRequest) {
  if (!UPSTREAM) throw new Error('PRIYASA_API_BASE_URL is not configured.');
  const clean = path.map(segment => encodeURIComponent(segment)).join('/');
  return `${UPSTREAM}/${clean}${request.nextUrl.search}`;
}

function forwardedHeaders(request: NextRequest) {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP.has(lower) && lower !== 'cookie') headers.set(key, value);
  });
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('X-Forwarded-Host', request.headers.get('host') || '');
  return headers;
}

function sessionCookieOptions(value: string, maxAge: number) {
  return { name: SESSION_COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}

function clearSession(result: NextResponse) {
  result.cookies.set(sessionCookieOptions('', 0));
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const response = await fetch(upstreamUrl(path, request), {
      method: request.method,
      headers: forwardedHeaders(request),
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json().catch(() => null) : await response.arrayBuffer();
    const result = isJson ? NextResponse.json(payload, { status: response.status }) : new NextResponse(payload, { status: response.status });

    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!HOP_BY_HOP.has(lower) && lower !== 'content-type' && lower !== 'set-cookie') result.headers.set(key, value);
    });
    if (contentType) result.headers.set('content-type', contentType);

    const upstreamCookie = response.headers.get('set-cookie');
    if (upstreamCookie) result.headers.append('set-cookie', upstreamCookie);

    const pathname = `/${path.join('/')}`;
    const body = isJson && payload && typeof payload === 'object' ? payload as Record<string, any> : null;
    const data = body?.data && typeof body.data === 'object' ? dataOrNull(body.data) : null;
    const token = body?.access_token || body?.token || body?.accessToken || data?.access_token || data?.token || data?.accessToken;

    if (response.ok && (pathname === '/auth/verify-otp' || pathname === '/storefront/session/rotate') && typeof token === 'string' && token.length > 0) {
      result.cookies.set(sessionCookieOptions(token, 60 * 60 * 24 * 30));
    }
    if (pathname === '/auth/logout' || pathname === '/storefront/session/logout' || pathname === '/storefront/session/logout-all') {
      clearSession(result);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach PriyasaCore.';
    return NextResponse.json({ message }, { status: 502 });
  }
}

function dataOrNull(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' ? value as Record<string, any> : null;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
