import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_session';
const TOKEN_COOKIE = 'priyasa_access';
const COOKIE_OPTIONS = { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 30 };
const ALLOWED_HEADERS = ['accept', 'authorization', 'content-type', 'idempotency-key', 'x-correlation-id', 'x-request-id'];

function extractToken(body: any, authorizationHeader?: string | null) { return body?.data?.access_token || body?.data?.token || body?.access_token || body?.token || authorizationHeader?.replace(/^Bearer\s+/i, '') || null; }
function stripToken(body: any) {
  if (!body || typeof body !== 'object') return { authenticated: true };
  const { access_token: _accessToken, token: _token, ...top } = body;
  if (top.data && typeof top.data === 'object') { const { access_token: _dataAccessToken, token: _dataToken, ...data } = top.data; return { ...top, authenticated: true, data: { ...data, authenticated: true } }; }
  return { ...top, authenticated: true };
}
function clearSession(response: NextResponse) { response.cookies.set(SESSION_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 }); response.cookies.set(TOKEN_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 }); }
function sameOrigin(request: NextRequest) { const origin = request.headers.get('origin'); return !origin || origin === request.nextUrl.origin; }

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!UPSTREAM) return NextResponse.json({ message: 'PRIYASA_API_BASE_URL is not configured on the Store server', code: 'UPSTREAM_NOT_CONFIGURED' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  const method = request.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !sameOrigin(request)) return NextResponse.json({ message: 'Cross-origin request rejected', code: 'ORIGIN_REJECTED' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const { path } = await context.params;
  if (!path?.length || path.some(part => part === '.' || part === '..')) return NextResponse.json({ message: 'Invalid API path' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });

  const normalizedPath = `/${path.join('/')}`;
  const target = `${UPSTREAM}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of ALLOWED_HEADERS) { const value = request.headers.get(name); if (value) headers.set(name, value); }
  const cookieToken = request.cookies.get(TOKEN_COOKIE)?.value;
  if (cookieToken) headers.set('authorization', `Bearer ${cookieToken}`);
  const body = method === 'GET' || method === 'HEAD' || method === 'DELETE' ? undefined : await request.arrayBuffer();

  try {
    const upstream = await fetch(target, { method, headers, body, cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const contentType = upstream.headers.get('content-type') || 'application/json';
    const text = await upstream.text();
    let payload: any = null;
    try { payload = text ? JSON.parse(text) : null; } catch { /* preserve non-JSON upstream body */ }

    // Never expose bearer tokens to browser JavaScript. Authentication and
    // session-rotation responses are converted into HttpOnly cookies here.
    const isTokenResponse = upstream.ok && (normalizedPath === '/auth/verify-otp' || normalizedPath === '/storefront/session/rotate');
    const output = isTokenResponse ? JSON.stringify(stripToken(payload)) : text;
    const response = new NextResponse(output || null, { status: upstream.status, statusText: upstream.statusText, headers: { 'content-type': contentType, 'cache-control': 'no-store, max-age=0', 'x-content-type-options': 'nosniff' } });
    const correlationId = upstream.headers.get('x-correlation-id');
    if (correlationId) response.headers.set('x-correlation-id', correlationId);
    if (upstream.status === 401) clearSession(response);

    if (isTokenResponse) {
      const accessToken = extractToken(payload, upstream.headers.get('authorization'));
      if (accessToken) { response.cookies.set(TOKEN_COOKIE, accessToken, COOKIE_OPTIONS); response.cookies.set(SESSION_COOKIE, '1', COOKIE_OPTIONS); }
    }
    if ((normalizedPath === '/auth/logout' || normalizedPath === '/storefront/session/logout' || normalizedPath === '/storefront/session/logout-all') && upstream.ok) clearSession(response);
    return response;
  } catch (error) {
    console.error('[PRIYASA_PROXY_UPSTREAM_ERROR]', { target, method, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: 'PRIYASA Core could not be reached from the Store server', code: 'UPSTREAM_UNAVAILABLE' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
