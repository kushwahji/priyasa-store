import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_access_token';
const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'content-length', 'host']);
const MUTATIONS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SESSION_ISSUE_PATHS = new Set(['/auth/verify-otp', '/storefront/session/rotate']);
const SESSION_CLEAR_PATHS = new Set(['/auth/logout', '/storefront/session/logout', '/storefront/session/logout-all']);
const PUBLIC_PREFIXES = ['/auth/', '/storefront/'];
const UPSTREAM_TIMEOUT_MS = 15_000;

function upstreamUrl(path: string[], request: NextRequest) {
  if (!UPSTREAM) throw new Error('PRIYASA_API_BASE_URL is not configured.');
  const clean = path.map(segment => encodeURIComponent(segment)).join('/');
  return `${UPSTREAM}/${clean}${request.nextUrl.search}`;
}

function allowedPath(pathname: string) {
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin;
}

function forwardedHeaders(request: NextRequest) {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP.has(lower) && lower !== 'cookie' && lower !== 'authorization') headers.set(key, value);
  });
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('X-Forwarded-Host', request.headers.get('host') || '');
  headers.set('X-Forwarded-Proto', request.nextUrl.protocol.replace(':', ''));
  return headers;
}

function sessionCookieOptions(value: string, maxAge: number) {
  return { name: SESSION_COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}

function clearSession(result: NextResponse) {
  result.cookies.set(sessionCookieOptions('', 0));
}

function dataOrNull(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' ? value as Record<string, any> : null;
}

function tokenFrom(payload: unknown) {
  const body = dataOrNull(payload);
  const data = body?.data && typeof body.data === 'object' ? dataOrNull(body.data) : null;
  return body?.access_token || body?.token || body?.accessToken || data?.access_token || data?.token || data?.accessToken;
}

function publicAuthPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const source = payload as Record<string, any>;
  const data = source.data && typeof source.data === 'object' ? source.data as Record<string, any> : null;
  const strip = (value: Record<string, any>) => {
    const copy = { ...value };
    delete copy.access_token;
    delete copy.token;
    delete copy.accessToken;
    return copy;
  };
  const result = strip(source);
  if (data) result.data = strip(data);
  return result;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const pathname = `/${path.join('/')}`;
    if (!allowedPath(pathname)) {
      return NextResponse.json({ message: 'API surface is not available through the Store.' }, { status: 404 });
    }
    if (MUTATIONS.has(request.method) && !allowedOrigin(request)) {
      return NextResponse.json({ message: 'Cross-origin request rejected.' }, { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(upstreamUrl(path, request), {
        method: request.method,
        headers: forwardedHeaders(request),
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
        cache: 'no-store',
        redirect: 'manual',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const rawPayload = isJson ? await response.json().catch(() => null) : await response.arrayBuffer();
    const body = isJson && rawPayload && typeof rawPayload === 'object' ? rawPayload as Record<string, any> : null;
    const token = tokenFrom(rawPayload);
    const payload = isJson && SESSION_ISSUE_PATHS.has(pathname) ? publicAuthPayload(rawPayload) : rawPayload;
    const result = isJson ? NextResponse.json(payload, { status: response.status }) : new NextResponse(payload, { status: response.status });

    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!HOP_BY_HOP.has(lower) && lower !== 'content-type' && lower !== 'set-cookie') result.headers.set(key, value);
    });
    if (contentType) result.headers.set('content-type', contentType);

    if (response.ok && SESSION_ISSUE_PATHS.has(pathname) && typeof token === 'string' && token.length > 0) {
      result.cookies.set(sessionCookieOptions(token, 60 * 60 * 24 * 30));
    }
    if (SESSION_CLEAR_PATHS.has(pathname) || response.status === 401) {
      clearSession(result);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'PriyasaCore request timed out. Please try again.'
      : error instanceof Error ? error.message : 'Unable to reach PriyasaCore.';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
