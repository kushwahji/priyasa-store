import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = (process.env.PRIYASA_API_BASE_URL || process.env.PRIYASA_API_URL || 'https://api.priyasa.com/api/v1').replace(/\/$/, '');
const SESSION_COOKIE = 'priyasa_access_token';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) { return proxy(request); }
export async function POST(request: NextRequest) { return proxy(request); }
export async function PUT(request: NextRequest) { return proxy(request); }
export async function PATCH(request: NextRequest) { return proxy(request); }
export async function DELETE(request: NextRequest) { return proxy(request); }

async function proxy(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get('path') || '/';
  const upstreamUrl = `${UPSTREAM}${endpoint}${request.nextUrl.search.replace(/([?&])path=[^&]*&?/, '$1').replace(/[?&]$/, '')}`;
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

  const body = await upstream.arrayBuffer();
  const response = new NextResponse(body, { status: upstream.status, statusText: upstream.statusText, headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' } });
  if (upstream.status === 401 || endpoint === '/auth/logout') response.cookies.set({ name: SESSION_COOKIE, value: '', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  if (endpoint === '/auth/verify-otp' && upstream.ok) {
    try {
      const payload = JSON.parse(new TextDecoder().decode(body));
      const accessToken = payload.access_token || payload.token || payload.data?.access_token || payload.data?.token;
      if (accessToken) response.cookies.set({ name: SESSION_COOKIE, value: accessToken, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE });
    } catch { /* Preserve upstream response. */ }
  }
  return response;
}
