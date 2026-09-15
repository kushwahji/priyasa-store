import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || 'https://api.priyasa.com/api/v1').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_access_token';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const MAX_BODY_BYTES = 1024 * 1024;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) { return proxy(request); }
export async function POST(request: NextRequest) { return proxy(request); }
export async function PUT(request: NextRequest) { return proxy(request); }
export async function PATCH(request: NextRequest) { return proxy(request); }
export async function DELETE(request: NextRequest) { return proxy(request); }

function sessionCookie(value: string, maxAge: number) {
  return { name: SESSION_COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}

function requestId(request: NextRequest) {
  return request.headers.get('x-correlation-id') || crypto.randomUUID();
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).origin === request.nextUrl.origin; } catch { return false; }
}

function allowedEndpoint(endpoint: string) {
  return endpoint.startsWith('/auth/') || endpoint.startsWith('/storefront/');
}

async function proxy(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get('_path');
  const method = request.method.toUpperCase();

  // This is a same-origin transport, never a general-purpose URL proxy.
  if (!endpoint || !endpoint.startsWith('/') || endpoint.startsWith('//') || endpoint.includes('\\') || endpoint.includes('/../') || endpoint === '/..' || !allowedEndpoint(endpoint)) {
    return NextResponse.json({ message: 'Unsupported PriyasaCore API path.' }, { status: 400 });
  }
  if (!SAFE_METHODS.has(method) && !sameOrigin(request)) {
    return NextResponse.json({ message: 'Cross-origin mutation rejected.' }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ message: 'Request body is too large.' }, { status: 413 });

  const upstreamParams = new URLSearchParams(request.nextUrl.searchParams);
  upstreamParams.delete('_path');
  const query = upstreamParams.toString();
  const upstreamUrl = `${UPSTREAM}${endpoint}${query ? `?${query}` : ''}`;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const correlationId = requestId(request);
  const headers = new Headers({ Accept: 'application/json', 'X-Correlation-ID': correlationId });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body: SAFE_METHODS.has(method) ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Unable to reach PriyasaCore API.', correlation_id: correlationId }, { status: 502, headers: { 'X-Correlation-ID': correlationId } });
  }

  let body = await upstream.arrayBuffer();
  let verifyToken: string | undefined;

  // Keep Core's bearer credential entirely server-side. Browser JavaScript gets
  // only the sanitized verification response; the BFF owns the HttpOnly cookie.
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
    } catch { /* Preserve non-JSON upstream responses. */ }
  }

  const response = new NextResponse(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json', 'X-Correlation-ID': correlationId, 'Cache-Control': 'no-store' },
  });

  if (upstream.status === 401 || endpoint === '/auth/logout') response.cookies.set(sessionCookie('', 0));
  if (endpoint === '/auth/verify-otp' && upstream.ok && verifyToken) response.cookies.set(sessionCookie(verifyToken, SESSION_MAX_AGE));

  return response;
}
