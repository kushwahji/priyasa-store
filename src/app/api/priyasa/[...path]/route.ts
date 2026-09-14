import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_session';
const TIMEOUT_MS = 15_000;

function extractToken(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  for (const key of ['access_token', 'accessToken', 'token']) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  for (const key of ['data', 'session', 'auth', 'result']) {
    const token = extractToken(record[key]);
    if (token) return token;
  }
  return null;
}

function withoutToken(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const record = { ...(value as Record<string, unknown>) };
  delete record.access_token;
  delete record.accessToken;
  delete record.token;
  for (const key of ['data', 'session', 'auth', 'result']) {
    if (record[key] && typeof record[key] === 'object') record[key] = withoutToken(record[key]);
  }
  return record;
}

function isMutation(method: string) { return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method); }
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin;
}
function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 30 };
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!UPSTREAM) return NextResponse.json({ message: 'PRIYASA_API_BASE_URL is not configured.' }, { status: 500 });
  if (isMutation(request.method) && !sameOrigin(request)) return NextResponse.json({ message: 'Cross-origin request rejected.' }, { status: 403 });

  const { path } = await context.params;
  const route = path.join('/');
  const target = `${UPSTREAM}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (['host', 'content-length', 'connection', 'cookie', 'authorization', 'x-priyasa-store-proxy'].includes(key.toLowerCase())) continue;
    headers.set(key, value);
  }
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) headers.set('Authorization', `Bearer ${session}`);

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store', redirect: 'manual', signal: controller.signal });
    const responseBody = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type');
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    if (contentType) responseHeaders.set('content-type', contentType);
    for (const name of ['etag', 'x-request-id', 'x-correlation-id']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    let outgoingBody: BodyInit = responseBody;
    let parsedBody: unknown = null;
    if (contentType?.includes('application/json')) {
      try { parsedBody = JSON.parse(new TextDecoder().decode(responseBody)); } catch { parsedBody = null; }
    }

    let token: string | null = null;
    if (route === 'auth/verify-otp' && upstream.ok && parsedBody !== null) {
      token = extractToken(parsedBody);
      outgoingBody = JSON.stringify(withoutToken(parsedBody));
    }

    const response = new NextResponse(outgoingBody, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
    if (token) response.cookies.set(SESSION_COOKIE, token, cookieOptions());
    if (route === 'auth/logout' || upstream.status === 401) response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return NextResponse.json({ message: 'PriyasaCore API request timed out' }, { status: 504 });
    return NextResponse.json({ message: 'Unable to reach PriyasaCore API' }, { status: 502 });
  } finally { clearTimeout(timeout); }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const dynamic = 'force-dynamic';
