import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || 'https://api.priyasa.com/api/v1').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_access_token';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) { return proxy(request); }
export async function POST(request: NextRequest) { return proxy(request); }
export async function PUT(request: NextRequest) { return proxy(request); }
export async function PATCH(request: NextRequest) { return proxy(request); }
export async function DELETE(request: NextRequest) { return proxy(request); }

function sessionCookie(value: string, maxAge: number) {
  return { name: SESSION_COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}

async function proxy(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get('_path');
  if (!endpoint || !endpoint.startsWith('/') || endpoint.startsWith('//')) {
    return NextResponse.json({ message: 'Invalid PriyasaCore API path.' }, { status: 400 });
  }

  const upstreamParams = new URLSearchParams(request.nextUrl.searchParams);
  upstreamParams.delete('_path');
  const query = upstreamParams.toString();
  const upstreamUrl = `${UPSTREAM}${endpoint}${query ? `?${query}` : ''}`;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const headers = new Headers({ Accept: 'application/json' });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const correlationId = request.headers.get('x-correlation-id');
  if (correlationId) headers.set('X-Correlation-ID', correlationId);
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Unable to reach PriyasaCore API.' }, { status: 502 });
  }

  let body = await upstream.arrayBuffer();
  let verifyToken: string | undefined;

  // Never send a bearer credential back to browser JavaScript. The BFF converts
  // the Core token response into an HttpOnly session cookie instead.
  if (endpoint === '/auth/verify-otp' && upstream.ok) {
    try {
      const payload = JSON.parse(new TextDecoder().decode(body));
      verifyToken = payload.access_token || payload.token || payload.data?.access_token || payload.data?.token;
      if (verifyToken) {
        const sanitized = structuredClone(payload);
        delete sanitized.access_token;
        delete sanitized.token;
        if (sanitized.data && typeof sanitized.data === 'object') {
          delete sanitized.data.access_token;
          delete sanitized.data.token;
        }
        body = new TextEncoder().encode(JSON.stringify(sanitized)).buffer;
      }
    } catch { /* Preserve the upstream response when it is not JSON. */ }
  }

  const response = new NextResponse(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });

  if (upstream.status === 401 || endpoint === '/auth/logout') {
    response.cookies.set(sessionCookie('', 0));
  }

  if (endpoint === '/auth/verify-otp' && upstream.ok && verifyToken) {
    response.cookies.set(sessionCookie(verifyToken, SESSION_MAX_AGE));
  }

  return response;
}
