import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || '').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_session';
const UPSTREAM_TIMEOUT_MS = 20_000;

function extractToken(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const direct = [record.access_token, record.accessToken, record.token].find(
    (v) => typeof v === 'string' && v.length > 20,
  );
  if (direct) return direct as string;
  if (record.data && typeof record.data === 'object') return extractToken(record.data);
  return null;
}

function isMutation(method: string) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin;
}

export async function ALL(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!UPSTREAM) {
    return NextResponse.json({ message: 'PRIYASA_API_BASE_URL is not configured.' }, { status: 500 });
  }

  if (isMutation(request.method) && !allowedOrigin(request)) {
    return NextResponse.json({ message: 'Cross-origin request rejected.' }, { status: 403 });
  }

  const { path } = await context.params;
  const target = `${UPSTREAM}/${path.map((part) => encodeURIComponent(part)).join('/')}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);

  // Browser security headers must terminate at the storefront BFF. Forwarding the
  // browser Origin/Referer to PriyasaCore can make a valid same-origin BFF request
  // look like a cross-origin API request to the upstream server.
  for (const name of [
    'host',
    'content-length',
    'cookie',
    'origin',
    'referer',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-dest',
    'authorization',
  ]) {
    headers.delete(name);
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) headers.set('Authorization', `Bearer ${session}`);

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'PriyasaCore request timed out.'
      : 'PriyasaCore is temporarily unavailable.';
    return NextResponse.json({ message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  const contentType = upstream.headers.get('content-type') || '';
  const responseBody = await upstream.arrayBuffer();
  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', contentType || 'application/json');
  for (const name of ['cache-control', 'etag', 'x-request-id', 'x-correlation-id']) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
  const route = path.join('/');
  const clear = () => response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  if (route === 'auth/verify-otp' && upstream.ok && contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(responseBody));
      const token = extractToken(parsed);
      if (token) {
        response.cookies.set(SESSION_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    } catch {
      // Keep the upstream response intact even if its JSON is not parseable here.
    }
  }

  if (route === 'auth/logout' || upstream.status === 401) clear();
  return response;
}

export const GET = ALL;
export const POST = ALL;
export const PUT = ALL;
export const PATCH = ALL;
export const DELETE = ALL;
export const HEAD = ALL;
